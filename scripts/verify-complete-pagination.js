#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Load source and local TS dependencies in memory, avoiding stale dist or shared build writes.
const sourceModules = new Map();
function loadSource(filename) {
	if (sourceModules.has(filename)) return sourceModules.get(filename).exports;
	const loaded = new Module(filename, module);
	sourceModules.set(filename, loaded);
	loaded.filename = filename;
	loaded.paths = Module._nodeModulePaths(path.dirname(filename));
	loaded.require = request => {
		const source = request.startsWith('.') ? path.resolve(path.dirname(filename), `${request}.ts`) : '';
		return source && fs.existsSync(source) ? loadSource(source) : Module.prototype.require.call(loaded, request);
	};
	const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, esModuleInterop: true },
	});
	loaded._compile(compiled.outputText, filename);
	return loaded.exports;
}
const { paginateCompleteApi, COMPLETE_PAGINATION_LIMITS } = loadSource(path.resolve(__dirname, '../nodes/OnPrintShopPagination.ts'));
const defaults = { recordField: 'rows', totalField: 'total', currentCountField: 'count', pageSize: 2, pageDelay: 0 };
const rows = (...ids) => ids.map(id => ({ id }));
let checks = 0;

async function run(pages, options = {}) {
	const calls = [];
	const result = await paginateCompleteApi({ ...defaults, ...options, fetchPage: async (offset, limit) => {
		calls.push([offset, limit]);
		assert(calls.length <= pages.length, 'Unexpected extra page request');
		return pages[calls.length - 1];
	} });
	checks++;
	return { result, calls };
}

async function rejects(pages, options, pattern) {
	await assert.rejects(run(pages, options), pattern);
	checks++;
}

function apiFixture(parameters, responder, continueOnFail = false) {
	const items = Array.isArray(parameters) ? parameters : [parameters];
	const requests = [];
	let tokenRequests = 0;
	return {
		requests,
		get tokenRequests() { return tokenRequests; },
		context: {
			getInputData: () => items.map(() => ({ json: {} })),
			getNodeParameter: (name, index, fallback) => Object.prototype.hasOwnProperty.call(items[index], name) ? items[index][name] : fallback,
			getNode: () => ({ name: 'Complete pagination fixture', type: 'n8n-nodes-onprintshop.onPrintShop', typeVersion: 10, parameters: items[0] }),
			getCredentials: async () => ({ baseUrl: 'https://example.invalid', tokenUrl: 'https://example.invalid/token', clientId: 'pagination-fixture', clientSecret: 'fixture-secret-must-not-leak' }),
			continueOnFail: () => continueOnFail,
			helpers: { httpRequest: async options => {
				if (options.url.endsWith('/token')) { tokenRequests++; return { access_token: 'fixture-token', expires_in: 3600 }; }
				assert.equal(options.url, 'https://example.invalid/api/');
				requests.push(options.body);
				return responder(options.body, requests.length);
			} },
		},
	};
}

async function verifyIntegration() {
	const { addCompleteApi, buildCompleteRequest, executeCompleteApi } = loadSource(path.resolve(__dirname, '../nodes/OnPrintShopCompleteApi.ts'));
	const catalog = require('../nodes/OnPrintShopCompleteApi.json');
	const graphql = require('graphql');
	const schema = graphql.buildSchema(fs.readFileSync(path.resolve(__dirname, '../contracts/ops-schema.graphql'), 'utf8'));
	const mappings = [
		['customers', 'customers', 'totalCustomers', 'corporate_id', 311],
		['productsDetails', 'products', 'totalProducts', 'status', 0],
		['orders', 'orders', 'totalOrders', 'customer_id', 42],
		['getStore', 'store', 'totalStore', 'corporate_id', 311],
	];
	const ui = addCompleteApi({ properties: [{ name: 'resource', type: 'options', options: [] }] });
	const controls = { apiPagination: 'off', apiPageSize: 250, apiPageDelay: 50, apiMaxPages: 1000, apiMaxRecords: 10 };
	for (const [name, value] of Object.entries(controls)) {
		const properties = ui.properties.filter(property => property.name === name);
		assert.equal(properties.length, 4);
		for (const property of properties) {
			assert.equal(property.default, value);
			assert.deepEqual(property.displayOptions.show.resource, ['apiContract']);
			assert(mappings.some(([operation]) => property.displayOptions.show.operation.includes(operation)));
			if (name === 'apiMaxRecords') assert.deepEqual(property.displayOptions.show.apiPagination, ['limit']);
			else if (name !== 'apiPagination') assert.deepEqual(property.displayOptions.show.apiPagination, ['all', 'limit']);
		}
	}
	checks++;
	for (const [operation, recordField, totalField, filter, filterValue] of mappings) {
		const op = catalog.find(entry => entry.name === operation);
		const leaf = op.returns.find(field => field.startsWith(`${recordField}.`) && field.split('.').length === 2);
		const parameters = {
			resource: 'apiContract', operation, apiInputMode: 'fields', apiOptional: { offset: 5, limit: 99, [filter]: filterValue },
			apiReturnMode: 'custom', apiReturnFields: [leaf], apiPagination: 'all', apiPageSize: 2, apiPageDelay: 0,
		};
		const fixture = apiFixture(parameters, request => {
			assert.equal(request.variables[filter], filterValue);
			const offset = request.variables.offset;
			// Server-side cap returns short pages even though more rows remain.
			return { data: { [operation]: { [recordField]: [{ [leaf.split('.')[1]]: offset + 1, nullable: null, nested: [{ value: 0 }] }], [totalField]: 8, currentCount: 1 } } };
		});
		const built = buildCompleteRequest(fixture.context, 0);
		assert.deepEqual(graphql.validate(schema, graphql.parse(built.query)), []);
		assert(built.query.includes(totalField) && built.query.includes('currentCount'));
		assert.equal(built.pagination.initialOffset, 5);
		assert.equal(built.pagination.maxPages, 1000);
		assert.equal(built.variables.limit, 2);
		assert.deepEqual(parameters.apiReturnFields, [leaf]);
		const json = apiFixture({ ...parameters, apiInputMode: 'json', apiArgumentsJson: JSON.stringify(parameters.apiOptional) });
		assert.deepEqual(buildCompleteRequest(json.context, 0), built);
		const output = await executeCompleteApi(fixture.context);
		assert.deepEqual(fixture.requests.map(request => [request.variables.offset, request.variables.limit]), [[5, 2], [6, 2], [7, 1]]);
		assert.equal(output[0][0].json[operation][recordField].length, 3);
		assert.deepEqual(output[0][0].json[operation][recordField].map(row => row[leaf.split('.')[1]]), [6, 7, 8]);
		assert.equal(output[0][0].json[operation][recordField][0].nullable, null);
		assert.deepEqual(output[0][0].json[operation][recordField][0].nested, [{ value: 0 }]);
		assert.equal(output[0][0].json[operation][totalField], 8);
		assert.equal(output[0][0].json[operation].currentCount, 3);
		assert.deepEqual(output[0][0].json._pagination, { pages: 3, pageSize: 2, totalRecords: 3 });
		assert.deepEqual(output[0][0].pairedItem, { item: 0 });
		checks++;

		const limited = apiFixture({ ...parameters, apiPagination: 'limit', apiMaxRecords: 3 }, request => ({ data: {
			[operation]: { [recordField]: Array.from({ length: request.variables.limit }, (_, i) => ({ id: request.variables.offset + i })), [totalField]: 100, currentCount: request.variables.limit },
		} }));
		const limitedOutput = await executeCompleteApi(limited.context);
		assert.deepEqual(limited.requests.map(request => [request.variables.offset, request.variables.limit]), [[5, 2], [7, 1]]);
		assert.equal(limitedOutput[0][0].json[operation][totalField], 100);
		assert.equal(limitedOutput[0][0].json[operation].currentCount, 3);
		assert.deepEqual(limitedOutput[0][0].json._pagination, { pages: 2, pageSize: 2, totalRecords: 3 });
		checks++;

		for (const mode of [undefined, 'off']) {
			const singleParameters = { ...parameters, apiPageSize: -1, apiMaxPages: -1, apiPagination: mode };
			if (mode === undefined) delete singleParameters.apiPagination;
			const envelope = { [recordField]: rows(1), [totalField]: 99, currentCount: 1, nullable: null };
			const single = apiFixture(singleParameters, () => ({ data: { [operation]: envelope } }));
			const singleRequest = buildCompleteRequest(single.context, 0);
			assert.equal(singleRequest.pagination, undefined);
			assert.deepEqual(singleRequest.variables, parameters.apiOptional);
			assert(!singleRequest.query.includes(totalField) && !singleRequest.query.includes('currentCount'));
			assert.deepEqual(await executeCompleteApi(single.context), [[{ json: { [operation]: envelope }, pairedItem: { item: 0 } }]]);
			assert.equal(single.requests.length, 1);
			checks++;
		}
		for (const selected of [[totalField], ['currentCount'], []]) {
			const invalid = apiFixture({ ...parameters, apiReturnFields: selected });
			assert.throws(() => buildCompleteRequest(invalid.context, 0), /return field/);
			assert.equal(invalid.requests.length, 0);
			checks++;
		}
		const allFields = buildCompleteRequest(apiFixture({ ...parameters, apiReturnMode: 'all' }).context, 0);
		assert.deepEqual(graphql.validate(schema, graphql.parse(allFields.query)), []);
	}
	const base = { resource: 'apiContract', operation: 'customers', apiPagination: 'all', apiPageSize: 2, apiPageDelay: 0 };
	const defaultParameters = { ...base };
	delete defaultParameters.apiPageSize;
	const automatic = buildCompleteRequest(apiFixture(defaultParameters).context, 0);
	assert.equal(automatic.variables.offset, 0);
	assert.equal(automatic.variables.limit, 250);
	assert.equal(buildCompleteRequest(apiFixture({ ...base, apiPagination: 'limit' }).context, 0).pagination.maxRecords, 10);
	for (const params of [
		{ apiPageSize: 0 }, { apiPageSize: 1001 }, { apiPageDelay: -1 }, { apiMaxPages: 0 },
		{ apiPagination: 'limit', apiMaxRecords: -1 }, { apiPageSize: NaN }, { apiPageSize: null },
		{ apiPagination: 'invalid' }, { operation: 'products' }, { operation: 'orderStatus' },
		{ apiOptional: { offset: -1 } },
	]) {
		const fixture = apiFixture({ ...base, ...params }, undefined, true);
		const output = await executeCompleteApi(fixture.context);
		assert.equal(output[0][0].json.errorCode, 'OPS_VALIDATION');
		assert.equal(fixture.requests.length, 0);
		assert.equal(fixture.tokenRequests, 0);
		checks++;
	}
	const zero = apiFixture({ ...base, apiPagination: 'limit', apiMaxRecords: 0 });
	assert.deepEqual((await executeCompleteApi(zero.context))[0][0].json, { customers: { customers: [], currentCount: 0 }, _pagination: { pages: 0, pageSize: 2, totalRecords: 0 } });
	assert.equal(zero.requests.length, 0);
	assert.equal(zero.tokenRequests, 0);
	checks++;
	const emptyTail = apiFixture(base, (_request, i) => ({ data: { customers: { customers: i === 1 ? rows(1, 2) : [], currentCount: i === 1 ? 2 : 0 } } }));
	assert.deepEqual((await executeCompleteApi(emptyTail.context))[0][0].json._pagination, { pages: 1, pageSize: 2, totalRecords: 2 });
	checks++;
	const empty = apiFixture(base, () => ({ data: { customers: { customers: [], totalCustomers: 0, currentCount: 0 } } }));
	assert.deepEqual((await executeCompleteApi(empty.context))[0][0].json._pagination, { pages: 0, pageSize: 2, totalRecords: 0 });
	checks++;
	for (const responder of [
		() => ({ data: { customers: { customers: [], totalCustomers: 1, currentCount: 0 } } }),
		() => ({ data: { customers: { customers: rows(1, 2), totalCustomers: 5, currentCount: 2 } } }),
		() => ({ data: {} }),
	]) {
		const fixture = apiFixture(base, responder, true);
		const output = await executeCompleteApi(fixture.context);
		assert(output[0][0].json.error);
		assert(!output[0][0].json.customers);
		assert(!output[0][0].json._pagination);
		checks++;
	}
	const maxPages = apiFixture({ ...base, apiMaxPages: 1 }, () => ({ data: { customers: { customers: rows(1, 2), totalCustomers: 4 } } }));
	await assert.rejects(executeCompleteApi(maxPages.context));
	assert.equal(maxPages.requests.length, 1);
	checks++;
	const multiple = apiFixture([base, { ...base, apiOptional: { offset: 1 } }], () => ({ data: { customers: { customers: rows(2), totalCustomers: 2 } } }));
	// First item must complete too, without returning a repeated page.
	multiple.context.helpers.httpRequest = async options => options.url.endsWith('/token') ? { access_token: 'fixture-token' } : {
		data: { customers: { customers: options.body.variables.offset === 0 ? rows(1, 2) : rows(2), totalCustomers: 2 } },
	};
	assert.deepEqual((await executeCompleteApi(multiple.context))[0].map(item => item.pairedItem), [{ item: 0 }, { item: 1 }]);
	checks++;
	const safe = apiFixture({ resource: 'apiContract', operation: 'setCustomer', safeMode: true, apiPagination: 'all' }, undefined, true);
	assert.match((await executeCompleteApi(safe.context))[0][0].json.error, /Safe Mode blocks mutations/);
	assert.equal(safe.requests.length, 0);
	checks++;
	const fail = apiFixture(base, () => { throw Object.assign(new Error('fixture-secret-must-not-leak'), { statusCode: 502 }); }, true);
	const failedOutput = await executeCompleteApi(fail.context);
	assert.equal(fail.requests.length, 4);
	assert.equal(failedOutput[0][0].json.errorCode, 'OPS_TRANSPORT');
	assert.equal(failedOutput[0][0].json.retryable, true);
	assert(!JSON.stringify(failedOutput).includes('fixture-secret-must-not-leak'));
	checks++;
	const singleFailure = apiFixture({ ...base, apiPagination: 'off' }, () => { throw Object.assign(new Error('fixture-secret-must-not-leak'), { statusCode: 502 }); }, true);
	assert.equal((await executeCompleteApi(singleFailure.context))[0][0].json.errorCode, 'OPS_TRANSPORT');
	assert.equal(singleFailure.requests.length, 1);
	checks++;
	for (const statusCode of [429, 502]) {
		const mutation = apiFixture({ resource: 'apiContract', operation: 'setProductDesign', apiOptional: { order_product_id: 1 } }, () => {
			throw Object.assign(new Error('fixture-secret-must-not-leak'), { statusCode });
		}, true);
		const failure = (await executeCompleteApi(mutation.context))[0][0].json;
		assert.equal(failure.errorCode, 'OPS_TRANSPORT');
		assert.equal(failure.retryable, false);
		assert.match(failure.error, /Write outcome is unknown/);
		assert(!/retry|fixture-secret-must-not-leak/i.test(failure.error));
		assert.equal(mutation.requests.length, 1);
		checks++;
	}
	const pagedMutation = apiFixture({ resource: 'apiContract', operation: 'setProductDesign', apiPagination: 'all' }, undefined, true);
	assert.equal((await executeCompleteApi(pagedMutation.context))[0][0].json.errorCode, 'OPS_VALIDATION');
	assert.equal(pagedMutation.requests.length, 0);
	assert.equal(pagedMutation.tokenRequests, 0);
	checks++;
	// Prove the kind guard independently of the current four-name allowlist.
	const customerOperation = catalog.find(operation => operation.name === 'customers');
	const originalKind = customerOperation.kind;
	try {
		customerOperation.kind = 'mutation';
		assert.throws(() => buildCompleteRequest(apiFixture(base).context, 0), /not supported/);
		assert(!addCompleteApi({ properties: [{ name: 'resource', type: 'options', options: [] }] }).properties.some(property => property.name === 'apiPagination' && property.displayOptions.show.operation.includes('customers')));
		checks++;
	} finally { customerOperation.kind = originalKind; }
	for (const [upstreamCode, expectedCode] of [
		['DATA_NOT_FOUND', 'DATA_NOT_FOUND'], ['UNAUTHENTICATED', 'OPS_AUTH'],
		['FORBIDDEN', 'OPS_PERMISSION'], ['GRAPHQL_VALIDATION_FAILED', 'OPS_SCHEMA'],
		['BAD_USER_INPUT', 'OPS_VALIDATION'], ['UNCLASSIFIED', 'OPS_UNKNOWN'],
	]) {
		const fixture = apiFixture(base, () => ({ errors: [{ message: 'fixture-secret-must-not-leak', extensions: { code: upstreamCode } }] }), true);
		const failure = (await executeCompleteApi(fixture.context))[0][0].json;
		assert.equal(failure.errorCode, expectedCode);
		assert.equal(failure.retryable, false);
		assert(!JSON.stringify(failure).includes('fixture-secret-must-not-leak'));
		checks++;
	}
	const network = apiFixture(base, () => { throw new Error('network timeout fixture-secret-must-not-leak'); }, true);
	assert.equal((await executeCompleteApi(network.context))[0][0].json.errorCode, 'OPS_TRANSPORT');
	checks++;
	// Exercise code-only failures at the fetch-client boundary, independent of HTTP wrapping.
	const clientModule = loadSource(path.resolve(__dirname, '../nodes/OnPrintShopGraphqlRequest.ts'));
	const createClient = clientModule.createOnPrintShopGraphqlClient;
	try {
		for (const code of ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']) {
			clientModule.createOnPrintShopGraphqlClient = async () => async () => {
				throw Object.assign(new Error('fixture-secret-must-not-leak'), { code, response: { private: 'fixture-secret-must-not-leak' } });
			};
			const failure = (await executeCompleteApi(apiFixture(base, undefined, true).context))[0][0].json;
			assert.equal(failure.errorCode, 'OPS_TRANSPORT');
			assert.equal(failure.retryable, true);
			assert(!JSON.stringify(failure).includes('fixture-secret-must-not-leak'));
			await assert.rejects(executeCompleteApi(apiFixture(base).context), error => {
				assert.match(error.message, /OPS_TRANSPORT/);
				assert(!error.stack.includes('fixture-secret-must-not-leak'));
				return true;
			});
			checks++;
		}
	} finally { clientModule.createOnPrintShopGraphqlClient = createClient; }
	const partialControls = ui.properties.filter(property => property.name === 'apiPartialResponse');
	assert.equal(partialControls.length, catalog.filter(operation => operation.kind === 'mutation').length);
	for (const property of partialControls) {
		assert.equal(property.default, 'fail');
		assert.deepEqual(property.options.map(option => option.value), ['fail', 'returnData']);
		assert(catalog.some(operation => operation.kind === 'mutation' && property.displayOptions.show.operation.includes(operation.name)));
		assert.match(property.description, /Reconcile every row/);
	}
	checks++;
	const mutationBase = { resource: 'apiContract', operation: 'setProductDesign', apiOptional: { order_product_id: 1 } };
	const partialData = { id: 1, result: false, message: 'fixture row failure' };
	const partialResponse = () => ({ data: { setProductDesign: partialData }, errors: [{ message: 'fixture-secret-must-not-leak' }] });
	for (const mode of [undefined, 'fail', 'returnData']) {
		const parameters = { ...mutationBase };
		if (mode !== undefined) parameters.apiPartialResponse = mode;
		const fixture = apiFixture(parameters, partialResponse, true);
		const output = (await executeCompleteApi(fixture.context))[0][0].json;
		if (mode === 'returnData') assert.deepEqual(output, { setProductDesign: partialData });
		else assert.equal(output.errorCode, 'OPS_UNKNOWN');
		assert(!JSON.stringify(output).includes('fixture-secret-must-not-leak'));
		assert.equal(fixture.requests.length, 1);
		checks++;
	}
	for (const pagination of ['off', 'all']) {
		const fixture = apiFixture({ ...base, apiPagination: pagination, apiPartialResponse: 'returnData' }, () => ({
			data: { customers: { customers: rows(1), totalCustomers: 1, currentCount: 1 } },
			errors: [{ message: 'fixture-secret-must-not-leak' }],
		}), true);
		const output = (await executeCompleteApi(fixture.context))[0][0].json;
		assert.equal(output.errorCode, 'OPS_UNKNOWN');
		assert(!output.customers);
		assert(!JSON.stringify(output).includes('fixture-secret-must-not-leak'));
		checks++;
	}
	const invalidPartial = apiFixture({ ...mutationBase, apiPartialResponse: 'invalid' }, undefined, true);
	assert.equal((await executeCompleteApi(invalidPartial.context))[0][0].json.errorCode, 'OPS_VALIDATION');
	assert.equal(invalidPartial.requests.length, 0);
	checks++;
}

async function main() {
	for (const total of [undefined, 0]) {
		const { result } = await run([{ rows: [], total }]);
		assert.equal(result.currentCount, 0);
		assert.equal(result.stopReason, 'exhausted');
		assert.equal(result.pages, 0);
		assert.equal(result.pageCount, 1);
		assert.equal(result.pageSize, 2);
	}
	const one = await run([{ rows: rows(1), total: '1', count: '1' }]);
	assert.deepEqual(one.result.records, rows(1));
	assert.equal(one.result.total, 1);
	assert.equal(one.result.pageCount, 1);
	const multi = await run([{ rows: rows(1, 2), total: 5 }, { rows: rows(3, 4), total: 5 }, { rows: rows(5), total: 5 }]);
	assert.deepEqual(multi.calls, [[0, 2], [2, 2], [4, 1]]);
	assert.deepEqual(multi.result.records, rows(1, 2, 3, 4, 5));
	assert.equal(multi.result.currentCount, 5);
	assert.equal(multi.result.nextOffset, 5);
	assert.equal(multi.result.pages, 3);
	assert.equal(multi.result.pageSize, 2);
	for (const count of [undefined, null, 1]) {
		const short = await run([{ rows: rows(1), total: 3, count }, { rows: rows(2), total: 3, count }, { rows: rows(3), total: 3, count }]);
		assert.deepEqual(short.calls, [[0, 2], [1, 2], [2, 1]]);
	}
	const emptyTail = (await run([{ rows: rows(1, 2) }, { rows: [] }])).result;
	assert.equal(emptyTail.currentCount, 2);
	assert.equal(emptyTail.pages, 1);
	assert.equal(emptyTail.pageCount, 2);
	assert.equal((await run([{ rows: rows(1, 2) }, { rows: rows(3) }, { rows: [] }])).result.currentCount, 3);
	const cappedWithoutTotal = await run([{ rows: rows(1) }, { rows: rows(2) }, { rows: rows(3) }, { rows: [] }]);
	assert.deepEqual(cappedWithoutTotal.calls, [[0, 2], [1, 2], [2, 2], [3, 2]]);
	assert.deepEqual(cappedWithoutTotal.result.records, rows(1, 2, 3));
	assert.equal(cappedWithoutTotal.result.pages, 3);
	assert.equal(cappedWithoutTotal.result.pageCount, 4);
	const capped = await run([{ rows: rows(6, 7), total: 20 }, { rows: rows(8), total: 20 }], { initialOffset: 5, maxRecords: 3 });
	assert.deepEqual(capped.calls, [[5, 2], [7, 1]]);
	assert.equal(capped.result.total, 20);
	assert.equal(capped.result.nextOffset, 8);
	assert.equal(capped.result.stopReason, 'maxRecords');
	assert.equal((await run([{ rows: rows(6), total: 6 }], { initialOffset: 5, maxRecords: 3 })).result.stopReason, 'exhausted');
	assert.equal((await run([{ rows: [], total: 3 }], { initialOffset: 5 })).result.currentCount, 0);
	assert.deepEqual((await run([], { maxRecords: 0 })).calls, []);
	assert.equal((await run([{ rows: rows(1, 2) }], { maxRecords: 2 })).result.stopReason, 'maxRecords');
	assert.equal((await run([{ rows: rows(1, 2), total: 2 }], { maxPages: 1 })).result.stopReason, 'exhausted');
	await rejects([{ rows: rows(1), total: 3 }, { rows: [], total: 3 }], {}, /early exhaustion/);
	await rejects([{ rows: [], total: 1 }], {}, /no progress/);
	await rejects([{ rows: rows(1, 2) }, { rows: rows(1, 2) }], {}, /repeated page/);
	await rejects([{ rows: rows(1, 2) }, { rows: rows(3, 4) }, { rows: rows(1, 2) }], {}, /repeated page/);
	await rejects([{ rows: [{ a: 1, b: 2 }] }, { rows: [{ b: 2, a: 1 }] }], { pageSize: 1 }, /repeated page/);
	await rejects([{ rows: rows(1, 2), total: 3 }], { maxPages: 1 }, /maxPages/);
	await rejects([{ rows: rows(1, 2) }], { maxPages: 1 }, /maxPages/);
	await rejects([{ rows: rows(1), total: 3 }, { rows: rows(2), total: 4 }], {}, /total changed/);
	await rejects([{ rows: rows(1, 2), total: 1 }], {}, /known total/);
	await rejects([{ rows: rows(1, 2) }, { rows: [], total: 1 }], {}, /known total/);
	assert.equal((await run([{ rows: rows(1, 2) }, { rows: rows(3), total: 3 }])).result.total, 3);
	assert.equal((await run([{ rows: rows(1), total: 2 }, { rows: rows(2) }])).result.total, 2);
	for (const count of [0, 3, -1, 1.5, NaN, Infinity, 'x', '', true]) {
		await rejects([{ rows: rows(1), count }], {}, /count/);
	}
	for (const total of [-1, 1.5, NaN, Infinity, '', true, 'secret-payload']) {
		await rejects([{ rows: [], total }], {}, /invalid response count/);
	}
	for (const page of [null, {}, { rows: null }, { rows: [null] }, { rows: [1] }, { rows: [[]] }]) {
		await rejects([page], {}, /object array/);
	}
	await rejects([{ rows: rows(1, 2, 3) }], {}, /exceeds requested limit/);
	for (const [control, maximum] of Object.entries(COMPLETE_PAGINATION_LIMITS)) {
		for (const value of [-1, 0.5, NaN, Infinity, '1', null, maximum + 1]) {
			await rejects([], { [control]: value }, /must be an integer/);
		}
	}
	for (const control of ['pageSize', 'maxPages']) await rejects([], { [control]: 0 }, /must be an integer/);
	await rejects([], { recordField: '' }, /field names/);
	await rejects([], { totalField: 'nested.total' }, /field names/);
	await rejects([{ rows: rows(1, 2) }], { initialOffset: COMPLETE_PAGINATION_LIMITS.initialOffset }, /offset must be an integer/);
	const duplicateRows = await run([{ rows: rows(1, 1), total: 2 }]);
	assert.deepEqual(duplicateRows.result.records, rows(1, 1));
	const first = { rows: rows(1), total: 2 };
	await run([first, { rows: rows(2), total: 2 }]);
	assert.deepEqual(first, { rows: rows(1), total: 2 });
	await assert.rejects(paginateCompleteApi({ ...defaults, fetchPage: async () => { throw new Error('secret-payload'); } }), error => {
		assert.match(error.message, /OnPrintShop OPS_UNKNOWN/);
		assert.equal(error.code, 'OPS_UNKNOWN');
		assert(!JSON.stringify(error).includes('secret-payload'));
		assert(!error.stack.includes('secret-payload'));
		assert.equal(error.cause, undefined);
		return true;
	});
	checks++;
	const catalog = require('../nodes/OnPrintShopCompleteApi.json');
	for (const [operation, recordField, totalField] of [
		['customers', 'customers', 'totalCustomers'],
		['productsDetails', 'products', 'totalProducts'],
		['orders', 'orders', 'totalOrders'],
		['getStore', 'store', 'totalStore'],
	]) {
		const fields = catalog.find(entry => entry.name === operation).returns;
		assert(fields.includes(totalField) && fields.includes('currentCount'));
		assert(fields.some(field => field.startsWith(`${recordField}.`)));
		const mapped = await run([
			{ [recordField]: rows(1), [totalField]: 2, currentCount: 1 },
			{ [recordField]: rows(2), [totalField]: 2, currentCount: 1 },
		], { recordField, totalField, currentCountField: 'currentCount' });
		assert.deepEqual(mapped.result.records, rows(1, 2));
	}
	const originalTimeout = global.setTimeout;
	const delays = [];
	try {
		global.setTimeout = (callback, delay) => { delays.push(delay); callback(); return 0; };
		await run([{ rows: rows(1), total: 2 }, { rows: rows(2), total: 2 }], { pageDelay: 17 });
		assert.deepEqual(delays, [17]);
		for (const failure of [{ statusCode: 429 }, { httpCode: '502' }, { response: { status: 429 } }]) {
			let attempts = 0;
			const retried = await paginateCompleteApi({ ...defaults, fetchPage: async (offset, limit) => {
				assert.deepEqual([offset, limit], [0, 2]);
				if (++attempts <= 3) throw Object.assign(new Error('secret-payload'), failure);
				return { rows: rows(1), total: 1 };
			} });
			assert.equal(attempts, 4);
			assert.equal(retried.pageCount, 1);
			assert.equal(retried.pages, 1);
			assert.deepEqual(delays.slice(-3), [25, 50, 100]);
			checks++;
		}
		for (const status of [429, 502, 401, 500]) {
			let attempts = 0;
			await assert.rejects(paginateCompleteApi({ ...defaults, fetchPage: async () => {
				attempts++;
				throw Object.assign(new Error('secret-payload'), { statusCode: status });
			} }), error => {
				assert.equal(error.statusCode, status);
				assert(!error.stack.includes('secret-payload'));
				return true;
			});
			assert.equal(attempts, status === 429 || status === 502 ? 4 : 1);
			checks++;
		}
	} finally { global.setTimeout = originalTimeout; }
	await verifyIntegration();
	console.log(`Complete pagination: ${checks} fixture checks passed (no network requests).`);
}

main().catch(error => {
	console.error('Complete pagination verification failed.');
	// Show source locations only; assertion messages can contain response fixtures.
	console.error(String(error.stack || '').split('\n').filter(line => /^\s+at /.test(line)).join('\n'));
	process.exitCode = 1;
});
