import { createHash } from 'crypto';
import type { IDataObject } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';
import { completeApiError } from './OnPrintShopSafeError';

/** Carries only classifier-owned text/code and validated HTTP status to the node boundary. */
export class CompletePaginationRequestError extends Error {
	readonly code: string;
	readonly statusCode?: number;

	constructor(error: unknown, status?: number) {
		const failure = completeApiError(status === undefined ? error : {
			...(isRecord(error) ? error : {}), message: (error as Error)?.message, httpCode: status,
		});
		super(failure.message);
		this.code = failure.code;
		if (status !== undefined) this.statusCode = status;
	}
}

export interface CompletePaginationOptions {
	/** Receives absolute offsets; returns the unwrapped operation result, not data/root. */
	fetchPage: (offset: number, limit: number) => Promise<IDataObject>;
	recordField: string;
	totalField?: string;
	currentCountField?: string;
	initialOffset?: number;
	pageSize?: number;
	/** An intentional output cap, not a safety limit. Zero performs no requests. */
	maxRecords?: number;
	maxPages?: number;
	/** Milliseconds between requests only. */
	pageDelay?: number;
}

export interface CompletePaginationResult {
	records: IDataObject[];
	/** Server total, including records before initialOffset; absent when unknown. */
	total?: number;
	/** Aggregate returned count, not the last page's count. */
	currentCount: number;
	/** Nonempty pages only, matching legacy _totalPages. */
	pages: number;
	/** Validated configured size; the last request may use a smaller limit. */
	pageSize: number;
	/** Successful responses, including a final empty page; excludes retry attempts. */
	pageCount: number;
	nextOffset: number;
	/** maxRecords does not claim that the server collection was exhausted. */
	stopReason: 'exhausted' | 'maxRecords';
}

export const COMPLETE_PAGINATION_LIMITS = Object.freeze({
	initialOffset: 2_147_483_647,
	pageSize: 1_000,
	maxRecords: 2_147_483_647,
	maxPages: 10_000,
	pageDelay: 60_000,
});

function integer(value: number, name: string, minimum: number, maximum: number): number {
	if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
		throw new Error(`Complete pagination: ${name} must be an integer between ${minimum} and ${maximum}`);
	}
	return value;
}

function count(value: unknown): number | undefined {
	if (value === undefined || value === null) return undefined;
	const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
	if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed < 0) {
		throw new Error('Complete pagination: invalid response count');
	}
	return parsed;
}

function isRecord(value: unknown): value is IDataObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function httpStatus(error: unknown): number | undefined {
	if (!isRecord(error)) return undefined;
	const response = isRecord(error.response) ? error.response : {};
	const value = error.statusCode ?? error.httpCode ?? error.status ?? response.statusCode ?? response.status;
	const status = typeof value === 'string' && /^\d{3}$/.test(value) ? Number(value) : value;
	return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}

// Sort object keys for stable page fingerprints without retaining serialized payloads.
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	if (isRecord(value)) {
		return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'undefined';
}

/**
 * Known totals govern completion even when the server caps pages below the request.
 * Without a total, only an empty page is exhaustion. Counts must match rows: advancing
 * past missing rows would silently skip records. Repeated pages fail, never deduplicate.
 * Callers must select the record/count fields and keep filters and ordering stable.
 */
export async function paginateCompleteApi(options: CompletePaginationOptions): Promise<CompletePaginationResult> {
	const { fetchPage, recordField, totalField, currentCountField } = options;
	if (typeof fetchPage !== 'function' || !recordField ||
		[recordField, totalField, currentCountField].some(field => field !== undefined &&
			(typeof field !== 'string' || !/^[_A-Za-z][_0-9A-Za-z]*$/.test(field)))) {
		throw new Error('Complete pagination: invalid callback or field names');
	}
	const initialOffset = integer(options.initialOffset === undefined ? 0 : options.initialOffset, 'initialOffset', 0, COMPLETE_PAGINATION_LIMITS.initialOffset);
	const pageSize = integer(options.pageSize === undefined ? 250 : options.pageSize, 'pageSize', 1, COMPLETE_PAGINATION_LIMITS.pageSize);
	const maxPages = integer(options.maxPages === undefined ? 1_000 : options.maxPages, 'maxPages', 1, COMPLETE_PAGINATION_LIMITS.maxPages);
	const pageDelay = integer(options.pageDelay === undefined ? 50 : options.pageDelay, 'pageDelay', 0, COMPLETE_PAGINATION_LIMITS.pageDelay);
	const maxRecords = options.maxRecords === undefined ? undefined :
		integer(options.maxRecords, 'maxRecords', 0, COMPLETE_PAGINATION_LIMITS.maxRecords);
	const records: IDataObject[] = [];
	const seenPages = new Set<string>();
	let total: number | undefined;
	let offset = initialOffset;
	let pageCount = 0;
	let pages = 0;
	const result = (stopReason: CompletePaginationResult['stopReason']): CompletePaginationResult => ({
		records, ...(total === undefined ? {} : { total }), currentCount: records.length,
		pages, pageSize, pageCount, nextOffset: offset, stopReason,
	});
	if (maxRecords === 0) return result('maxRecords');
	while (pageCount < maxPages) {
		integer(offset, 'offset', 0, COMPLETE_PAGINATION_LIMITS.initialOffset);
		const limit = Math.min(pageSize, maxRecords === undefined ? pageSize : maxRecords - records.length,
			total === undefined ? pageSize : total - offset);
		if (pageCount > 0 && pageDelay > 0) await sleep(pageDelay);
		let page: IDataObject;
		for (let attempt = 0; ; attempt++) {
			try {
				page = await fetchPage(offset, limit);
				break;
			} catch (error) {
				const status = httpStatus(error);
				if ((status === 429 || status === 502) && attempt < 3) {
					await sleep(Math.min(Math.max(pageDelay, 25) * 2 ** attempt, 1_000));
					continue;
				}
				// No node context here; executeCompleteApi wraps this sanitized error contextually.
				// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
				throw new CompletePaginationRequestError(error, status);
			}
		}
		pageCount++;
		if (!isRecord(page) || !Array.isArray(page[recordField]) ||
			!(page[recordField] as unknown[]).every(isRecord)) {
			throw new Error('Complete pagination: response record field must be an object array');
		}
		const rows = page[recordField] as IDataObject[];
		const pageTotal = totalField === undefined ? undefined : count(page[totalField]);
		const currentCount = (currentCountField === undefined ? undefined : count(page[currentCountField])) ?? rows.length;
		if (currentCount !== rows.length || rows.length > limit) {
			throw new Error('Complete pagination: inconsistent page count or response exceeds requested limit');
		}
		if (pageTotal !== undefined) {
			if (total !== undefined && total !== pageTotal) throw new Error('Complete pagination: total changed during pagination');
			total = pageTotal;
		}
		if (total !== undefined && (rows.length > Math.max(0, total - offset) ||
			(records.length > 0 && offset > total))) {
			throw new Error('Complete pagination: rows exceed known total');
		}
		if (rows.length === 0) {
			if (total !== undefined && offset < total) throw new Error('Complete pagination: early exhaustion before known total; no progress');
			return result('exhausted');
		}
		let fingerprint: string;
		try {
			fingerprint = createHash('sha256').update(canonical(rows)).digest('hex');
		} catch {
			// This context-free helper is wrapped in NodeOperationError by executeCompleteApi.
			// eslint-disable-next-line @n8n/community-nodes/require-node-api-error
			throw new Error('Complete pagination: unable to fingerprint response page');
		}
		if (seenPages.has(fingerprint)) throw new Error('Complete pagination: repeated page; no progress');
		seenPages.add(fingerprint);
		pages++;
		records.push(...rows);
		offset += currentCount;
		if (total !== undefined && offset >= total) return result('exhausted');
		if (maxRecords !== undefined && records.length >= maxRecords) return result('maxRecords');
	}
	throw new Error(`Complete pagination: maxPages (${maxPages}) reached before exhaustion`);
}
