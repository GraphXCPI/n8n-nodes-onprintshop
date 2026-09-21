import { createHash } from 'crypto';

import {
	IDataObject,
	IExecuteFunctions,
	ICredentialDataDecryptedObject,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

interface CachedToken {
	accessToken: string;
	expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();
const pendingTokenRequests = new Map<string, Promise<CachedToken>>();

const DEFAULT_FALLBACK_TTL_SECONDS = 3300;
const MINIMUM_CACHE_WINDOW_MS = 1000;

export function getOnPrintShopTokenUrl(credentials: ICredentialDataDecryptedObject): string {
	const baseUrl = String(credentials.baseUrl || '').trim().replace(/\/+$/, '');
	if (!baseUrl) throw new Error('OnPrintShop Base URL is required');
	return `${baseUrl}/api/oauth/token`;
}

function credentialFingerprint(credentials: ICredentialDataDecryptedObject): string {
	return createHash('sha256')
		.update(getOnPrintShopTokenUrl(credentials))
		.update('\0')
		.update(String(credentials.clientId || ''))
		.update('\0')
		.update(String(credentials.clientSecret || ''))
		.digest('hex');
}

function numericTimestamp(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) return undefined;
		return numeric > 10_000_000_000 ? numeric : numeric * 1000;
	}
	const parsed = Date.parse(String(value));
	return Number.isNaN(parsed) ? undefined : parsed;
}

function jwtExpiry(accessToken: string): number | undefined {
	const segments = accessToken.split('.');
	if (segments.length !== 3) return undefined;
	try {
		const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as IDataObject;
		return numericTimestamp(payload.exp);
	} catch {
		return undefined;
	}
}

function tokenExpiry(
	tokenResponse: IDataObject,
	accessToken: string,
	credentials: ICredentialDataDecryptedObject,
	now: number,
): number {
	const expiresInSeconds = Number(tokenResponse.expires_in ?? tokenResponse.expiresIn);
	let rawExpiry: number | undefined;
	if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
		rawExpiry = now + expiresInSeconds * 1000;
	} else {
		rawExpiry = numericTimestamp(
			tokenResponse.expires_at ?? tokenResponse.expiresAt ?? tokenResponse.expiry,
		) ?? jwtExpiry(accessToken);
	}

	if (!rawExpiry || rawExpiry <= now) {
		const configuredTtl = Number(credentials.cacheTtlSeconds);
		const fallbackTtl = Number.isFinite(configuredTtl) && configuredTtl > 0
			? configuredTtl
			: DEFAULT_FALLBACK_TTL_SECONDS;
		rawExpiry = now + fallbackTtl * 1000;
	}

	const lifetime = Math.max(rawExpiry - now, MINIMUM_CACHE_WINDOW_MS);
	const refreshSkew = Math.min(60_000, Math.max(5_000, lifetime * 0.1));
	return Math.max(now + MINIMUM_CACHE_WINDOW_MS, rawExpiry - refreshSkew);
}

function pruneExpiredTokens(now: number): void {
	for (const [key, cached] of tokenCache) {
		if (cached.expiresAt <= now) tokenCache.delete(key);
	}
}

export function safeOnPrintShopRequestError(
	error: unknown,
	sensitiveValues: unknown[] = [],
): JsonObject {
	const candidate = error && typeof error === 'object' ? error as Record<string, unknown> : {};
	let message = error instanceof Error ? error.message : String(error || 'OnPrintShop request failed');
	for (const sensitiveValue of sensitiveValues) {
		const value = String(sensitiveValue || '');
		if (value) message = message.split(value).join('[redacted]');
	}
	const statusCode = Number(candidate.statusCode ?? candidate.httpCode ?? candidate.status);
	const networkCode = String(candidate.code || '');
	if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(networkCode)) {
		message = 'OnPrintShop network or timeout failure';
	}
	return {
		message,
		...(Number.isFinite(statusCode) ? { statusCode } : {}),
	};
}

async function mintToken(
	context: IExecuteFunctions,
	credentials: ICredentialDataDecryptedObject,
): Promise<CachedToken> {
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
		}) as IDataObject;
		const accessToken = String(tokenResponse.access_token || '');
		if (!accessToken) {
			throw new NodeApiError(context.getNode(), { message: 'Missing access token' }, {
				message: 'OnPrintShop token response did not include an access token',
			});
		}
		const now = Date.now();
		return {
			accessToken,
			expiresAt: tokenExpiry(tokenResponse, accessToken, credentials, now),
		};
	} catch (error) {
		throw new NodeApiError(context.getNode(), safeOnPrintShopRequestError(error, [
			credentials.clientId,
			credentials.clientSecret,
		]), {
			message: 'Failed to get OnPrintShop access token',
		});
	}
}

export async function getOnPrintShopAccessToken(
	context: IExecuteFunctions,
	credentials: ICredentialDataDecryptedObject,
	forceRefresh = false,
	rejectedAccessToken?: string,
): Promise<string> {
	const key = credentialFingerprint(credentials);
	const now = Date.now();
	pruneExpiredTokens(now);
	if (forceRefresh) {
		const current = tokenCache.get(key);
		if (!rejectedAccessToken || current?.accessToken === rejectedAccessToken) {
			tokenCache.delete(key);
		}
	}

	const cached = tokenCache.get(key);
	if (cached && cached.expiresAt > now) return cached.accessToken;

	const pending = pendingTokenRequests.get(key);
	if (pending) return (await pending).accessToken;

	const request = mintToken(context, credentials);
	pendingTokenRequests.set(key, request);
	try {
		const minted = await request;
		tokenCache.set(key, minted);
		return minted.accessToken;
	} finally {
		pendingTokenRequests.delete(key);
	}
}

export function invalidateOnPrintShopAccessToken(
	credentials: ICredentialDataDecryptedObject,
): void {
	tokenCache.delete(credentialFingerprint(credentials));
}

export function isOnPrintShopAuthenticationFailure(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const candidate = error as Record<string, unknown>;
	const response = candidate.response as Record<string, unknown> | undefined;
	const status = Number(
		candidate.statusCode ?? candidate.httpCode ?? candidate.status ?? response?.statusCode ?? response?.status,
	);
	if (status === 401 || status === 403) return true;

	const message = String(candidate.message || '').toLowerCase().replace(/[_-]+/g, ' ');
	return /\b(unauthenticated|invalid token|token expired|expired token)\b/.test(message);
}

export function hasOnPrintShopAuthenticationError(response: IDataObject): boolean {
	if (!Array.isArray(response.errors)) return false;
	return response.errors.some((entry) => {
		if (!entry || typeof entry !== 'object') return false;
		const error = entry as IDataObject;
		const extensions = error.extensions as IDataObject | undefined;
		const code = String(extensions?.code || '').toLowerCase().replace(/[_-]+/g, ' ');
		const message = String(error.message || '').toLowerCase().replace(/[_-]+/g, ' ');
		const tokenFailure = /\b(invalid token|token expired|expired token)\b/;
		return code === 'unauthenticated' || tokenFailure.test(code) || tokenFailure.test(message);
	});
}

export function clearOnPrintShopTokenCacheForTests(): void {
	tokenCache.clear();
	pendingTokenRequests.clear();
}
