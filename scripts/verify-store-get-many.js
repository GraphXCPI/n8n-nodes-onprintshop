#!/usr/bin/env node

const assert = require('assert');
const { OnPrintShopStoreAdmin } = require('../dist/nodes/OnPrintShopStoreAdmin/OnPrintShopStoreAdmin.node.js');

async function runStoreFixture(pages, expectedOffsets) {
	const graphqlRequests = [];
	const parameters = {
		resource: 'store',
		operation: 'getAll',
		store_corporateId: 0,
		store_email: '',
		store_status: 0,
		store_limit: 10,
		store_offset: 0,
		safeMode: false,
	};
	const context = {
		getInputData: () => [{ json: {} }],
		getCredentials: async () => ({
			baseUrl: 'https://example.invalid',
			tokenUrl: 'https://example.invalid/token',
			clientId: 'mock-client',
			clientSecret: 'mock-secret',
		}),
		getNode: () => ({
			name: 'Store Get Many regression',
			type: 'n8n-nodes-onprintshop.onPrintShopStoreAdmin',
			typeVersion: 10,
			position: [0, 0],
			parameters,
		}),
		getNodeParameter: (name, _itemIndex, fallback) => (
			Object.prototype.hasOwnProperty.call(parameters, name) ? parameters[name] : fallback
		),
		continueOnFail: () => false,
		helpers: {
			httpRequest: async (options) => {
				if (options.url.endsWith('/token')) return { access_token: 'mock-token' };
				graphqlRequests.push(options.body);
				const page = pages[graphqlRequests.length - 1];
				assert(page, 'Store Get Many requested an unexpected extra page');
				return { data: { getStore: page } };
			},
			returnJsonArray: (values) => values.map((json) => ({ json })),
		},
	};

	const output = await new OnPrintShopStoreAdmin().execute.call(context);
	const items = output[0];
	assert.strictEqual(items.length, 3, 'output item count must equal totalStore');
	assert.deepStrictEqual(items.map((item) => item.json.corporate_id), [311, 312, 313]);
	assert.deepStrictEqual(items.map((item) => item.json._totalStore), [3, 3, 3]);
	assert.deepStrictEqual(graphqlRequests.map((request) => request.variables.offset), expectedOffsets);
}

async function main() {
	await runStoreFixture([
		{
			store: [311, 312, 313].map((corporate_id) => ({ corporate_id })),
			totalStore: 3,
			currentCount: 3,
		},
	], [0]);

	await runStoreFixture([
		{ store: [{ corporate_id: 311 }], totalStore: 3, currentCount: 1 },
		{ store: [{ corporate_id: 312 }], totalStore: 3, currentCount: 1 },
		{ store: [{ corporate_id: 313 }], totalStore: 3, currentCount: 1 },
	], [0, 1, 2]);

	console.log('Verified Store Get Many: output count equals totalStore for complete and short-page responses');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
