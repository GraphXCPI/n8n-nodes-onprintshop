export declare function completeApiError(error: unknown): {
    message: string;
    code: string;
    retryable: boolean;
};
