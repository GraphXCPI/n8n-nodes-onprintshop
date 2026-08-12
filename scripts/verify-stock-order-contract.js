#!/usr/bin/env node

const assert = require('assert');
const { OnPrintShopInventory } = require('../dist/nodes/OnPrintShopInventory/OnPrintShopInventory.node.js');
const { OnPrintShopOrders } = require('../dist/nodes/OnPrintShopOrders/OnPrintShopOrders.node.js');

function createContext(parameters, responder, nodeType) {
	const graphqlRequests = [];
	return {
		graphqlRequests,
		context: {
			getInputData: () => [{ json: {} }],
			getCredentials: async () => ({
				baseUrl: 'https://example.invalid',
				tokenUrl: 'https://example.invalid/token',
				clientId: 'mock-client',
				clientSecret: 'mock-secret',
			}),
			getNode: () => ({
				name: 'Stock/order contract regression',
				type: nodeType,
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
					return responder(options.body, graphqlRequests.length);
				},
				returnJsonArray: (values) => values.map((json) => ({ json })),
			},
		},
	};
}

function property(node, name, resource, operation) {
	return node.description.properties.find((entry) => {
		if (entry.name !== name) return false;
		const show = entry.displayOptions?.show || {};
		return (!show.resource || show.resource.includes(resource))
			&& (!show.operation || show.operation.includes(operation));
	});
}

function verifyUiContract() {
	const inventory = new OnPrintShopInventory();
	const orders = new OnPrintShopOrders();
	const stockType = property(inventory, 'stockType', 'productStocks', 'getAll');
	assert(stockType.required);
	assert.deepStrictEqual(stockType.options.map((option) => option.value), ['product', 'product_option']);

	const listFields = property(inventory, 'stockFields', 'productStocks', 'getAll');
	const listValues = listFields.options.map((option) => option.value);
	for (const expected of ['credited_stock', 'current_stock', 'location']) assert(listValues.includes(expected));
	for (const removed of ['credit_stock', 'stock_quantity']) assert(!listValues.includes(removed));

	assert.notStrictEqual(property(inventory, 'productIdStock', 'product', 'getStock').required, true);
	const stockDetails = property(inventory, 'stockDetails', 'product', 'updateStock');
	assert.strictEqual(stockDetails.type, 'fixedCollection');
	assert.strictEqual(stockDetails.typeOptions.multipleValues, true);
	const detailFields = stockDetails.options[0].values.map((entry) => entry.name);
	assert.deepStrictEqual(detailFields, ['action', 'comment', 'location', 'stock_change', 'stock_id']);
	assert.strictEqual(property(inventory, 'stockDetailsJson', 'product', 'updateStock').type, 'json');

	for (const name of ['orderFields', 'orderFieldsGetAll']) {
		const values = property(orders, name, 'order', name === 'orderFields' ? 'get' : 'getAll').options.map((option) => option.value);
		assert(values.includes('courier_company_name'));
		assert(!values.includes('courirer_company_name'));
	}
	const orderInput = property(orders, 'updateOrderStatusInput', 'mutation', 'updateOrderStatus');
	assert.match(orderInput.default, /courier_company_name/);
}

async function verifyProductStocksQueryAndAliases() {
	const parameters = {
		resource: 'productStocks',
		operation: 'getAll',
		fetchAllPages: false,
		queryParameters: { limit: 10, offset: 0 },
		// Simulates a saved pre-1.2.5 workflow.
		stockFields: ['stock_id', 'credit_stock', 'stock_quantity'],
	};
	const fixture = createContext(parameters, () => ({
		data: {
			productStocks: {
				productStocks: [{ stock_id: 9, credited_stock: 12, current_stock: 7, location: 'A-1' }],
				totalProductStocks: 1,
				currentCount: 1,
			},
		},
	}), 'n8n-nodes-onprintshop.onPrintShopInventory');

	const output = await new OnPrintShopInventory().execute.call(fixture.context);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.type, 'product');
	assert.strictEqual(request.variables.product_id, undefined);
	assert.match(request.query, /\$type: StockTypeEnum!/);
	assert.match(request.query, /type: \$type/);
	assert.match(request.query, /credited_stock/);
	assert.match(request.query, /current_stock/);
	assert.doesNotMatch(request.query, /\bcredit_stock\b/);
	assert.strictEqual(output[0][0].json.credited_stock, 12);
	assert.strictEqual(output[0][0].json.credit_stock, 12);
	assert.strictEqual(output[0][0].json.current_stock, 7);
	assert.strictEqual(output[0][0].json.stock_quantity, 7);
}

async function verifyProductStockQueryOptionalProduct() {
	const parameters = {
		resource: 'product',
		operation: 'getStock',
		stockType: 'product_option',
		productIdStock: '',
		queryParametersStock: { limit: 5 },
		stockFields: ['stock_id', 'credited_stock', 'current_stock', 'location'],
	};
	const fixture = createContext(parameters, () => ({
		data: {
			productStocks: {
				productStocks: [{ stock_id: 10, credited_stock: 3, current_stock: 2, location: 'B-2' }],
				totalProductStocks: 1,
				currentCount: 1,
			},
		},
	}), 'n8n-nodes-onprintshop.onPrintShopInventory');

	await new OnPrintShopInventory().execute.call(fixture.context);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.type, 'product_option');
	assert.strictEqual(request.variables.product_id, undefined);
	assert.match(request.query, /\$product_id: Int,/);
	assert.match(request.query, /location/);
}

async function verifyStructuredStockMutation() {
	const parameters = {
		resource: 'product',
		operation: 'updateStock',
		updateStockType: 'product_option',
		productSku: 'MOCK-SKU',
		stockDetailsInputMode: 'form',
		stockDetails: {
			values: [
				{ stock_id: 1, stock_change: 10, action: 'add', comment: 'restock', location: 'A-1' },
				{ stock_id: 2, stock_change: 4, action: 'remove', comment: '', location: '' },
			],
		},
	};
	const fixture = createContext(parameters, () => ({
		data: { updateProductStock: { result: true, message: 'mock', id: 1, stock_details: [] } },
	}), 'n8n-nodes-onprintshop.onPrintShopInventory');

	const output = await new OnPrintShopInventory().execute.call(fixture.context);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.type, 'product_option');
	assert.strictEqual(request.variables.product_sku, 'MOCK-SKU');
	assert.strictEqual(request.variables.input.stock_details.length, 2);
	assert.deepStrictEqual(request.variables.input.stock_details[0], {
		stock_id: 1,
		stock_change: 10,
		action: 'add',
		comment: 'restock',
		location: 'A-1',
	});
	assert.match(request.query, /\$type: UpdateStockTypeEnum/);
	assert.match(request.query, /stock_details/);
	assert.strictEqual(output[0][0].json._stockDetailCount, 2);
}

async function verifyJsonStockMutation() {
	const stockDetails = [
		{ stock_id: 4, stock_change: 15, action: 'reset', comment: 'counted', location: 'C-3' },
		{ stock_id: 5, stock_change: 2, action: 'add' },
	];
	const parameters = {
		resource: 'product',
		operation: 'updateStock',
		updateStockType: 'product',
		productSku: '',
		stockDetailsInputMode: 'json',
		stockDetailsJson: JSON.stringify(stockDetails),
	};
	const fixture = createContext(parameters, () => ({
		data: { updateProductStock: { result: true, message: 'mock', id: 4, stock_details: stockDetails } },
	}), 'n8n-nodes-onprintshop.onPrintShopInventory');

	await new OnPrintShopInventory().execute.call(fixture.context);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.type, 'product');
	assert.deepStrictEqual(request.variables.input.stock_details, stockDetails);
}

async function verifyLegacyStockMutation() {
	const parameters = {
		resource: 'product',
		operation: 'updateStock',
		stockIdentifierType: 'stock_id',
		stockId: '7',
		stockAction: 'Set',
		stock_quantity: 25,
		comment: 'legacy',
	};
	const fixture = createContext(parameters, () => ({
		data: { updateProductStock: { result: true, message: 'mock', id: 7, stock_details: [] } },
	}), 'n8n-nodes-onprintshop.onPrintShopInventory');

	await new OnPrintShopInventory().execute.call(fixture.context);
	assert.deepStrictEqual(fixture.graphqlRequests[0].variables.input.stock_details, [{
		stock_id: 7,
		stock_change: 25,
		action: 'reset',
		comment: 'legacy',
	}]);
}

async function verifyOrderCompatibility() {
	const queryParameters = {
		resource: 'order',
		operation: 'get',
		orderId: '5',
		// Simulates a saved pre-1.2.5 selection.
		orderFields: ['orders_id', 'courirer_company_name'],
		customerFieldsGet: [],
		productFieldsGet: [],
		blindDetailFieldsGet: [],
		deliveryDetailFieldsGet: [],
		billingDetailFieldsGet: [],
		shipmentDetailFieldsGet: [],
	};
	const queryFixture = createContext(queryParameters, () => ({
		data: { orders: { orders: [{ orders_id: 5, courier_company_name: 'Mock Courier' }], totalOrders: 1 } },
	}), 'n8n-nodes-onprintshop.onPrintShopOrders');
	const queryOutput = await new OnPrintShopOrders().execute.call(queryFixture.context);
	assert.match(queryFixture.graphqlRequests[0].query, /courier_company_name/);
	assert.doesNotMatch(queryFixture.graphqlRequests[0].query, /courirer_company_name/);
	assert.strictEqual(queryOutput[0][0].json.courirer_company_name, 'Mock Courier');

	const mutationParameters = {
		resource: 'mutation',
		operation: 'updateOrderStatus',
		statusUpdateType: 'order',
		orders_id: 5,
		updateOrderStatusInput: JSON.stringify({
			order_status: 'Processing',
			courirer_company_name: 'Legacy Courier',
			notify: 0,
		}),
	};
	const mutationFixture = createContext(mutationParameters, () => ({
		data: { updateOrderStatus: { result: true, message: 'mock', id: 5 } },
	}), 'n8n-nodes-onprintshop.onPrintShopOrders');
	await new OnPrintShopOrders().execute.call(mutationFixture.context);
	const input = mutationFixture.graphqlRequests[0].variables.input;
	assert.strictEqual(input.courier_company_name, 'Legacy Courier');
	assert.strictEqual(input.courirer_company_name, undefined);
}

async function main() {
	verifyUiContract();
	await verifyProductStocksQueryAndAliases();
	await verifyProductStockQueryOptionalProduct();
	await verifyStructuredStockMutation();
	await verifyJsonStockMutation();
	await verifyLegacyStockMutation();
	await verifyOrderCompatibility();
	console.log('Verified order courier rename and Product Stock query/mutation contract changes');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
