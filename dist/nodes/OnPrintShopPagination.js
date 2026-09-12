"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETE_PAGINATION_LIMITS = exports.CompletePaginationRequestError = void 0;
exports.paginateCompleteApi = paginateCompleteApi;
const crypto_1 = require("crypto");
const n8n_workflow_1 = require("n8n-workflow");
const OnPrintShopSafeError_1 = require("./OnPrintShopSafeError");
/** Carries only classifier-owned text/code and validated HTTP status to the node boundary. */
class CompletePaginationRequestError extends Error {
    constructor(error, status) {
        const failure = (0, OnPrintShopSafeError_1.completeApiError)(status === undefined ? error : {
            ...(isRecord(error) ? error : {}), message: error === null || error === void 0 ? void 0 : error.message, httpCode: status,
        });
        super(failure.message);
        this.code = failure.code;
        if (status !== undefined)
            this.statusCode = status;
    }
}
exports.CompletePaginationRequestError = CompletePaginationRequestError;
exports.COMPLETE_PAGINATION_LIMITS = Object.freeze({
    initialOffset: 2147483647,
    pageSize: 1000,
    maxRecords: 2147483647,
    maxPages: 10000,
    pageDelay: 60000,
});
function integer(value, name, minimum, maximum) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
        throw new Error(`Complete pagination: ${name} must be an integer between ${minimum} and ${maximum}`);
    }
    return value;
}
function count(value) {
    if (value === undefined || value === null)
        return undefined;
    const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed < 0) {
        throw new Error('Complete pagination: invalid response count');
    }
    return parsed;
}
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function httpStatus(error) {
    var _a, _b, _c, _d;
    if (!isRecord(error))
        return undefined;
    const response = isRecord(error.response) ? error.response : {};
    const value = (_d = (_c = (_b = (_a = error.statusCode) !== null && _a !== void 0 ? _a : error.httpCode) !== null && _b !== void 0 ? _b : error.status) !== null && _c !== void 0 ? _c : response.statusCode) !== null && _d !== void 0 ? _d : response.status;
    const status = typeof value === 'string' && /^\d{3}$/.test(value) ? Number(value) : value;
    return typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}
// Sort object keys for stable page fingerprints without retaining serialized payloads.
function canonical(value) {
    var _a;
    if (Array.isArray(value))
        return `[${value.map(canonical).join(',')}]`;
    if (isRecord(value)) {
        return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    }
    return (_a = JSON.stringify(value)) !== null && _a !== void 0 ? _a : 'undefined';
}
/**
 * Known totals govern completion even when the server caps pages below the request.
 * Without a total, only an empty page is exhaustion. Counts must match rows: advancing
 * past missing rows would silently skip records. Repeated pages fail, never deduplicate.
 * Callers must select the record/count fields and keep filters and ordering stable.
 */
async function paginateCompleteApi(options) {
    var _a;
    const { fetchPage, recordField, totalField, currentCountField } = options;
    if (typeof fetchPage !== 'function' || !recordField ||
        [recordField, totalField, currentCountField].some(field => field !== undefined &&
            (typeof field !== 'string' || !/^[_A-Za-z][_0-9A-Za-z]*$/.test(field)))) {
        throw new Error('Complete pagination: invalid callback or field names');
    }
    const initialOffset = integer(options.initialOffset === undefined ? 0 : options.initialOffset, 'initialOffset', 0, exports.COMPLETE_PAGINATION_LIMITS.initialOffset);
    const pageSize = integer(options.pageSize === undefined ? 250 : options.pageSize, 'pageSize', 1, exports.COMPLETE_PAGINATION_LIMITS.pageSize);
    const maxPages = integer(options.maxPages === undefined ? 1000 : options.maxPages, 'maxPages', 1, exports.COMPLETE_PAGINATION_LIMITS.maxPages);
    const pageDelay = integer(options.pageDelay === undefined ? 50 : options.pageDelay, 'pageDelay', 0, exports.COMPLETE_PAGINATION_LIMITS.pageDelay);
    const maxRecords = options.maxRecords === undefined ? undefined :
        integer(options.maxRecords, 'maxRecords', 0, exports.COMPLETE_PAGINATION_LIMITS.maxRecords);
    const records = [];
    const seenPages = new Set();
    let total;
    let offset = initialOffset;
    let pageCount = 0;
    let pages = 0;
    const result = (stopReason) => ({
        records, ...(total === undefined ? {} : { total }), currentCount: records.length,
        pages, pageSize, pageCount, nextOffset: offset, stopReason,
    });
    if (maxRecords === 0)
        return result('maxRecords');
    while (pageCount < maxPages) {
        integer(offset, 'offset', 0, exports.COMPLETE_PAGINATION_LIMITS.initialOffset);
        const limit = Math.min(pageSize, maxRecords === undefined ? pageSize : maxRecords - records.length, total === undefined ? pageSize : total - offset);
        if (pageCount > 0 && pageDelay > 0)
            await (0, n8n_workflow_1.sleep)(pageDelay);
        let page;
        for (let attempt = 0;; attempt++) {
            try {
                page = await fetchPage(offset, limit);
                break;
            }
            catch (error) {
                const status = httpStatus(error);
                if ((status === 429 || status === 502) && attempt < 3) {
                    await (0, n8n_workflow_1.sleep)(Math.min(Math.max(pageDelay, 25) * 2 ** attempt, 1000));
                    continue;
                }
                // No node context here; executeCompleteApi wraps this sanitized error contextually.
                // eslint-disable-next-line @n8n/community-nodes/require-node-api-error
                throw new CompletePaginationRequestError(error, status);
            }
        }
        pageCount++;
        if (!isRecord(page) || !Array.isArray(page[recordField]) ||
            !page[recordField].every(isRecord)) {
            throw new Error('Complete pagination: response record field must be an object array');
        }
        const rows = page[recordField];
        const pageTotal = totalField === undefined ? undefined : count(page[totalField]);
        const currentCount = (_a = (currentCountField === undefined ? undefined : count(page[currentCountField]))) !== null && _a !== void 0 ? _a : rows.length;
        if (currentCount !== rows.length || rows.length > limit) {
            throw new Error('Complete pagination: inconsistent page count or response exceeds requested limit');
        }
        if (pageTotal !== undefined) {
            if (total !== undefined && total !== pageTotal)
                throw new Error('Complete pagination: total changed during pagination');
            total = pageTotal;
        }
        if (total !== undefined && (rows.length > Math.max(0, total - offset) ||
            (records.length > 0 && offset > total))) {
            throw new Error('Complete pagination: rows exceed known total');
        }
        if (rows.length === 0) {
            if (total !== undefined && offset < total)
                throw new Error('Complete pagination: early exhaustion before known total; no progress');
            return result('exhausted');
        }
        let fingerprint;
        try {
            fingerprint = (0, crypto_1.createHash)('sha256').update(canonical(rows)).digest('hex');
        }
        catch {
            // This context-free helper is wrapped in NodeOperationError by executeCompleteApi.
            // eslint-disable-next-line @n8n/community-nodes/require-node-api-error
            throw new Error('Complete pagination: unable to fingerprint response page');
        }
        if (seenPages.has(fingerprint))
            throw new Error('Complete pagination: repeated page; no progress');
        seenPages.add(fingerprint);
        pages++;
        records.push(...rows);
        offset += currentCount;
        if (total !== undefined && offset >= total)
            return result('exhausted');
        if (maxRecords !== undefined && records.length >= maxRecords)
            return result('maxRecords');
    }
    throw new Error(`Complete pagination: maxPages (${maxPages}) reached before exhaustion`);
}
