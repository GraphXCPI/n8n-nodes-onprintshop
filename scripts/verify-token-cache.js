#!/usr/bin/env node

const assert = require('node:assert/strict');

const {
	clearOnPrintShopTokenCacheForTests,
	getOnPrintShopAccessToken,
	getOnPrintShopTokenUrl,
} = require('../dist/nodes/OnPrintShopTokenManager');
const {
	createOnPrintShopGraphqlClient,
} = require('../dist/nodes/OnPrintShopGraphqlRequest');

const node = {
	id: 'ops-token-cache-test',
	name: 'OnPrintShop Token Cache Test',
	type: 'n8n-nodes-onprintshop.onPrintShop',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

function credentials(overrides = {}) {
	return {
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
		baseUrl: 'https://api.example.invalid',
		tokenUrl: 'https://auth.example.invalid/oauth/token',
		cacheTtlSeconds: 3300,
		...overrides,
	};
}

function context(credentialData, httpRequest) {
	return {
		getCredentials: async () => credentialData,
		getNode: () => node,
		helpers: { httpRequest },
	};
}

async function testSequentialReuse() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	const credentialData = credentials();
	const testContext = context(credentialData, async (request) => {
		if (request.url === getOnPrintShopTokenUrl(credentialData)) {
			tokenRequests += 1;
			return { access_token: 'sequential-token', expires_in: 3600 };
		}
		return { data: { ok: true } };
	});

	const firstClient = await createOnPrintShopGraphqlClient(testContext);
	const secondClient = await createOnPrintShopGraphqlClient(testContext);
	await firstClient('query First { first }');
	await secondClient('query Second { second }');
	assert.equal(tokenRequests, 1, 'sequential clients should reuse one valid token');
}

async function testConcurrentMintDeduplication() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	const credentialData = credentials();
	const testContext = context(credentialData, async () => {
		tokenRequests += 1;
		await new Promise((resolve) => setTimeout(resolve, 20));
		return { access_token: 'concurrent-token', expires_in: 3600 };
	});

	const tokens = await Promise.all(Array.from({ length: 8 }, () => (
		getOnPrintShopAccessToken(testContext, credentialData)
	)));
	assert.equal(tokenRequests, 1, 'concurrent requests should share one token exchange');
	assert.deepEqual(new Set(tokens), new Set(['concurrent-token']));
}

async function testExpiryRefresh() {
	clearOnPrintShopTokenCacheForTests();
	const originalNow = Date.now;
	let now = 1_800_000_000_000;
	let tokenRequests = 0;
	Date.now = () => now;
	try {
		const credentialData = credentials();
		const testContext = context(credentialData, async () => {
			tokenRequests += 1;
			return { access_token: `expiry-token-${tokenRequests}`, expires_in: 120 };
		});
		assert.equal(await getOnPrintShopAccessToken(testContext, credentialData), 'expiry-token-1');
		now += 30_000;
		assert.equal(await getOnPrintShopAccessToken(testContext, credentialData), 'expiry-token-1');
		now += 90_000;
		assert.equal(await getOnPrintShopAccessToken(testContext, credentialData), 'expiry-token-2');
		assert.equal(tokenRequests, 2, 'expired tokens should be reminted');
	} finally {
		Date.now = originalNow;
	}
}

async function testCredentialIsolation() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	const firstCredentials = credentials({ clientId: 'client-a', clientSecret: 'secret-a' });
	const secondCredentials = credentials({ clientId: 'client-b', clientSecret: 'secret-b' });
	const makeContext = (credentialData) => context(credentialData, async () => {
		tokenRequests += 1;
		return { access_token: `token-for-${credentialData.clientId}`, expires_in: 3600 };
	});

	assert.equal(
		await getOnPrintShopAccessToken(makeContext(firstCredentials), firstCredentials),
		'token-for-client-a',
	);
	assert.equal(
		await getOnPrintShopAccessToken(makeContext(secondCredentials), secondCredentials),
		'token-for-client-b',
	);
	assert.equal(tokenRequests, 2, 'different credentials must never share tokens');
}

async function testHttpAuthenticationRetry() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	let apiRequests = 0;
	const authorizationHeaders = [];
	const credentialData = credentials();
	const testContext = context(credentialData, async (request) => {
		if (request.url === getOnPrintShopTokenUrl(credentialData)) {
			tokenRequests += 1;
			return { access_token: `retry-token-${tokenRequests}`, expires_in: 3600 };
		}
		apiRequests += 1;
		authorizationHeaders.push(request.headers.Authorization);
		if (apiRequests === 1) {
			const error = new Error('Unauthorized');
			error.statusCode = 401;
			throw error;
		}
		return { data: { recovered: true } };
	});

	const client = await createOnPrintShopGraphqlClient(testContext);
	assert.deepEqual(await client('query Retry { retry }'), { recovered: true });
	assert.equal(tokenRequests, 2, 'a rejected token should be reminted once');
	assert.equal(apiRequests, 2, 'the GraphQL request should be retried once');
	assert.deepEqual(authorizationHeaders, ['Bearer retry-token-1', 'Bearer retry-token-2']);
}

async function testGraphqlAuthenticationRetry() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	let apiRequests = 0;
	const credentialData = credentials();
	const testContext = context(credentialData, async (request) => {
		if (request.url === getOnPrintShopTokenUrl(credentialData)) {
			tokenRequests += 1;
			return { access_token: `graphql-token-${tokenRequests}`, expires_in: 3600 };
		}
		apiRequests += 1;
		if (apiRequests === 1) {
			return { errors: [{ message: 'Authorization failed', extensions: { code: 'invalid_token' } }] };
		}
		return { data: { recovered: true } };
	});

	const client = await createOnPrintShopGraphqlClient(testContext);
	assert.deepEqual(await client('query Retry { retry }'), { recovered: true });
	assert.equal(tokenRequests, 2, 'a GraphQL auth rejection should remint once');
	assert.equal(apiRequests, 2, 'a GraphQL auth rejection should retry once');
}

async function testConcurrentAuthenticationRetry() {
	clearOnPrintShopTokenCacheForTests();
	let tokenRequests = 0;
	let rejectedRequests = 0;
	let releaseRejectedRequests;
	const bothRequestsRejected = new Promise((resolve) => {
		releaseRejectedRequests = resolve;
	});
	const credentialData = credentials();
	const testContext = context(credentialData, async (request) => {
		if (request.url === getOnPrintShopTokenUrl(credentialData)) {
			tokenRequests += 1;
			return { access_token: `concurrent-retry-token-${tokenRequests}`, expires_in: 3600 };
		}
		if (request.headers.Authorization === 'Bearer concurrent-retry-token-1') {
			rejectedRequests += 1;
			if (rejectedRequests === 2) releaseRejectedRequests();
			await bothRequestsRejected;
			const error = new Error('Unauthorized');
			error.statusCode = 401;
			throw error;
		}
		return { data: { recovered: true } };
	});

	const [firstClient, secondClient] = await Promise.all([
		createOnPrintShopGraphqlClient(testContext),
		createOnPrintShopGraphqlClient(testContext),
	]);
	const results = await Promise.all([
		firstClient('query First { first }'),
		secondClient('query Second { second }'),
	]);
	assert.deepEqual(results, [{ recovered: true }, { recovered: true }]);
	assert.equal(tokenRequests, 2, 'concurrent 401 responses should share one replacement token');
}

async function testGraphqlErrorsRedactBearerToken() {
	clearOnPrintShopTokenCacheForTests();
	const accessToken = 'private-bearer-token-value';
	let tokenRequests = 0;
	const credentialData = credentials();
	const testContext = context(credentialData, async (request) => {
		if (request.url === getOnPrintShopTokenUrl(credentialData)) {
			tokenRequests += 1;
			return { access_token: accessToken, expires_in: 3600 };
		}
		const error = new Error(`Upstream failed with Authorization: Bearer ${accessToken}`);
		error.statusCode = 500;
		throw error;
	});

	let serialized = '';
	try {
		const client = await createOnPrintShopGraphqlClient(testContext);
		await client('query Failure { failure }');
		assert.fail('GraphQL request should fail');
	} catch (error) {
		serialized = `${error.message}\n${JSON.stringify(error)}`;
	}
	assert.equal(tokenRequests, 1, 'non-auth failures must not remint tokens');
	assert.equal(serialized.includes(accessToken), false, 'serialized errors must redact bearer tokens');
}

async function testTokenErrorsRedactCredentials() {
	clearOnPrintShopTokenCacheForTests();
	const credentialData = credentials({
		clientId: 'private-client-id-value',
		clientSecret: 'private-client-secret-value',
	});
	const testContext = context(credentialData, async () => {
		throw new Error(
			`Rejected ${credentialData.clientId} with secret ${credentialData.clientSecret}`,
		);
	});

	let serialized = '';
	try {
		await getOnPrintShopAccessToken(testContext, credentialData);
		assert.fail('token mint should fail');
	} catch (error) {
		serialized = `${error.message}\n${JSON.stringify(error)}`;
	}
	assert.equal(serialized.includes(String(credentialData.clientId)), false);
	assert.equal(serialized.includes(String(credentialData.clientSecret)), false);
}

async function main() {
	await testDerivedEndpoint();
	await testEndpointCacheIdentity();
	await testMissingBaseUrl();
	await testSequentialReuse();
	await testConcurrentMintDeduplication();
	await testExpiryRefresh();
	await testCredentialIsolation();
	await testHttpAuthenticationRetry();
	await testGraphqlAuthenticationRetry();
	await testConcurrentAuthenticationRetry();
	await testGraphqlErrorsRedactBearerToken();
	await testTokenErrorsRedactCredentials();
	console.log('OnPrintShop token cache verification passed (12 scenarios).');
}

async function testDerivedEndpoint() {
	const { OnPrintShopApi } = require('../dist/credentials/OnPrintShopApi.credentials');
	const credentialType = new OnPrintShopApi();
	const legacyField = credentialType.properties.find(p => p.name === 'tokenUrl');
	assert.equal(legacyField.type, 'hidden');
	assert.notEqual(legacyField.required, true);
	const expression = credentialType.test.request.url;
	const { Expression } = require('n8n-workflow');
	const evaluator = new Expression({});
	const resolveTestUrl = data => evaluator.resolveSimpleParameterValue(expression, { $credentials: data });
	for (const suffix of ['', '/', '///', '/api', '/api/', '/api///']) {
	for (const prefix of ['', '/tenant']) {
		const baseUrl = ` https://shop.example.invalid${prefix}${suffix} `;
		clearOnPrintShopTokenCacheForTests();
		const data = credentials({ baseUrl, tokenUrl: 'https://obsolete.example.invalid/token' });
		const expected = `https://shop.example.invalid${prefix}/api/oauth/token`;
		assert.equal(resolveTestUrl(data), expected, 'credential test must derive the same endpoint');
		assert.equal(getOnPrintShopTokenUrl(data), expected);
		await getOnPrintShopAccessToken(context(data, async request => {
			assert.equal(request.url, expected, 'runtime must ignore saved token URL');
			assert.equal(request.method, 'POST');
			assert.equal(request.body.grant_type, 'client_credentials');
			return { access_token: 'derived-token', expires_in: 3600 };
		}), data);
		let apiRequests = 0;
		const client = await createOnPrintShopGraphqlClient(context(data, async request => {
			assert.equal(request.url, `https://shop.example.invalid${prefix}/api/`);
			assert.equal(request.headers.Authorization, 'Bearer derived-token');
			apiRequests++;
			return { data: { ok: true } };
		}));
		assert.deepEqual(await client('query { __typename }'), { ok: true });
		assert.equal(apiRequests, 1);
		const { OnPrintShop } = require('../dist/nodes/OnPrintShop/OnPrintShop.node');
		const legacyContext = context(data, async request => {
			assert.equal(request.url, `https://shop.example.invalid${prefix}/api/`);
			return { data: { ok: true } };
		});
		legacyContext.getInputData = () => [{ json: {} }];
		legacyContext.getNodeParameter = (name, index, fallback) => ({
			resource: 'graphql', operation: 'execute', graphqlQuery: 'query { __typename }',
			graphqlVariables: '{}', safeMode: false,
		}[name] ?? fallback);
		legacyContext.continueOnFail = () => false;
		legacyContext.helpers.returnJsonArray = values => values.map(json => ({ json }));
		const legacyOutput = await new OnPrintShop().execute.call(legacyContext);
		assert.deepEqual(legacyOutput[0][0].json, { data: { ok: true } });
	}
	}
	assert.equal(getOnPrintShopTokenUrl(credentials({ tokenUrl: undefined })), 'https://api.example.invalid/api/oauth/token');
}

async function testEndpointCacheIdentity() {
	clearOnPrintShopTokenCacheForTests();
	let requests = 0;
	const mint = async () => ({ access_token: `endpoint-token-${++requests}`, expires_in: 3600 });
	const first = credentials();
	const normalized = credentials({ baseUrl: first.baseUrl + '/api/', tokenUrl: 'https://ignored.example.invalid/token' });
	const other = credentials({ baseUrl: 'https://other.example.invalid' });
	assert.equal(await getOnPrintShopAccessToken(context(first, mint), first), 'endpoint-token-1');
	assert.equal(await getOnPrintShopAccessToken(context(normalized, mint), normalized), 'endpoint-token-1');
	assert.equal(await getOnPrintShopAccessToken(context(other, mint), other), 'endpoint-token-2');
	assert.equal(requests, 2, 'effective endpoint determines token cache isolation, not the legacy URL');
}

async function testMissingBaseUrl() {
	clearOnPrintShopTokenCacheForTests();
	const data = credentials({ baseUrl: ' ' });
	let requests = 0;
	await assert.rejects(getOnPrintShopAccessToken(context(data, async () => { requests++; }), data), /Base URL is required/);
	assert.equal(requests, 0, 'missing Base URL must not send credentials to a fallback host');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
