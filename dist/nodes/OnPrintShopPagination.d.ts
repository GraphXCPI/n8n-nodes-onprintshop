import type { IDataObject } from 'n8n-workflow';
/** Carries only classifier-owned text/code and validated HTTP status to the node boundary. */
export declare class CompletePaginationRequestError extends Error {
    readonly code: string;
    readonly statusCode?: number;
    constructor(error: unknown, status?: number);
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
export declare const COMPLETE_PAGINATION_LIMITS: Readonly<{
    initialOffset: 2147483647;
    pageSize: 1000;
    maxRecords: 2147483647;
    maxPages: 10000;
    pageDelay: 60000;
}>;
/**
 * Known totals govern completion even when the server caps pages below the request.
 * Without a total, only an empty page is exhaustion. Counts must match rows: advancing
 * past missing rows would silently skip records. Repeated pages fail, never deduplicate.
 * Callers must select the record/count fields and keep filters and ordering stable.
 */
export declare function paginateCompleteApi(options: CompletePaginationOptions): Promise<CompletePaginationResult>;
