// Classify upstream failures without returning request bodies, credentials or API-provided values.
export function completeApiError(error: unknown): { message: string; code: string; retryable: boolean } {
  const value = error as { message?: unknown; httpCode?: unknown; statusCode?: unknown; code?: unknown; cause?: { code?: unknown } };
  const message = String(value?.message || '');
  const status = String(value?.httpCode || value?.statusCode || '');
  const transportCode = String(value?.code || value?.cause?.code || '');
  const result = (code: string, text: string, retryable = false) => ({ code, message: `OnPrintShop ${code}: ${text}`, retryable });
  if (status === '401' || /unauthoriz|access token|UNAUTHENTICATED/i.test(message)) return result('OPS_AUTH', '401 Unauthorized. Check the API credential');
  if (status === '403' || /forbidden|permission|FORBIDDEN/i.test(message)) return result('OPS_PERMISSION', '403 Forbidden. Check API permissions');
  if (['408', '429', '500', '502', '503', '504'].includes(status)) return result('OPS_TRANSPORT', `${status} service failure. Retry the request`, true);
  if (/ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/.test(transportCode) || /timeout|timed out|network|socket hang up/i.test(message)) return result('OPS_TRANSPORT', 'Network or timeout failure. Retry the request', true);
  if (/DATA_NOT_FOUND|data not found/i.test(message)) return result('DATA_NOT_FOUND', 'Data not found');
  if (/cannot query field|unknown argument|unknown type|did you mean|GRAPHQL_VALIDATION_FAILED/i.test(message)) return result('OPS_SCHEMA', 'Unknown argument or field in the endpoint schema');
  if (status === '400' || /INVALID_USER_INPUT|BAD_USER_INPUT|validation|required|invalid/i.test(message)) return result('OPS_VALIDATION', 'API input validation failed');
  return result('OPS_UNKNOWN', 'API request failed. Check the endpoint schema, permissions and input values');
}
