"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnPrintShopApiUrl = getOnPrintShopApiUrl;
exports.getOnPrintShopTokenUrl = getOnPrintShopTokenUrl;
exports.safeOnPrintShopRequestError = safeOnPrintShopRequestError;
exports.getOnPrintShopAccessToken = getOnPrintShopAccessToken;
exports.invalidateOnPrintShopAccessToken = invalidateOnPrintShopAccessToken;
exports.isOnPrintShopAuthenticationFailure = isOnPrintShopAuthenticationFailure;
exports.hasOnPrintShopAuthenticationError = hasOnPrintShopAuthenticationError;
exports.clearOnPrintShopTokenCacheForTests = clearOnPrintShopTokenCacheForTests;
const crypto_1 = require("crypto");
const n8n_workflow_1 = require("n8n-workflow");
const tokenCache = new Map();
const pendingTokenRequests = new Map();
const DEFAULT_FALLBACK_TTL_SECONDS = 3300;
const MINIMUM_CACHE_WINDOW_MS = 1000;
function getOnPrintShopApiUrl(credentials) {
    const baseUrl = String(credentials.baseUrl || '').trim().replace(/\/+$/, '');
    if (!baseUrl)
        throw new Error('OnPrintShop Base URL is required');
    return `${baseUrl.replace(/\/api$/, '')}/api/`;
}
function getOnPrintShopTokenUrl(credentials) {
    return `${getOnPrintShopApiUrl(credentials)}oauth/token`;
}
function credentialFingerprint(credentials) {
    return (0, crypto_1.createHash)('sha256')
        .update(getOnPrintShopTokenUrl(credentials))
        .update('\0')
        .update(String(credentials.clientId || ''))
        .update('\0')
        .update(String(credentials.clientSecret || ''))
        .digest('hex');
}
function numericTimestamp(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric))
            return undefined;
        return numeric > 10000000000 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? undefined : parsed;
}
function jwtExpiry(accessToken) {
    const segments = accessToken.split('.');
    if (segments.length !== 3)
        return undefined;
    try {
        const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
        return numericTimestamp(payload.exp);
    }
    catch {
        return undefined;
    }
}
function tokenExpiry(tokenResponse, accessToken, credentials, now) {
    var _a, _b, _c, _d;
    const expiresInSeconds = Number((_a = tokenResponse.expires_in) !== null && _a !== void 0 ? _a : tokenResponse.expiresIn);
    let rawExpiry;
    if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
        rawExpiry = now + expiresInSeconds * 1000;
    }
    else {
        rawExpiry = (_d = numericTimestamp((_c = (_b = tokenResponse.expires_at) !== null && _b !== void 0 ? _b : tokenResponse.expiresAt) !== null && _c !== void 0 ? _c : tokenResponse.expiry)) !== null && _d !== void 0 ? _d : jwtExpiry(accessToken);
    }
    if (!rawExpiry || rawExpiry <= now) {
        const configuredTtl = Number(credentials.cacheTtlSeconds);
        const fallbackTtl = Number.isFinite(configuredTtl) && configuredTtl > 0
            ? configuredTtl
            : DEFAULT_FALLBACK_TTL_SECONDS;
        rawExpiry = now + fallbackTtl * 1000;
    }
    const lifetime = Math.max(rawExpiry - now, MINIMUM_CACHE_WINDOW_MS);
    const refreshSkew = Math.min(60000, Math.max(5000, lifetime * 0.1));
    return Math.max(now + MINIMUM_CACHE_WINDOW_MS, rawExpiry - refreshSkew);
}
function pruneExpiredTokens(now) {
    for (const [key, cached] of tokenCache) {
        if (cached.expiresAt <= now)
            tokenCache.delete(key);
    }
}
function safeOnPrintShopRequestError(error, sensitiveValues = []) {
    var _a, _b;
    const candidate = error && typeof error === 'object' ? error : {};
    let message = error instanceof Error ? error.message : String(error || 'OnPrintShop request failed');
    for (const sensitiveValue of sensitiveValues) {
        const value = String(sensitiveValue || '');
        if (value)
            message = message.split(value).join('[redacted]');
    }
    const statusCode = Number((_b = (_a = candidate.statusCode) !== null && _a !== void 0 ? _a : candidate.httpCode) !== null && _b !== void 0 ? _b : candidate.status);
    const networkCode = String(candidate.code || '');
    if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(networkCode)) {
        message = 'OnPrintShop network or timeout failure';
    }
    return {
        message,
        ...(Number.isFinite(statusCode) ? { statusCode } : {}),
    };
}
async function mintToken(context, credentials) {
    const tokenUrl = getOnPrintShopTokenUrl(credentials);
    try {
        // OnPrintShop uses a client-credentials exchange rather than n8n-managed OAuth.
        const tokenResponse = await context.helpers.httpRequest({
            method: 'POST',
            url: tokenUrl,
            headers: { 'Content-Type': 'application/json' },
            body: {
                grant_type: 'client_credentials',
                client_id: String(credentials.clientId),
                client_secret: String(credentials.clientSecret),
            },
            json: true,
        });
        const accessToken = String(tokenResponse.access_token || '');
        if (!accessToken) {
            throw new n8n_workflow_1.NodeApiError(context.getNode(), { message: 'Missing access token' }, {
                message: 'OnPrintShop token response did not include an access token',
            });
        }
        const now = Date.now();
        return {
            accessToken,
            expiresAt: tokenExpiry(tokenResponse, accessToken, credentials, now),
        };
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(context.getNode(), safeOnPrintShopRequestError(error, [
            credentials.clientId,
            credentials.clientSecret,
        ]), {
            message: 'Failed to get OnPrintShop access token',
        });
    }
}
async function getOnPrintShopAccessToken(context, credentials, forceRefresh = false, rejectedAccessToken) {
    const key = credentialFingerprint(credentials);
    const now = Date.now();
    pruneExpiredTokens(now);
    if (forceRefresh) {
        const current = tokenCache.get(key);
        if (!rejectedAccessToken || (current === null || current === void 0 ? void 0 : current.accessToken) === rejectedAccessToken) {
            tokenCache.delete(key);
        }
    }
    const cached = tokenCache.get(key);
    if (cached && cached.expiresAt > now)
        return cached.accessToken;
    const pending = pendingTokenRequests.get(key);
    if (pending)
        return (await pending).accessToken;
    const request = mintToken(context, credentials);
    pendingTokenRequests.set(key, request);
    try {
        const minted = await request;
        tokenCache.set(key, minted);
        return minted.accessToken;
    }
    finally {
        pendingTokenRequests.delete(key);
    }
}
function invalidateOnPrintShopAccessToken(credentials) {
    tokenCache.delete(credentialFingerprint(credentials));
}
function isOnPrintShopAuthenticationFailure(error) {
    var _a, _b, _c, _d;
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    const response = candidate.response;
    const status = Number((_d = (_c = (_b = (_a = candidate.statusCode) !== null && _a !== void 0 ? _a : candidate.httpCode) !== null && _b !== void 0 ? _b : candidate.status) !== null && _c !== void 0 ? _c : response === null || response === void 0 ? void 0 : response.statusCode) !== null && _d !== void 0 ? _d : response === null || response === void 0 ? void 0 : response.status);
    if (status === 401 || status === 403)
        return true;
    const message = String(candidate.message || '').toLowerCase().replace(/[_-]+/g, ' ');
    return /\b(unauthenticated|invalid token|token expired|expired token)\b/.test(message);
}
function hasOnPrintShopAuthenticationError(response) {
    if (!Array.isArray(response.errors))
        return false;
    return response.errors.some((entry) => {
        if (!entry || typeof entry !== 'object')
            return false;
        const error = entry;
        const extensions = error.extensions;
        const code = String((extensions === null || extensions === void 0 ? void 0 : extensions.code) || '').toLowerCase().replace(/[_-]+/g, ' ');
        const message = String(error.message || '').toLowerCase().replace(/[_-]+/g, ' ');
        const tokenFailure = /\b(invalid token|token expired|expired token)\b/;
        return code === 'unauthenticated' || tokenFailure.test(code) || tokenFailure.test(message);
    });
}
function clearOnPrintShopTokenCacheForTests() {
    tokenCache.clear();
    pendingTokenRequests.clear();
}
