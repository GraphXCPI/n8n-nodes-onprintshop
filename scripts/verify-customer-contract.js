#!/usr/bin/env node

const assert = require('assert');
const { OnPrintShopCustomers } = require('../dist/nodes/OnPrintShopCustomers/OnPrintShopCustomers.node.js');

function createContext(parameters, responder) {
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
				name: 'Customer contract regression',
				type: 'n8n-nodes-onprintshop.onPrintShopCustomers',
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

function verifyCustomerUiFields() {
	const properties = new OnPrintShopCustomers().description.properties;
	const property = (name) => properties.find((entry) => entry.name === name);
	const optionNames = (name) => (property(name).options || []).map((entry) => entry.name);
	const optionValues = (name) => (property(name).options || []).map((entry) => entry.value);

	assert(optionNames('queryParameters').includes('corporate_id'));
	assert(optionNames('queryParameters').includes('department_id'));
	assert(optionValues('customerFields').includes('customers_corporate_id'));
	assert(optionValues('customerFields').includes('customers_department_id'));
	assert(optionValues('customerFieldsGetAll').includes('customers_corporate_id'));
	assert(optionValues('customerFieldsGetAll').includes('customers_department_id'));
	assert(property('customerFields').default.includes('customers_corporate_id'));
	assert(property('customerFields').default.includes('customers_department_id'));
	assert(property('customerFieldsGetAll').default.includes('customers_corporate_id'));
	assert(property('customerFieldsGetAll').default.includes('customers_department_id'));
	assert(optionNames('optionalFields').includes('corporateid'));
	assert(optionNames('optionalFields').includes('departmentid'));
	assert(optionNames('updateFields').includes('corporateid'));
	assert(optionNames('updateFields').includes('departmentid'));
}

async function verifyCustomerQuery() {
	const parameters = {
		resource: 'customer',
		operation: 'getAll',
		fetchAllPages: false,
		queryParameters: {
			corporate_id: 311,
			department_id: 27,
			limit: 50,
			offset: 0,
		},
		customerFieldsGetAll: ['userid', 'customers_corporate_id', 'customers_department_id'],
		addressFieldsGetAll: [],
		safeMode: false,
	};
	const fixture = createContext(parameters, () => ({
		data: {
			customers: {
				customers: [{ userid: 42, customers_corporate_id: 311, customers_department_id: 27 }],
				totalCustomers: 1,
				currentCount: 1,
			},
		},
	}));

	const output = await new OnPrintShopCustomers().execute.call(fixture.context);
	assert.strictEqual(output[0].length, 1);
	assert.strictEqual(output[0][0].json.customers_corporate_id, 311);
	assert.strictEqual(output[0][0].json.customers_department_id, 27);
	assert.strictEqual(fixture.graphqlRequests.length, 1);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.corporate_id, 311);
	assert.strictEqual(request.variables.department_id, 27);
	assert.match(request.query, /\$corporate_id: Int/);
	assert.match(request.query, /\$department_id: Int/);
	assert.match(request.query, /corporate_id: \$corporate_id/);
	assert.match(request.query, /department_id: \$department_id/);
	assert.match(request.query, /customers_corporate_id/);
	assert.match(request.query, /customers_department_id/);
	assert.match(request.query, /currentCount/);
}

async function verifyCustomerAutoPaginationFilters() {
	const parameters = {
		resource: 'customer',
		operation: 'getAll',
		fetchAllPages: true,
		queryParameters: {
			corporate_id: 312,
			department_id: 28,
			pageSize: 1,
			pageDelay: 25,
		},
		customerFieldsGetAll: ['userid', 'customers_corporate_id', 'customers_department_id'],
		addressFieldsGetAll: [],
		safeMode: false,
	};
	const fixture = createContext(parameters, (_request, requestNumber) => ({
		data: {
			customers: {
				customers: requestNumber === 1
					? [{ userid: 43, customers_corporate_id: 312, customers_department_id: 28 }]
					: [],
				totalCustomers: 1,
				currentCount: requestNumber === 1 ? 1 : 0,
			},
		},
	}));

	const output = await new OnPrintShopCustomers().execute.call(fixture.context);
	assert.strictEqual(output[0].length, 1);
	assert.strictEqual(fixture.graphqlRequests.length, 2);
	for (const request of fixture.graphqlRequests) {
		assert.strictEqual(request.variables.corporate_id, 312);
		assert.strictEqual(request.variables.department_id, 28);
	}
}

async function verifySetCustomerInput() {
	const parameters = {
		resource: 'customer',
		operation: 'create',
		registration_type: 1,
		first_name: 'John',
		last_name: 'Doe',
		email: 'john.doe@example.invalid',
		optionalFields: {
			corporateid: 313,
			departmentid: 29,
			external_ref: 'ERP-10002',
		},
		safeMode: false,
	};
	const fixture = createContext(parameters, () => ({
		data: {
			setCustomer: { result: true, message: 'mock', id: 44, external_ref: 'ERP-10002' },
		},
	}));

	const output = await new OnPrintShopCustomers().execute.call(fixture.context);
	assert.strictEqual(output[0].length, 1);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.customer_id, 0);
	assert.strictEqual(request.variables.input.corporateid, 313);
	assert.strictEqual(request.variables.input.departmentid, 29);
	assert.match(request.query, /external_ref/);
}

async function verifyUpdateCustomerInput() {
	const parameters = {
		resource: 'customer',
		operation: 'update',
		customer_id: 44,
		updateFields: {
			corporateid: 313,
			departmentid: 30,
		},
		safeMode: false,
	};
	const fixture = createContext(parameters, () => ({
		data: {
			setCustomer: { result: true, message: 'mock', id: 44, external_ref: 'ERP-10002' },
		},
	}));

	await new OnPrintShopCustomers().execute.call(fixture.context);
	const request = fixture.graphqlRequests[0];
	assert.strictEqual(request.variables.customer_id, 44);
	assert.strictEqual(request.variables.input.corporateid, 313);
	assert.strictEqual(request.variables.input.departmentid, 30);
}

async function main() {
	verifyCustomerUiFields();
	await verifyCustomerQuery();
	await verifyCustomerAutoPaginationFilters();
	await verifySetCustomerInput();
	await verifyUpdateCustomerInput();
	console.log('Verified Customers query fields/filters and SetCustomerInput corporate/department IDs');
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
