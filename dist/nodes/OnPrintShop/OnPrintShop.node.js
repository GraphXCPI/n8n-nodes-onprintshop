"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPrintShop = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const OnPrintShopHelp_1 = require("../OnPrintShopHelp");
const OPS_ROOT_FIELD_ALIASES = {
    product_master_options: 'productMasterOptions',
    product_option_rules: 'productOptionRules',
    product_options_price: 'productOptionsPrice',
    product_price: 'productPrice',
    product_additional_options: 'productAdditionalOptions',
    products_attribute_price: 'productsAttributePrice',
    quantity_based_attribute_price: 'quantityBasedAttributePrice',
    product_category: 'productCategory',
    products_image_gallery: 'productsImageGallery',
    products_details: 'productsDetails',
    get_store_markup: 'getStoreMarkup',
    get_store: 'getStore',
    get_departments: 'getDepartments',
    get_countries: 'getCountries',
    get_faq_category: 'getFaqCategory',
    get_payment_term_master: 'getPaymentTermMaster',
    get_quote: 'getQuote',
    quoteproduct: 'quoteProduct',
    storeaddress: 'storeAddress',
    setMasterOption: 'setMasterOptions',
};
const OPS_RESPONSE_FIELD_ALIASES = {
    ...OPS_ROOT_FIELD_ALIASES,
    productMasterOptions: 'product_master_options',
    productOptionRules: 'product_option_rules',
    productOptionsPrice: 'product_options_price',
    productPrice: 'product_price',
    productAdditionalOptions: 'product_additional_options',
    productsAttributePrice: 'products_attribute_price',
    quantityBasedAttributePrice: 'quantity_based_attribute_price',
    productCategory: 'product_category',
    productsImageGallery: 'products_image_gallery',
    getStoreMarkup: 'get_store_markup',
    storeMarkup: 'store_markup',
    getFaqCategory: 'get_faq_category',
    faqCategory: 'faq_category',
    getPaymentTermMaster: 'get_payment_term_master',
    paymentTermMaster: 'payment_term_master',
    storeAddress: 'store_address',
    masterOptionRange: 'master_option_range',
    masterOptionTag: 'master_option_tag',
    optionGroup: 'option_group',
    customFormula: 'custom_formula',
    totalStoreMarkup: 'total_store_markup',
    totalOptionGroup: 'total_option_group',
    totalMasterOptionRange: 'total_master_option_range',
    totalMasterOptionTag: 'total_master_option_tag',
    totalCustomFormula: 'total_custom_formula',
    totalPaymentTermMaster: 'total_payment_term_master',
    totalStoreAddress: 'total_store_address',
    totalProductMasterOptions: 'total_product_master_options',
    totalProductOptionRules: 'total_product_option_rules',
    totalProductOptionPrice: 'total_product_option_price',
    totalProductAdditionalOptions: 'total_product_additional_options',
    totalProductPrice: 'total_product_price',
    totalProductsAttributePrice: 'total_products_attribute_price',
    totalProductsImageGallery: 'total_products_image_gallery',
    totalProductCategorySize: 'total_product_category_size',
    totalProductStocks: 'total_product_stocks',
    totalProducts: 'total_products',
    totalOrders: 'total_orders',
    totalCustomers: 'total_customers',
    totalStore: 'total_store',
    totalDepartments: 'total_departments',
    totalCountries: 'total_countries',
    totalFaqCategory: 'total_faq_category',
    totalFaq: 'total_faq',
    totalQuote: 'total_quote',
    totalQuoteProduct: 'total_quote_product',
    totalBatchDetails: 'total_batch_details',
    totalOrderStatus: 'total_order_status',
    totalBaskets: 'total_baskets',
    totalAccountSummary: 'total_account_summary',
    totalStoreCreditSummary: 'total_store_credit_summary',
    currentCount: 'current_count',
};
const OPS_VARIABLE_ALIASES = {
    externalCatalogue: 'external_catalogue',
    selectedShippingType: 'selected_shipping_type',
    userId: 'user_id',
    itemIndex: 'item_index',
    optionFilter: 'optionFilter',
    productsArr: 'products_arr',
};
function toSnakeCaseKey(key) {
    return OPS_VARIABLE_ALIASES[key] || key
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase();
}
function toCamelCaseKey(key) {
    return key.replace(/_([a-z0-9])/g, (_match, character) => character.toUpperCase());
}
function replaceGraphqlTokens(query, aliases) {
    return Object.entries(aliases).reduce((currentQuery, [from, to]) => {
        return currentQuery.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
    }, query);
}
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    if (isPlainObject(error) && typeof error.message === 'string')
        return error.message;
    return String(error);
}
function getErrorStatusCode(error) {
    var _a, _b;
    if (!isPlainObject(error))
        return undefined;
    const statusCode = (_b = (_a = error.statusCode) !== null && _a !== void 0 ? _a : error.status) !== null && _b !== void 0 ? _b : error.httpCode;
    const parsedStatusCode = Number(statusCode);
    return Number.isFinite(parsedStatusCode) ? parsedStatusCode : undefined;
}
function toNodeApiErrorResponse(error) {
    if (isPlainObject(error))
        return error;
    return { message: getErrorMessage(error) };
}
function convertObjectKeys(value, aliases, convertCamelCase = false) {
    if (Array.isArray(value)) {
        return value.map((item) => convertObjectKeys(item, aliases, convertCamelCase));
    }
    if (!isPlainObject(value)) {
        return value;
    }
    const converted = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        const nextKey = aliases[key] || (convertCamelCase ? toSnakeCaseKey(key) : key);
        converted[nextKey] = convertObjectKeys(nestedValue, aliases, convertCamelCase);
    }
    return converted;
}
function prepareVariablesForOpsSchema(variables) {
    const prepared = {};
    for (const [key, value] of Object.entries(variables || {})) {
        const nextKey = OPS_VARIABLE_ALIASES[key] || toSnakeCaseKey(key);
        prepared[nextKey] = key === 'input' || key === 'inputs'
            ? convertObjectKeys(value, OPS_VARIABLE_ALIASES, true)
            : value;
    }
    return prepared;
}
function parseJsonParameter(rawValue, parameterName, node, itemIndex) {
    try {
        return JSON.parse(rawValue || '{}');
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(node, `Invalid JSON in ${parameterName}: ${error.message}`, { itemIndex });
    }
}
function getShowValues(property, key) {
    var _a;
    const show = (_a = property.displayOptions) === null || _a === void 0 ? void 0 : _a.show;
    const value = show === null || show === void 0 ? void 0 : show[key];
    return Array.isArray(value) ? value : undefined;
}
function propertyMatchesExecutionContext(property, resource, operation) {
    const resources = getShowValues(property, 'resource');
    const operations = getShowValues(property, 'operation');
    return (!resources || resources.includes(resource)) && (!operations || operations.includes(operation));
}
function getFieldOptionsForExecution(description, parameterName, resource, operation) {
    const candidates = description.properties.filter((property) => property.name === parameterName && property.type === 'multiOptions');
    const property = candidates.find((candidate) => propertyMatchesExecutionContext(candidate, resource, operation)) || candidates[0];
    if (!property || !Array.isArray(property.options))
        return [];
    return (0, OnPrintShopHelp_1.cleanOnPrintShopFieldValues)(property.options
        .map((option) => typeof option === 'object' && option !== null ? option.value : undefined)
        .filter((value) => typeof value === 'string'));
}
function hasFieldSelectionModeForExecution(description, parameterName, resource, operation) {
    const modeParameterName = `${parameterName}${OnPrintShopHelp_1.ONPRINTSHOP_FIELD_SELECTION_MODE_SUFFIX}`;
    const candidates = description.properties.filter((property) => property.name === modeParameterName);
    return candidates.some((candidate) => propertyMatchesExecutionContext(candidate, resource, operation));
}
function resolveFieldSelection(description, parameterName, selectedFields, mode, resource, operation) {
    if (mode === 'all')
        return getFieldOptionsForExecution(description, parameterName, resource, operation);
    if (mode === 'none')
        return [];
    return (0, OnPrintShopHelp_1.cleanOnPrintShopFieldValues)(selectedFields);
}
function toBatchInputs(value, parameterName, node, itemIndex) {
    if (!Array.isArray(value)) {
        throw new n8n_workflow_1.NodeOperationError(node, `${parameterName} must be a JSON array of input objects, e.g. [{ "...": "..." }]. Bare object or wrapper inputs are not supported for batchable OPS mutations.`, { itemIndex });
    }
    return value;
}
function addLegacyBatchIdAlias(result) {
    if (result.id !== undefined && result['batch_id'] === undefined) {
        result['batch_id'] = result.id;
    }
    return result;
}
function addResponseAliases(value) {
    if (Array.isArray(value)) {
        return value.map((item) => addResponseAliases(item));
    }
    if (!isPlainObject(value)) {
        return value;
    }
    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
        normalized[key] = addResponseAliases(nestedValue);
        const snakeKey = toSnakeCaseKey(key);
        if (snakeKey !== key && normalized[snakeKey] === undefined) {
            normalized[snakeKey] = normalized[key];
        }
        const camelKey = toCamelCaseKey(key);
        if (camelKey !== key && normalized[camelKey] === undefined) {
            normalized[camelKey] = normalized[key];
        }
    }
    for (const [legacy, current] of Object.entries(OPS_RESPONSE_FIELD_ALIASES)) {
        if (normalized[legacy] !== undefined && normalized[current] === undefined) {
            normalized[current] = normalized[legacy];
        }
        if (normalized[current] !== undefined && normalized[legacy] === undefined) {
            normalized[legacy] = normalized[current];
        }
    }
    return normalized;
}
class OnPrintShop {
    constructor() {
        this.description = {
            displayName: 'OnPrintShop',
            name: 'onPrintShop',
            icon: {
                light: 'file:onprintshop-light.svg',
                dark: 'file:onprintshop-dark.svg',
            },
            group: ['transform'],
            version: [1, 10],
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with OnPrintShop API',
            documentationUrl: OnPrintShopHelp_1.ONPRINTSHOP_OPERATOR_DOC_URL,
            codex: {
                categories: ['Sales'],
                subcategories: {
                    Sales: ['Ecommerce'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: OnPrintShopHelp_1.ONPRINTSHOP_OPERATOR_DOC_URL,
                        },
                    ],
                    credentialDocumentation: [
                        {
                            url: OnPrintShopHelp_1.ONPRINTSHOP_OPERATOR_DOC_URL,
                        },
                    ],
                },
                alias: ['OPS', 'OnPrintShop GraphQL', 'print shop'],
            },
            parameterPane: 'wide',
            usableAsTool: true,
            defaults: {
                name: 'OnPrintShop',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'onPrintShopApi',
                    required: true,
                },
            ],
            properties: [
                // Global safety toggle for large queries
                {
                    displayName: 'Safe Mode',
                    name: 'safeMode',
                    description: 'Whether to retry the first page without nested groups when the server returns 5xx',
                    hint: 'Use for large list queries that fail on nested response groups. Leave off for normal single-record calls.',
                    type: 'boolean',
                    default: false,
                },
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Batch',
                            value: 'batch',
                        },
                        {
                            name: 'Country',
                            value: 'countries',
                        },
                        {
                            name: 'Customer',
                            value: 'customer',
                        },
                        {
                            name: 'Customer Address',
                            value: 'customerAddress',
                        },
                        {
                            name: 'Department',
                            value: 'department',
                        },
                        {
                            name: 'FAQ',
                            value: 'faq',
                        },
                        {
                            name: 'FAQ Category',
                            value: 'faqCategory',
                        },
                        {
                            name: 'GraphQL',
                            value: 'graphql',
                        },
                        {
                            name: 'Markup Master',
                            value: 'markupMaster',
                        },
                        {
                            name: 'Master Option Range',
                            value: 'masterOptionRanges',
                        },
                        {
                            name: 'Master Option Stock',
                            value: 'masterOptionStock',
                        },
                        {
                            name: 'Master Option Tag',
                            value: 'masterOptionTag',
                        },
                        {
                            name: 'Mutation',
                            value: 'mutation',
                        },
                        {
                            name: 'Option Formula',
                            value: 'optionFormulas',
                        },
                        {
                            name: 'Option Group',
                            value: 'optionGroup',
                        },
                        {
                            name: 'Order',
                            value: 'order',
                        },
                        {
                            name: 'Order Detail',
                            value: 'orderDetails',
                        },
                        {
                            name: 'Order Product',
                            value: 'orderProducts',
                        },
                        {
                            name: 'Order Shipment',
                            value: 'orderShipment',
                        },
                        {
                            name: 'Payment Term',
                            value: 'paymentTerms',
                        },
                        {
                            name: 'Product',
                            value: 'product',
                        },
                        {
                            name: 'Product Stock',
                            value: 'productStocks',
                        },
                        {
                            name: 'Quote',
                            value: 'quote',
                        },
                        {
                            name: 'Quote Product',
                            value: 'quoteProduct',
                        },
                        {
                            name: 'Ship To Multiple',
                            value: 'shipToMultipleAddress',
                        },
                        {
                            name: 'Status',
                            value: 'status',
                        },
                        {
                            name: 'Store',
                            value: 'store',
                        },
                        {
                            name: 'Store Address',
                            value: 'storeAddress',
                        },
                        {
                            name: 'Store Markup',
                            value: 'storeMarkup',
                        },
                    ],
                    default: 'customer',
                },
                // Raw GraphQL fallback for current API collection operations not yet modeled as first-class node operations.
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['graphql'] } },
                    options: [
                        { name: 'Execute', value: 'execute', action: 'Execute a graph ql request' },
                    ],
                    default: 'execute',
                },
                {
                    displayName: 'Query',
                    name: 'graphqlQuery',
                    type: 'string',
                    required: true,
                    displayOptions: { show: { resource: ['graphql'], operation: ['execute'] } },
                    default: '',
                    placeholder: 'query products($products_id: Int) { products(products_id: $products_id) { products { products_id products_name } } }',
                    typeOptions: {
                        rows: 12,
                    },
                    description: 'GraphQL query or mutation from the OnPrintShop API collection',
                    hint: 'Prefer the Products, Orders, Customers, Inventory, Store Admin, and Product Builder nodes when a first-class action exists.',
                },
                {
                    displayName: 'Variables (JSON)',
                    name: 'graphqlVariables',
                    type: 'json',
                    displayOptions: { show: { resource: ['graphql'], operation: ['execute'] } },
                    default: '{}',
                    placeholder: '{ "products_id": 123 }',
                    description: 'Variables object to send with the GraphQL request',
                    hint: 'Use the variable names from the Postman operation. Known OPS field aliases are normalized before the request is sent.',
                },
                // FAQ Operations (Legacy)
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['faq'] } },
                    options: [
                        { name: 'Get Many', value: 'getMany', action: 'Get many fa qs' },
                    ],
                    default: 'getMany',
                },
                // Store Markup Operations (Legacy)
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['storeMarkup'] } },
                    options: [
                        { name: 'Get Many', value: 'getAll', action: 'Get many store markups' },
                    ],
                    default: 'getAll',
                },
                // Order Products Operations (Legacy)
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['orderProducts'] } },
                    options: [
                        { name: 'Get', value: 'get', action: 'Get an order product' },
                        { name: 'Get Many', value: 'getMany', action: 'Get many order products' },
                        { name: 'Set Design', value: 'setDesign', action: 'Set order product design links' },
                        { name: 'Update Status', value: 'updateStatus', action: 'Update order product status' },
                    ],
                    default: 'get',
                },
                // Customer Address Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['customerAddress'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many customer addresses' },
                        { name: 'Get Many (Legacy)', value: 'getMany', action: 'Get many customer addresses' },],
                    default: 'getAll',
                },
                // Customer Address: User ID (Required)
                {
                    displayName: 'User ID',
                    name: 'userId',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['customerAddress'], operation: ['getAll'] } },
                    default: '',
                    description: 'Customer/User ID to fetch addresses for (required)',
                },
                // Customer Address: Fields
                {
                    displayName: 'Address Fields',
                    name: 'addressFieldsCustomer',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['customerAddress'], operation: ['getAll'] } },
                    options: [
                        { name: 'Address Type', value: 'address_type' },
                        { name: 'City', value: 'city' },
                        { name: 'Company', value: 'company' },
                        { name: 'Country', value: 'country' },
                        { name: 'Extrafield', value: 'extrafield' },
                        { name: 'First Name', value: 'first_name' },
                        { name: 'Is Default Address', value: 'is_default_address' },
                        { name: 'Last Name', value: 'last_name' },
                        { name: 'Name', value: 'name' },
                        { name: 'Postcode', value: 'postcode' },
                        { name: 'State', value: 'state' },
                        { name: 'State Code', value: 'state_code' },
                        { name: 'Street Address', value: 'street_address' },
                        { name: 'Suburb', value: 'suburb' },
                        { name: 'Telephone', value: 'telephone' },
                    ],
                    default: [
                        'name',
                        'first_name',
                        'last_name',
                        'company',
                        'street_address',
                        'city',
                        'state',
                        'country',
                        'telephone',
                        'address_type',
                        'is_default_address',
                    ],
                },
                // Order Details Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['orderDetails'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many order details' },
                        { name: 'Get Many (Legacy)', value: 'getMany', action: 'Get many order details' },],
                    default: 'getAll',
                },
                // Order Details: Query Parameters & Fields (reuse Order query params and product fields getAll)
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    displayOptions: { show: { resource: ['orderDetails'], operation: ['getAll'] } },
                    default: {},
                    options: [
                        { displayName: 'Customer ID', name: 'customer_id', type: 'number', default: 0 },
                        { displayName: 'From Date', name: 'from_date', type: 'dateTime', default: '' },
                        { displayName: 'Order Product Status', name: 'order_product_status', type: 'number', default: 0 },
                        { displayName: 'Order Status', name: 'order_status', type: 'string', default: '' },
                        { displayName: 'Order Type', name: 'order_type', type: 'options', options: [{ name: 'All', value: '' }, { name: 'Standard', value: 'STANDARD' }, { name: 'Quote', value: 'QUOTE' }], default: '' },
                        { displayName: 'Orders ID', name: 'orders_id', type: 'number', default: 0 },
                        { displayName: 'Orders Products ID', name: 'orders_products_id', type: 'number', default: 0 },
                        { displayName: 'Page Delay (Ms)', name: 'pageDelay', type: 'number', typeOptions: { minValue: 25, maxValue: 1000 }, default: 50 },
                        { displayName: 'Page Size', name: 'pageSize', type: 'number', typeOptions: { minValue: 1, maxValue: 250 }, default: 250 },
                        { displayName: 'Store ID', name: 'store_id', type: 'string', default: '' },
                        { displayName: 'To Date', name: 'to_date', type: 'dateTime', default: '' },
                    ],
                },
                // Order Details: Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: { show: { resource: ['orderDetails'], operation: ['getAll'] } },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)'
                },
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsOrderDetails',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['orderDetails'], operation: ['getAll'] } },
                    options: [
                        { name: 'Orders Products ID', value: 'orders_products_id' },
                        { name: 'Product Size Details', value: 'product_size_details' },
                        { name: 'Product Status', value: 'product_status' },
                        { name: 'Products Name', value: 'products_name' },
                        { name: 'Products Price', value: 'products_price' },
                        { name: 'Products Quantity', value: 'products_quantity' },
                        { name: 'Products SKU', value: 'products_sku' },
                        { name: 'Products Title', value: 'products_title' },
                    ],
                    default: ['orders_products_id', 'products_name', 'products_sku', 'products_price', 'products_quantity', 'product_status'],
                },
                // Order Shipment Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['orderShipment'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many order shipments' },
                        { name: 'Get Many (Legacy)', value: 'getMany', action: 'Get many order shipments' },],
                    default: 'getAll',
                },
                // Order Shipment: Query Parameters & Fields (reuse Order params and shipment_detail fields)
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    displayOptions: { show: { resource: ['orderShipment'], operation: ['getAll'] } },
                    default: {},
                    options: [
                        { displayName: 'Customer ID', name: 'customer_id', type: 'number', default: 0 },
                        { displayName: 'From Date', name: 'from_date', type: 'dateTime', default: '' },
                        { displayName: 'Order Status', name: 'order_status', type: 'string', default: '' },
                        { displayName: 'Order Type', name: 'order_type', type: 'options', options: [{ name: 'All', value: '' }, { name: 'Standard', value: 'STANDARD' }, { name: 'Quote', value: 'QUOTE' }], default: '' },
                        { displayName: 'Orders ID', name: 'orders_id', type: 'number', default: 0 },
                        { displayName: 'Page Delay (Ms)', name: 'pageDelay', type: 'number', typeOptions: { minValue: 25, maxValue: 1000 }, default: 50 },
                        { displayName: 'Page Size', name: 'pageSize', type: 'number', typeOptions: { minValue: 1, maxValue: 250 }, default: 250 },
                        { displayName: 'To Date', name: 'to_date', type: 'dateTime', default: '' },
                    ],
                },
                // Order Shipment: Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: { show: { resource: ['orderShipment'], operation: ['getAll'] } },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)'
                },
                {
                    displayName: 'Shipment Fields',
                    name: 'shipmentFieldsOrderShipment',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['orderShipment'], operation: ['getAll'] } },
                    options: [
                        { name: 'Shipment Company', value: 'shipment_company' },
                        { name: 'Shipment Package', value: 'shipment_package' },
                        { name: 'Shipment Shipping Type ID', value: 'shipment_shipping_type_id' },
                        { name: 'Shipment Total Weight', value: 'shipment_total_weight' },
                        { name: 'Shipment Tracking Number', value: 'shipment_tracking_number' },
                    ],
                    default: ['shipment_tracking_number', 'shipment_company', 'shipment_total_weight'],
                },
                // Ship To Multiple Ops
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['shipToMultipleAddress'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many ship to multiple addresses' },
                        {
                            name: "Get Ship To Multiple Address",
                            value: "shipToMultipleAddress",
                            description: 'Direct OPS query for a specific order ship-to-multiple address by order_id',
                            action: "Get ship to multiple address",
                        },],
                    default: 'getAll',
                },
                // Ship To Multiple: Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: { show: { resource: ['shipToMultipleAddress'], operation: ['getAll'] } },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)'
                },
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    displayOptions: { show: { resource: ['shipToMultipleAddress'], operation: ['getAll'] } },
                    default: {},
                    options: [
                        { displayName: 'Limit', name: 'limit', type: 'number',
                            description: 'Max number of results to return', typeOptions: { minValue: 1, maxValue: 250 }, default: 50 },
                        { displayName: 'Offset', name: 'offset', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
                        { displayName: 'Orders ID', name: 'orders_id', type: 'number', default: 0 },
                        { displayName: 'Page Delay (Ms)', name: 'pageDelay', type: 'number', typeOptions: { minValue: 25, maxValue: 1000 }, default: 50 },
                        { displayName: 'Page Size', name: 'pageSize', type: 'number', typeOptions: { minValue: 1, maxValue: 250 }, default: 250 },
                    ],
                },
                {
                    displayName: 'Fields',
                    name: 'stmFields',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['shipToMultipleAddress'], operation: ['getAll'] } },
                    options: [
                        { name: 'City', value: 'stm_city' },
                        { name: 'Company', value: 'stm_company' },
                        { name: 'Country', value: 'stm_country' },
                        { name: 'Name', value: 'stm_name' },
                        { name: 'Postcode', value: 'stm_postcode' },
                        { name: 'State', value: 'stm_state' },
                        { name: 'Street', value: 'stm_street_address' },
                    ],
                    default: ['stm_name', 'stm_company', 'stm_street_address', 'stm_city', 'stm_state', 'stm_country'],
                },
                // Product Stocks Ops
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['productStocks'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many product stocks' }],
                    default: 'getAll',
                },
                // Product Stocks: Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: { show: { resource: ['productStocks'], operation: ['getAll'] } },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)'
                },
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    displayOptions: { show: { resource: ['productStocks'], operation: ['getAll'] } },
                    default: {},
                    options: [
                        { displayName: 'Limit', name: 'limit', type: 'number',
                            description: 'Max number of results to return', typeOptions: { minValue: 1, maxValue: 250 }, default: 50 },
                        { displayName: 'Offset', name: 'offset', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
                        { displayName: 'Page Delay (Ms)', name: 'pageDelay', type: 'number', typeOptions: { minValue: 25, maxValue: 1000 }, default: 50 },
                        { displayName: 'Page Size', name: 'pageSize', type: 'number', typeOptions: { minValue: 1, maxValue: 250 }, default: 250 },
                        { displayName: 'Product ID', name: 'product_id', type: 'number', default: 0 },
                        { displayName: 'SKU', name: 'products_sku', type: 'string', default: '' },
                    ],
                },
                {
                    displayName: 'Stock Fields',
                    name: 'stockFields',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['productStocks'], operation: ['getAll'] } },
                    options: [
                        { name: 'Available Quantity', value: 'available_qty' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Reserved Quantity', value: 'reserved_qty' },
                        { name: 'SKU', value: 'products_sku' },
                    ],
                    default: ['product_id', 'products_sku', 'available_qty'],
                },
                // Status listings (additive)
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['status'] } },
                    options: [
                        { name: 'List Order Product Status', value: 'orderProductStatus', action: 'List order product statuses' },
                        { name: 'List Order Status', value: 'orderStatus', action: 'List order statuses' },
                    ],
                    default: 'orderStatus',
                },
                {
                    displayName: 'Fields',
                    name: 'statusFields',
                    type: 'multiOptions',
                    displayOptions: { show: { resource: ['status'] } },
                    options: [
                        { name: 'ID', value: 'id' },
                        { name: 'Title', value: 'title' },
                    ],
                    default: ['id', 'title'],
                },
                // Batch Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['batch'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many batches' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Batch ID',
                    name: 'batch_batchId',
                    type: 'number',
                    displayOptions: { show: { resource: ['batch'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by batch ID (0 = no filter)',
                },
                {
                    displayName: 'Search',
                    name: 'batch_search',
                    type: 'string',
                    displayOptions: { show: { resource: ['batch'], operation: ['getAll'] } },
                    default: '',
                    description: 'Search string to filter batches',
                },
                {
                    displayName: 'Limit',
                    name: 'batch_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['batch'], operation: ['getAll'] } },
                    default: 20,
                    description: 'Max number of results to return',
                },
                {
                    displayName: 'Offset',
                    name: 'batch_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['batch'], operation: ['getAll'] } },
                    default: 0,
                },
                // Quote Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['quote'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many quotes' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Quote ID',
                    name: 'quote_quoteId',
                    type: 'number',
                    displayOptions: { show: { resource: ['quote'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by quote ID (0 = no filter)',
                },
                {
                    displayName: 'User ID',
                    name: 'quote_userId',
                    type: 'number',
                    displayOptions: { show: { resource: ['quote'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by user/customer ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'quote_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['quote'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'quote_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['quote'], operation: ['getAll'] } },
                    default: 0,
                },
                // Quote Product Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['quoteProduct'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many quote products' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Quote ID',
                    name: 'quoteProduct_quoteId',
                    type: 'number',
                    displayOptions: { show: { resource: ['quoteProduct'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by quote ID (0 = no filter)',
                },
                {
                    displayName: 'Quote Products ID',
                    name: 'quoteProduct_quoteProductsId',
                    type: 'number',
                    displayOptions: { show: { resource: ['quoteProduct'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by quote products ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'quoteProduct_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['quoteProduct'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'quoteProduct_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['quoteProduct'], operation: ['getAll'] } },
                    default: 0,
                },
                // Store Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['store'] } },
                    options: [
                        {
                            name: "Create or Update Store",
                            value: "setStore",
                            description: 'Creates or updates an OPS tenant store using StoreInput',
                            action: "Create or update store",
                        },
                        {
                            name: "Create or Update Store Address",
                            value: "setStoreAddress",
                            description: 'Creates or updates an OPS store address using StoreAddressInput',
                            action: "Create or update store address",
                        },
                        {
                            name: "Get Countries",
                            value: "getCountries",
                            description: 'Lists OPS countries for onboarding dropdowns',
                            action: "Get countries",
                        }, { name: 'Get Many', value: 'getAll', action: 'Get many stores' },
                        {
                            name: "Get Store Addresses",
                            value: "storeAddress",
                            description: 'Lists OPS store addresses for tenant provisioning',
                            action: "Get store addresses",
                        },
                    ],
                    default: 'getAll',
                },
                {
                    displayName: 'Corporate ID',
                    name: 'store_corporateId',
                    type: 'number',
                    displayOptions: { show: { resource: ['store'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by corporate ID (0 = no filter)',
                },
                {
                    displayName: 'Email',
                    name: 'store_email',
                    type: 'string',
                    displayOptions: { show: { resource: ['store'], operation: ['getAll'] } },
                    default: '',
                    description: 'Filter by email',
                },
                {
                    displayName: 'Status',
                    name: 'store_status',
                    type: 'number',
                    displayOptions: { show: { resource: ['store'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by status',
                },
                {
                    displayName: 'Limit',
                    name: 'store_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['store'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'store_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['store'], operation: ['getAll'] } },
                    default: 0,
                },
                // Department Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['department'] } },
                    options: [
                        {
                            name: "Create or Update Department",
                            value: "setDepartment",
                            description: 'Creates or updates an OPS department for a tenant store',
                            action: "Create or update department",
                        }, { name: 'Get Many', value: 'getAll', action: 'Get many departments' },
                    ],
                    default: 'getAll',
                },
                {
                    displayName: 'Department ID',
                    name: 'department_departmentId',
                    type: 'number',
                    displayOptions: { show: { resource: ['department'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by department ID (0 = no filter)',
                },
                {
                    displayName: 'Corporate ID',
                    name: 'department_corporateId',
                    type: 'number',
                    displayOptions: { show: { resource: ['department'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by corporate ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'department_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['department'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'department_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['department'], operation: ['getAll'] } },
                    default: 0,
                },
                // Countries Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['countries'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many countries' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Countries ID',
                    name: 'countries_countriesId',
                    type: 'number',
                    displayOptions: { show: { resource: ['countries'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by country ID (0 = no filter)',
                },
                {
                    displayName: 'Status',
                    name: 'countries_status',
                    type: 'number',
                    displayOptions: { show: { resource: ['countries'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by status (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'countries_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['countries'], operation: ['getAll'] } },
                    default: 50,
                },
                {
                    displayName: 'Offset',
                    name: 'countries_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['countries'], operation: ['getAll'] } },
                    default: 0,
                },
                // FAQ Category Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['faqCategory'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many FAQ categories' }],
                    default: 'getAll',
                },
                {
                    displayName: 'FAQ Category ID',
                    name: 'faqCategory_faqcatId',
                    type: 'number',
                    displayOptions: { show: { resource: ['faqCategory'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by FAQ category ID (0 = no filter)',
                },
                {
                    displayName: 'Status',
                    name: 'faqCategory_status',
                    type: 'number',
                    displayOptions: { show: { resource: ['faqCategory'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by status (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'faqCategory_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['faqCategory'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'faqCategory_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['faqCategory'], operation: ['getAll'] } },
                    default: 0,
                },
                // Markup Master Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['markupMaster'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many markup masters' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Corporate Markup ID',
                    name: 'markupMaster_corporateMarkupId',
                    type: 'number',
                    displayOptions: { show: { resource: ['markupMaster'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by corporate markup ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'markupMaster_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['markupMaster'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'markupMaster_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['markupMaster'], operation: ['getAll'] } },
                    default: 0,
                },
                // Master Option Ranges Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['masterOptionRanges'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many master option ranges' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Range ID',
                    name: 'masterOptionRanges_rangeId',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionRanges'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by range ID (0 = no filter)',
                },
                {
                    displayName: 'Option ID',
                    name: 'masterOptionRanges_optionId',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionRanges'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by option ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'masterOptionRanges_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionRanges'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'masterOptionRanges_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionRanges'], operation: ['getAll'] } },
                    default: 0,
                },
                // Master Option Tag Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['masterOptionTag'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many master option tags' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Master Option Tag ID',
                    name: 'masterOptionTag_tagId',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionTag'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by master option tag ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'masterOptionTag_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionTag'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'masterOptionTag_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionTag'], operation: ['getAll'] } },
                    default: 0,
                },
                // Master Option Stock Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['masterOptionStock'] } },
                    options: [
                        { name: 'Add Stock Config (Staging)', value: 'addConfig', action: 'Add master option stock config' },
                        { name: 'Delete Stock Config (Staging)', value: 'deleteConfig', action: 'Delete master option stock config' },
                        { name: 'Get Combination Matrix (Staging)', value: 'getCombinationMatrix', action: 'Get master option stock combination matrix' },
                        { name: 'Get Configs (Staging)', value: 'getConfigs', action: 'Get master option stock configs' },
                        { name: 'Get History (Staging)', value: 'getHistory', action: 'Get master option stock history' },
                        { name: 'Set Stock Settings (Staging)', value: 'setSettings', action: 'Set master option stock settings' },
                        { name: 'Update Stock (Staging)', value: 'updateStock', action: 'Credit or debit master option stock' },
                    ],
                    default: 'getConfigs',
                },
                {
                    displayName: 'Config ID',
                    name: 'masterOptionStock_configId',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['getConfigs', 'getHistory', 'deleteConfig'] } },
                    default: 0,
                    description: 'Master option stock config ID. Use 0 to omit where optional.',
                },
                {
                    displayName: 'Limit',
                    name: 'masterOptionStock_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['getConfigs', 'getHistory'] } },
                    default: 20,
                },
                {
                    displayName: 'Offset',
                    name: 'masterOptionStock_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['getConfigs', 'getHistory'] } },
                    default: 0,
                },
                {
                    displayName: 'Option Filter (JSON Array)',
                    name: 'masterOptionStock_optionFilter',
                    type: 'json',
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['getConfigs'] } },
                    default: '[]',
                    description: 'Optional array of option IDs, e.g. [52,59]',
                },
                {
                    displayName: 'Option IDs (JSON Array)',
                    name: 'masterOptionStock_optionIdsArray',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['getCombinationMatrix'] } },
                    default: '[50, 52]',
                    description: 'Array of master option IDs for the combination matrix',
                },
                {
                    displayName: 'Option IDs',
                    name: 'masterOptionStock_optionIds',
                    type: 'string',
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['deleteConfig'] } },
                    default: '',
                    description: 'Comma-separated option IDs used by deleteMasterOptionStockConfig, e.g. 59,89',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'masterOptionStock_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['addConfig'] } },
                    default: '{\n  "stock_type": 3,\n  "combinations": [\n    {\n      "option_ids": "50,52",\n      "attribute_ids": "137,1017",\n      "stock": 1000\n    }\n  ]\n}',
                    description: 'AddMasterOptionStockConfigInput object',
                },
                {
                    displayName: 'Inputs (JSON Array)',
                    name: 'masterOptionStock_inputs',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['updateStock'] } },
                    default: '[\n  {\n    "config_id": 44,\n    "stock_quantity": 50,\n    "change_type": "C",\n    "comments": "Restocked"\n  }\n]',
                    description: 'UpdateMasterOptionStockInput JSON array. Use change_type C for credit or D for debit.',
                },
                {
                    displayName: 'Settings Inputs (JSON Array)',
                    name: 'masterOptionStock_settingsInputs',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['masterOptionStock'], operation: ['setSettings'] } },
                    default: '[\n  {\n    "option_id": 264,\n    "allow_order_out_of_stock": 0,\n    "notify_quantity": 10\n  }\n]',
                    description: 'SetMasterOptionStockSettingsInput JSON array',
                },
                // Option Formulas Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['optionFormulas'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many option formulas' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Formula ID',
                    name: 'optionFormulas_formulaId',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionFormulas'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by formula ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'optionFormulas_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionFormulas'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'optionFormulas_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionFormulas'], operation: ['getAll'] } },
                    default: 0,
                },
                // Option Group Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['optionGroup'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many option groups' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Option Group ID',
                    name: 'optionGroup_groupId',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionGroup'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by option group ID (0 = no filter)',
                },
                {
                    displayName: 'Use For',
                    name: 'optionGroup_useFor',
                    type: 'string',
                    displayOptions: { show: { resource: ['optionGroup'], operation: ['getAll'] } },
                    default: '',
                    description: 'Filter by use_for value',
                },
                {
                    displayName: 'Limit',
                    name: 'optionGroup_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionGroup'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'optionGroup_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['optionGroup'], operation: ['getAll'] } },
                    default: 0,
                },
                // Payment Terms Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['paymentTerms'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many payment terms' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Term ID',
                    name: 'paymentTerms_termId',
                    type: 'number',
                    displayOptions: { show: { resource: ['paymentTerms'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by payment term ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'paymentTerms_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['paymentTerms'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'paymentTerms_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['paymentTerms'], operation: ['getAll'] } },
                    default: 0,
                },
                // Store Address Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['storeAddress'] } },
                    options: [{ name: 'Get Many', value: 'getAll', action: 'Get many store addresses' }],
                    default: 'getAll',
                },
                {
                    displayName: 'Corporate ID',
                    name: 'storeAddress_corporateId',
                    type: 'number',
                    displayOptions: { show: { resource: ['storeAddress'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by corporate ID (0 = no filter)',
                },
                {
                    displayName: 'Corporate Address ID',
                    name: 'storeAddress_corporateAddressId',
                    type: 'number',
                    displayOptions: { show: { resource: ['storeAddress'], operation: ['getAll'] } },
                    default: 0,
                    description: 'Filter by corporate address ID (0 = no filter)',
                },
                {
                    displayName: 'Limit',
                    name: 'storeAddress_limit',
                    type: 'number',
                    displayOptions: { show: { resource: ['storeAddress'], operation: ['getAll'] } },
                    default: 10,
                },
                {
                    displayName: 'Offset',
                    name: 'storeAddress_offset',
                    type: 'number',
                    displayOptions: { show: { resource: ['storeAddress'], operation: ['getAll'] } },
                    default: 0,
                },
                // Mutations (additive)
                // NOTE: "Update Product Stock" was removed — it used a stale contract. Use "Product > Update Stock" instead.
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['mutation'] } },
                    options: [
                        { name: 'Add Proof Version', value: 'addProofVersion', action: 'Add proof version to order product' },
                        { name: 'Assign Options', value: 'assignOptions', action: 'Assign options to a product' },
                        { name: 'Modify Order Product (Beta)', value: 'modifyOrderProduct', action: 'Modify an order product' },
                        { name: 'Set Additional Option (Beta)', value: 'setAdditionalOption', action: 'Set product additional option' },
                        { name: 'Set Additional Option Attributes (Beta)', value: 'setAdditionalOptionAttributes', action: 'Set additional option attributes' },
                        { name: 'Set Batch', value: 'setBatch', action: 'Create or update a batch' },
                        { name: 'Set Department', value: 'setDepartment', action: 'Create or update a department' },
                        { name: 'Set FAQ Category', value: 'setFaqCategory', action: 'Create or update a FAQ category' },
                        { name: 'Set Markup Master (Legacy Alias)', value: 'setMarkupMaster', action: 'Create or update store markup' },
                        { name: 'Set Master Option', value: 'setMasterOption', action: 'Create or update a master option' },
                        { name: 'Set Master Option Attribute Price', value: 'setMasterOptionAttributePrice', action: 'Set master option attribute price' },
                        { name: 'Set Master Option Attributes', value: 'setMasterOptionAttributes', action: 'Set master option attributes' },
                        { name: 'Set Master Option Rules (Legacy Alias)', value: 'setMasterOptionRules', action: 'Set product option rules' },
                        { name: 'Set Master Option Tags', value: 'setMasterOptionTags', action: 'Set master option tags' },
                        { name: 'Set Option Formulas', value: 'setOptionFormulas', action: 'Set custom formula' },
                        { name: 'Set Option Group', value: 'setOptionGroup', action: 'Create or update an option group' },
                        { name: 'Set Order (Staging)', value: 'setOrder', action: 'Create or update an order staging' },
                        { name: 'Set Order Product', value: 'setOrderProduct', action: 'Update an order product' },
                        { name: 'Set Product', value: 'setProduct', action: 'Create or update a product' },
                        { name: 'Set Product Category', value: 'setProductCategory', action: 'Create or update a product category' },
                        { name: 'Set Product Design', value: 'setProductDesign', action: 'Update product design links' },
                        { name: 'Set Product Image Gallery', value: 'setProductImage', action: 'Add update or delete product gallery images' },
                        { name: 'Set Product Option Rules', value: 'setProductOptionRules', action: 'Set product option rules' },
                        { name: 'Set Product Pages', value: 'setProductPages', action: 'Set product pages' },
                        { name: 'Set Product Price', value: 'setProductPrice', action: 'Create or update product price' },
                        { name: 'Set Product Size', value: 'setProductSize', action: 'Set product size' },
                        { name: 'Set Product SKU (Staging)', value: 'setProductSku', action: 'Set product SKU mappings' },
                        { name: 'Set Products Attribute Price (Beta)', value: 'setProductsAttributePrice', action: 'Set products attribute price' },
                        { name: 'Set Quantity Based Attribute Price (Beta)', value: 'setQuantityBasedAttributePrice', action: 'Set quantity based attribute price' },
                        { name: 'Set Quote', value: 'setQuote', action: 'Create or update a quote' },
                        { name: 'Set Shipment', value: 'setShipment', action: 'Create or update a shipment' },
                        { name: 'Set Store', value: 'setStore', action: 'Create or update a store' },
                        { name: 'Set Store Address', value: 'setStoreAddress', action: 'Create or update a store address' },
                        { name: 'Set Store Markup', value: 'setStoreMarkup', action: 'Create or update store markup' },
                        { name: 'Update Order Product Images', value: 'updateOrderProductImages', action: 'Update order product images' },
                        { name: 'Update Order Status', value: 'updateOrderStatus', action: 'Update order or order product status' },
                        { name: 'Update Ziflow Link (Images)', value: 'updateZiflowLinkImages', action: 'Update ziflow link images wise' },
                    ],
                    default: 'updateOrderStatus',
                },
                // Mutation: Update Order Status
                {
                    displayName: 'Type',
                    name: 'statusUpdateType',
                    type: 'options',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderStatus'] } },
                    options: [
                        { name: 'Order', value: 'order' },
                        { name: 'Product', value: 'product' },
                    ],
                    default: 'order',
                    description: 'Whether to update an order-level or order-product-level status',
                },
                {
                    displayName: 'Orders ID',
                    name: 'orders_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderStatus'], statusUpdateType: ['order'] } },
                    default: 0,
                    description: 'The order ID (for order-level status updates)',
                },
                {
                    displayName: 'Orders Products ID',
                    name: 'orders_products_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderStatus'], statusUpdateType: ['product'] } },
                    default: 0,
                    description: 'The order-product ID (for product-level status updates)',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'updateOrderStatusInput',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderStatus'] } },
                    default: '{\n  "order_product_status": "Awaiting Artwork",\n  "comment": "",\n  "notify": 0\n}',
                    description: 'UpdateOrderStatusInput object with order_product_status, comment, notify (0 or 1)',
                },
                // Mutation: Set Order Product
                {
                    displayName: 'Order Product ID',
                    name: 'setOrderProduct_order_product_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrderProduct'] } },
                    default: 0,
                    description: 'The order-product ID to update',
                },
                {
                    displayName: 'Width',
                    name: 'setOrderProduct_width',
                    type: 'number',
                    typeOptions: { numberPrecision: 2 },
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrderProduct'] } },
                    default: 0,
                },
                {
                    displayName: 'Height',
                    name: 'setOrderProduct_height',
                    type: 'number',
                    typeOptions: { numberPrecision: 2 },
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrderProduct'] } },
                    default: 0,
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'setOrderProduct_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrderProduct'] } },
                    default: '{\n  "lock_price": 0,\n  "comment": "",\n  "notify_customer": 0\n}',
                    description: 'SetOrderProductInput JSON object',
                },
                // Mutation: Set Batch
                {
                    displayName: 'Batch ID',
                    name: 'setBatch_batch_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setBatch'] } },
                    default: 0,
                    description: 'Batch ID (0 to create new)',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'setBatch_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setBatch'] } },
                    default: '{\n  "batch_name": "",\n  "nesting_size": "",\n  "nest_width": 0,\n  "nest_height": 0,\n  "print_count": 1,\n  "send_mail": 0,\n  "print_instructions": [],\n  "finishing_instructions": [],\n  "front_print_filename": "",\n  "front_cut_filename": "",\n  "front_image_link": "",\n  "rear_print_filename": "",\n  "rear_cut_filename": "",\n  "rear_image_link": "",\n  "jobs": []\n}',
                    description: 'SetBatchMasterInput JSON object',
                },
                // Mutation: Set Product
                {
                    displayName: 'Input (JSON)',
                    name: 'setProduct_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProduct'] } },
                    default: '[\n  {\n    "products_id": 0,\n    "category_id": 46,\n    "multiple_category": "29,46",\n    "products_draw_area_margins": ".125,.125,.125,.125",\n    "visible": 1,\n    "sort_order": 99999,\n    "products_draw_cutting_margins": ".0625,.0625,.0625,.0625",\n    "product_type": "15,8",\n    "corporate_id": "0",\n    "department_id": "0",\n    "user_type_id": "0",\n    "predefined_product_type": "0",\n    "price_defining_method": "0",\n    "size_visible": "Yes",\n    "enable_stock_management": "0",\n    "measurement_unit_id": 1,\n    "enable_sheet_calculation": "0",\n    "product_service_type": "1",\n    "linear_multiplication": "0",\n    "custom_panel": "N",\n    "predefined_panel": "N",\n    "order_product_status_template": 0,\n    "imagename": "image.jpeg",\n    "product_desc_image": "imageasd.jpeg",\n    "products_title": "my product",\n    "products_internal_title": "internal prd title",\n    "product_description": "product desc",\n    "long_description": "long desc",\n    "long_description_two": "long two",\n    "seo_page_title": "seo title",\n    "seo_page_description": "seo desc",\n    "seo_page_metatags": "seo metatags",\n    "schema_markup": "schema markup",\n    "production_description": "product desc",\n    "external_ref": "",\n    "main_sku": "SKU-001",\n    "sizes": [\n      {\n        "size_title": "3x3",\n        "size_image": "image.jpg",\n        "size_width": 3,\n        "size_height": 3,\n        "size_hex_color": "#ff0000",\n        "default_size": 1,\n        "sort_order": 1,\n        "visible": "1",\n        "setup_cost": 0\n      }\n    ],\n    "pages": [\n      {\n        "page_title": "Front",\n        "sort_order": 1,\n        "visible": "1"\n      }\n    ]\n  }\n]',
                    description: 'ProductInput JSON array; use [{...}] for one product or [{...},{...}] for a batch',
                },
                // Mutation: Set Product Price
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductPrice_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductPrice'] } },
                    default: '[\n  {\n    "product_price_id": 0,\n    "products_id": 0,\n    "qty": 1,\n    "qty_to": 100,\n    "price": 0,\n    "vendor_price": 0,\n    "size_id": 0,\n    "visible": "1"\n  }\n]',
                    description: 'ProductPriceInput JSON array; use [{...}] for one price or [{...},{...}] for a batch',
                },
                // Mutation: Set Quote
                {
                    displayName: 'User ID',
                    name: 'setQuote_userid',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuote'] } },
                    default: 0,
                },
                {
                    displayName: 'Quote ID',
                    name: 'setQuote_quote_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuote'] } },
                    default: 0,
                    description: 'Quote ID (0 to create new)',
                },
                {
                    displayName: 'Quote Title',
                    name: 'setQuote_quote_title',
                    type: 'string',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuote'] } },
                    default: '',
                },
                {
                    displayName: 'Shipping Type',
                    name: 'setQuote_selectedShippingType',
                    type: 'string',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuote'] } },
                    default: '',
                    description: 'E.g. fedexground.',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'setQuote_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuote'] } },
                    default: '{\n  "productsArr": []\n}',
                    description: 'SetQuoteInput JSON object with productsArr',
                },
                // Mutation: Set Product Design
                {
                    displayName: 'Order Product ID',
                    name: 'setProductDesign_order_product_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductDesign'] } },
                    default: 0,
                },
                {
                    displayName: 'Ziflow Link',
                    name: 'setProductDesign_ziflow_link',
                    type: 'string',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductDesign'] } },
                    default: '',
                },
                {
                    displayName: 'Ziflow Preflight Link',
                    name: 'setProductDesign_ziflow_preflight_link',
                    type: 'string',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductDesign'] } },
                    default: '',
                },
                // Mutation: Set Product Image Gallery
                {
                    displayName: 'Products ID',
                    name: 'setProductImage_products_id',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductImage'] } },
                    default: 0,
                    description: 'Product ID for gallery images',
                },
                {
                    displayName: 'Optimize Image',
                    name: 'setProductImage_optimizeimg',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductImage'] } },
                    default: 0,
                    description: 'Whether OnPrintShop should optimize images (0 or 1)',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductImage_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductImage'] } },
                    default: '{\n  "image_arr": [\n    {\n      "products_image_gallery_id": 0,\n      "delete": 0,\n      "corporate_id": 0,\n      "title": "New Entry",\n      "products_large_image_name": "test.jpg",\n      "option_id": 0,\n      "attribute_id": 0,\n      "option_ids": "",\n      "attribute_ids": "",\n      "sort_order": 13,\n      "status": "1"\n    }\n  ]\n}',
                    description: 'ProductsImageGalleryBulkInput JSON object with image_arr',
                },
                // Mutation: Update Order Product Images
                {
                    displayName: 'Order Product ID',
                    name: 'updateOrderProductImages_order_product_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderProductImages'] } },
                    default: 0,
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'updateOrderProductImages_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateOrderProductImages'] } },
                    default: '{\n  "imagefiles": [\n    {\n      "thumb": "",\n      "large": "",\n      "original": "",\n      "pagename": "Front_1"\n    }\n  ]\n}',
                    description: 'SetOrderProductImageInput JSON object with imagefiles array',
                },
                // Mutation: Add Proof Version
                {
                    displayName: 'Order Product ID',
                    name: 'addProofVersion_order_product_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['addProofVersion'] } },
                    default: 0,
                },
                {
                    displayName: 'Add Version File Only',
                    name: 'addProofVersion_add_version_file_only',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['addProofVersion'] } },
                    default: 1,
                    description: 'Set to 1 to add version file only',
                },
                {
                    displayName: 'Ask For Approval',
                    name: 'addProofVersion_ask_for_approval',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['addProofVersion'] } },
                    default: 0,
                    description: 'Set to 1 to ask for approval',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'addProofVersion_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['addProofVersion'] } },
                    default: '{\n  "imagefiles": []\n}',
                    description: 'SetOrderProductImageInput JSON with imagefiles array containing version metadata',
                },
                // Mutation: Update Ziflow Link (Images)
                {
                    displayName: 'Order Product ID',
                    name: 'updateZiflowLinkImages_order_product_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateZiflowLinkImages'] } },
                    default: 0,
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'updateZiflowLinkImages_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['updateZiflowLinkImages'] } },
                    default: '{\n  "imagefiles": [\n    {\n      "pagename": "Front_1",\n      "ziflow_link": "",\n      "ziflow_preflight_link": ""\n    }\n  ]\n}',
                    description: 'SetOrderProductImageInput JSON with ziflow links per image',
                },
                // Mutation: Set Shipment
                {
                    displayName: 'Order ID',
                    name: 'setShipment_order_id',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setShipment'] } },
                    default: 0,
                },
                {
                    displayName: 'Shipment ID',
                    name: 'setShipment_shipment_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setShipment'] } },
                    default: 0,
                    description: 'Shipment ID (0 for new shipment)',
                },
                {
                    displayName: 'Tracking Number',
                    name: 'setShipment_tracking_number',
                    type: 'string',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setShipment'] } },
                    default: '',
                },
                {
                    displayName: 'Shipment Info (JSON)',
                    name: 'setShipment_shipmentinfo',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setShipment'] } },
                    default: '[\n  {\n    "packageinfo": [\n      {\n        "weight": 0,\n        "length": 0,\n        "width": 0,\n        "height": 0,\n        "tracking": "",\n        "opdata": []\n      }\n    ]\n  }\n]',
                    description: 'Shipment info JSON array matching the current OnPrintShop API collection',
                },
                // Mutation: Set Master Option Rules
                {
                    displayName: 'Input (JSON)',
                    name: 'setMasterOptionRules_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMasterOptionRules'] } },
                    default: '{\n  "rule_id": 0,\n  "rule_name": "TEST rule",\n  "rule_type": "param_additional_option_based",\n  "source_option_attribute_ids": "151_316,237_0,456_0",\n  "hide_option_ids": "",\n  "hide_option_attribute_ids": "391,1112,1113,1114,1115",\n  "status": "0",\n  "custom_param": "area",\n  "rules_quantity_select": "0",\n  "custom_param_val": 1,\n  "custom_param_val_to": 100,\n  "sort_order": 99999,\n  "hide_size_ids": "",\n  "opt_textbox_conditions": [\n    {\n      "opt_key": "237_0",\n      "opt_comparison": "<=>",\n      "opt_val_from": 1,\n      "opt_val_to": 100\n    }\n  ],\n  "condition": "AND",\n  "disabled_for_admin": "0",\n  "delete": 0\n}',
                    description: 'ProductOptionRulesInput JSON object',
                },
                // Mutation: Set Product Option Rules
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductOptionRules_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductOptionRules'] } },
                    default: '{\n  "rule_id": 0,\n  "rule_name": "TEST rule",\n  "rule_type": "param_additional_option_based",\n  "source_option_attribute_ids": "151_316,237_0,456_0",\n  "hide_option_ids": "",\n  "hide_option_attribute_ids": "391,1112,1113,1114,1115",\n  "status": "0",\n  "custom_param": "area",\n  "rules_quantity_select": "0",\n  "custom_param_val": 1,\n  "custom_param_val_to": 100,\n  "sort_order": 99999,\n  "hide_size_ids": "",\n  "opt_textbox_conditions": [\n    {\n      "opt_key": "237_0",\n      "opt_comparison": "<=>",\n      "opt_val_from": 1,\n      "opt_val_to": 100\n    }\n  ],\n  "condition": "AND",\n  "disabled_for_admin": "0",\n  "delete": 0\n}',
                    description: 'ProductOptionRulesInput JSON object',
                },
                // Mutation: Set Option Formulas
                {
                    displayName: 'Input (JSON)',
                    name: 'setOptionFormulas_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOptionFormulas'] } },
                    default: '{}',
                    description: 'SetCustomFormulaInput JSON object',
                },
                // Mutation: Set Option Group
                {
                    displayName: 'Input (JSON)',
                    name: 'setOptionGroup_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOptionGroup'] } },
                    default: '{}',
                    description: 'SetOptionGroupInput JSON object',
                },
                // Mutation: Set Master Option Tags
                {
                    displayName: 'Input (JSON)',
                    name: 'setMasterOptionTags_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMasterOptionTags'] } },
                    default: '{}',
                    description: 'SetMasterOptionTagInput JSON object',
                },
                // Mutation: Set Master Option Attributes
                {
                    displayName: 'Input (JSON)',
                    name: 'setMasterOptionAttributes_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMasterOptionAttributes'] } },
                    default: '[{}]',
                    description: 'MasterOptionAttributesInput JSON array; use [{...}] for one attribute or [{...},{...}] for a batch',
                },
                // Mutation: Set Master Option Attribute Price
                {
                    displayName: 'Input (JSON)',
                    name: 'setMasterOptionAttributePrice_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMasterOptionAttributePrice'] } },
                    default: '[{}]',
                    description: 'MasterOptionAttributePriceInput JSON array; use [{...}] for one price or [{...},{...}] for a batch',
                },
                // Mutation: Set Master Option
                {
                    displayName: 'Input (JSON)',
                    name: 'setMasterOption_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMasterOption'] } },
                    default: '[\n  {\n    "master_option_id": 0,\n    "title": "VGX_AUTOTEST Master Option",\n    "description": "VGX_AUTOTEST master option",\n    "options_type": "combo",\n    "status": "1",\n    "option_key": "",\n    "sort_order": 9999999,\n    "prod_add_opt_export_group_id": 14,\n    "pricing_method": "0",\n    "linear_formula": "0",\n    "weight_setting": "0",\n    "price_range_lookup": "1",\n    "custom_lookup": "",\n    "predefined_formula": 28,\n    "formula": "",\n    "required": 0,\n    "display_in_calculator": 0,\n    "option_position": "I",\n    "desc_position": 1,\n    "display_above_size": 0,\n    "presentation_group": 2,\n    "exclude_setup_cost_reorder": 0,\n    "master_option_tag": "1",\n    "hire_designer_option": "0",\n    "hide_from_calc": "0",\n    "enable_assoc_qty": "0",\n    "allow_price_cal": "0",\n    "production_description": "option desc",\n    "delete": 0,\n    "external_ref": "OPT-0001"\n  }\n]',
                    description: 'MasterOptionInput JSON array; use [{...}] for one option or [{...},{...}] for a batch',
                },
                // Mutation: Assign Options
                {
                    displayName: 'Input (JSON)',
                    name: 'assignOptions_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['assignOptions'] } },
                    default: '[{}]',
                    description: 'AssignOptionsInput JSON array; use [{...}] for one assignment or [{...},{...}] for a batch',
                },
                // Mutation: Set Product Size
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductSize_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductSize'] } },
                    default: '[{}]',
                    description: 'ProductSizeInput JSON array; use [{...}] for one size or [{...},{...}] for a batch',
                },
                // Mutation: Set Product Pages
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductPages_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductPages'] } },
                    default: '[{}]',
                    description: 'ProductPagesInput JSON array; use [{...}] for one page set or [{...},{...}] for a batch',
                },
                // Mutation: Set Store Address
                {
                    displayName: 'Input (JSON)',
                    name: 'setStoreAddress_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setStoreAddress'] } },
                    default: '{}',
                    description: 'SetStoreAddressInput JSON object',
                },
                // Mutation: Set Department
                {
                    displayName: 'Input (JSON)',
                    name: 'setDepartment_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setDepartment'] } },
                    default: '{\n  "corporate_id": 0,\n  "name": "",\n  "email_to": "",\n  "status": 1\n}',
                    description: 'SetDepartmentInput JSON object',
                },
                // Mutation: Set Store
                {
                    displayName: 'Input (JSON)',
                    name: 'setStore_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setStore'] } },
                    default: '{}',
                    description: 'SetStoreInput JSON object',
                },
                // Mutation: Set Markup Master
                {
                    displayName: 'Input (JSON)',
                    name: 'setMarkupMaster_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setMarkupMaster'] } },
                    default: '{\n  "corporate_markup_id": 0,\n  "markup_title": "TEST markup",\n  "markup_details": "200",\n  "status": "1",\n  "appliedon": "1",\n  "delete": 0\n}',
                    description: 'StoreMarkupInput JSON object',
                },
                // Mutation: Set Store Markup
                {
                    displayName: 'Input (JSON)',
                    name: 'setStoreMarkup_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setStoreMarkup'] } },
                    default: '{\n  "corporate_markup_id": 0,\n  "markup_title": "TEST markup",\n  "markup_details": "200",\n  "status": "1",\n  "appliedon": "1",\n  "delete": 0\n}',
                    description: 'StoreMarkupInput JSON object',
                },
                // Mutation: Set Product Category
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductCategory_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductCategory'] } },
                    default: '[\n  {\n    "category_id": 0,\n    "category_name": "TEST prd categroy",\n    "category_internal_name": "internal name prd categroy",\n    "category_image": "category_image.jpg",\n    "category_icon": "category_icon.jpg",\n    "category_header_content": "categroy header content",\n    "description": "desc prd categroy",\n    "long_description": "long desc prd categroy",\n    "long_description_two": "long desc two prd categroy",\n    "seo_page_title": "seo page title",\n    "seo_page_description": "seo page desc",\n    "parent_id": -1,\n    "status": "1",\n    "delete": 0,\n    "sort_order": 5,\n    "external_ref": "CATE-00001"\n  }\n]',
                    description: 'ProductCategoryInput JSON array; use [{...}] for one category or [{...},{...}] for a batch',
                },
                // Mutation: Set FAQ Category
                {
                    displayName: 'Input (JSON)',
                    name: 'setFaqCategory_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setFaqCategory'] } },
                    default: '{}',
                    description: 'SetFaqCategoryInput JSON object',
                },
                // Mutation: Set Order (Staging)
                {
                    displayName: 'User ID',
                    name: 'setOrder_userid',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrder'] } },
                    default: 0,
                },
                {
                    displayName: 'Order ID',
                    name: 'setOrder_order_id',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrder'] } },
                    default: 0,
                    description: 'Order ID (0 to create new)',
                },
                {
                    displayName: 'Order Title',
                    name: 'setOrder_order_title',
                    type: 'string',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrder'] } },
                    default: '',
                },
                {
                    displayName: 'Shipping Type',
                    name: 'setOrder_selectedShippingType',
                    type: 'number',
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrder'] } },
                    default: 0,
                    description: 'Selected shipping type ID',
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'setOrder_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setOrder'] } },
                    default: '{\n  "productsArr": []\n}',
                    description: 'SetOrderInput JSON object with productsArr',
                },
                // Mutation: Modify Order Product (Beta)
                {
                    displayName: 'Order ID',
                    name: 'modifyOrderProduct_orderid',
                    type: 'number',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['modifyOrderProduct'] } },
                    default: 0,
                },
                {
                    displayName: 'Input (JSON)',
                    name: 'modifyOrderProduct_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['modifyOrderProduct'] } },
                    default: '{}',
                    description: 'ModifyOrderProductInput JSON object',
                },
                // Mutation: Set Additional Option (Beta)
                {
                    displayName: 'Input (JSON)',
                    name: 'setAdditionalOption_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setAdditionalOption'] } },
                    default: '[{}]',
                    description: 'AdditionalOptionInput JSON array; use [{...}] for one option or [{...},{...}] for a batch',
                },
                // Mutation: Set Additional Option Attributes (Beta)
                {
                    displayName: 'Input (JSON)',
                    name: 'setAdditionalOptionAttributes_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setAdditionalOptionAttributes'] } },
                    default: '[{}]',
                    description: 'AdditionalOptionAttributesInput JSON array; use [{...}] for one attribute or [{...},{...}] for a batch',
                },
                // Mutation: Set Products Attribute Price (Beta)
                {
                    displayName: 'Input (JSON)',
                    name: 'setProductsAttributePrice_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setProductsAttributePrice'] } },
                    default: '[{}]',
                    description: 'ProductsAttributePriceInput JSON array; use [{...}] for one price or [{...},{...}] for a batch',
                },
                // Mutation: Set Quantity Based Attribute Price (Beta)
                {
                    displayName: 'Input (JSON)',
                    name: 'setQuantityBasedAttributePrice_input',
                    type: 'json',
                    required: true,
                    displayOptions: { show: { resource: ['mutation'], operation: ['setQuantityBasedAttributePrice'] } },
                    default: '[{}]',
                    description: 'QuantityBasedAttributePriceInput JSON array; use [{...}] for one price or [{...},{...}] for a batch',
                },
                // Legacy compatibility parameters for existing workflows
                {
                    displayName: 'Order Product ID',
                    name: 'orderProductId',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['get'] } },
                    default: '',
                    description: 'Orders products ID used by legacy orderProducts workflows',
                },
                {
                    displayName: 'Order Product ID',
                    name: 'orderProductIdSetDesign',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['setDesign'] } },
                    default: '',
                },
                {
                    displayName: 'Ziflow Link',
                    name: 'ziflowLink',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['setDesign'] } },
                    default: '',
                },
                {
                    displayName: 'Ziflow Preflight Link',
                    name: 'ziflowPreflightLink',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['setDesign'] } },
                    default: '',
                },
                {
                    displayName: 'Order Product ID',
                    name: 'orderProductIdUpdate',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['updateStatus'] } },
                    default: '',
                },
                {
                    displayName: 'Order Product Status',
                    name: 'orderProductStatusUpdate',
                    type: 'string',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['updateStatus'] } },
                    default: '',
                },
                {
                    displayName: 'Additional Fields',
                    name: 'additionalFieldsProductUpdate',
                    type: 'collection',
                    placeholder: 'Add Field',
                    displayOptions: { show: { resource: ['orderProducts'], operation: ['updateStatus'] } },
                    default: {},
                    options: [
                        { displayName: 'Comment', name: 'comment', type: 'string', default: '' },
                        { displayName: 'Notify', name: 'notify', type: 'number', default: 0 },
                    ],
                },
                // Customer Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                        },
                    },
                    options: [
                        {
                            name: 'Create',
                            value: 'create',
                            description: 'Create a new customer',
                            action: 'Create a customer',
                        },
                        {
                            name: 'Get',
                            value: 'get',
                            description: 'Get a customer by email',
                            action: 'Get a customer',
                        },
                        {
                            name: 'Get Many',
                            value: 'getAll',
                            description: 'Get many customers',
                            action: 'Get many customers',
                        },
                        { name: 'Get Many (Legacy)', value: 'getMany', action: 'Get many customers' },
                        {
                            name: 'Update',
                            value: 'update',
                            description: 'Update an existing customer',
                            action: 'Update a customer',
                        },
                    ],
                    default: 'get',
                },
                // Customer: Get - Email Field
                {
                    displayName: 'Email',
                    name: 'email',
                    type: 'string',
                    placeholder: 'name@email.com',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['get'],
                        },
                    },
                    description: 'Email address of the customer to retrieve',
                },
                // Customer: Get - Fields Selection
                {
                    displayName: 'Customer Fields',
                    name: 'customerFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Balance Amount', value: 'customers_balance_amount' },
                        { name: 'Company', value: 'customers_company' },
                        { name: 'Corporate Name', value: 'customers_corporate_name' },
                        { name: 'Customer Name', value: 'customers_name' },
                        { name: 'Department Name', value: 'customers_department_name' },
                        { name: 'Email Address', value: 'customers_email_address' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'First Name', value: 'customers_first_name' },
                        { name: 'Last Name', value: 'customers_last_name' },
                        { name: 'Pay Limit', value: 'customers_pay_limit' },
                        { name: 'Pay On Enable', value: 'customers_payon_enable' },
                        { name: 'Register Date', value: 'customers_register_date' },
                        { name: 'Reward Points', value: 'reward_points' },
                        { name: 'Secondary Emails', value: 'customers_secondary_emails' },
                        { name: 'Status', value: 'customers_status' },
                        { name: 'Telephone', value: 'customers_telephone' },
                        { name: 'User Group Name', value: 'customers_user_group_name' },
                        { name: 'User ID', value: 'userid' },
                        { name: 'User Type', value: 'user_type' },
                        { name: 'Username', value: 'customers_username' },
                    ],
                    default: [
                        'userid',
                        'customers_name',
                        'customers_first_name',
                        'customers_last_name',
                        'customers_email_address',
                        'customers_telephone',
                        'customers_status',
                        'external_ref',
                    ],
                    description: 'Select customer fields to return when the field mode is Custom Selection',
                },
                // Customer: Get - Address Fields Selection
                {
                    displayName: 'Address Fields',
                    name: 'addressFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Address Type', value: 'address_type' },
                        { name: 'City', value: 'city' },
                        { name: 'Company', value: 'company' },
                        { name: 'Country', value: 'country' },
                        { name: 'Extra Field', value: 'extrafield' },
                        { name: 'First Name', value: 'first_name' },
                        { name: 'Is Default Address', value: 'is_default_address' },
                        { name: 'Last Name', value: 'last_name' },
                        { name: 'Name', value: 'name' },
                        { name: 'Postcode', value: 'postcode' },
                        { name: 'State', value: 'state' },
                        { name: 'Street Address', value: 'street_address' },
                        { name: 'Suburb', value: 'suburb' },
                        { name: 'Telephone', value: 'telephone' },
                    ],
                    default: [
                        'name',
                        'street_address',
                        'city',
                        'postcode',
                        'state',
                        'country',
                        'telephone',
                    ],
                    description: 'Select address fields to return when the field mode is Custom Selection. Leave empty to exclude address details.',
                },
                // Customer: Create - Required Fields
                {
                    displayName: 'Registration Type',
                    name: 'registration_type',
                    type: 'options',
                    required: true,
                    default: 1, // Default to Two Step
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        { name: 'Normal Register', value: 0 },
                        { name: 'Two Step Register', value: 1 },
                    ],
                    description: 'Registration type - Two Step sends email for completion, Normal creates fully registered customer',
                },
                {
                    displayName: 'First Name',
                    name: 'first_name',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['create'],
                        },
                    },
                    description: 'Customer first name',
                },
                {
                    displayName: 'Last Name',
                    name: 'last_name',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['create'],
                        },
                    },
                    description: 'Customer last name',
                },
                {
                    displayName: 'Email',
                    name: 'email',
                    type: 'string',
                    placeholder: 'name@email.com',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['create'],
                        },
                    },
                    description: 'Customer email address',
                },
                // Customer: Create - Optional Fields
                {
                    displayName: 'Optional Fields',
                    name: 'optionalFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['create'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Company Name',
                            name: 'company_name',
                            type: 'string',
                            default: '',
                            description: 'Customer company name',
                        },
                        {
                            displayName: 'Corporate ID',
                            name: 'corporateid',
                            type: 'number',
                            default: 0,
                            description: 'Store ID or 0 for default store',
                        },
                        {
                            displayName: 'Department ID',
                            name: 'departmentid',
                            type: 'number',
                            default: 0,
                            description: 'Department ID if any',
                        },
                        {
                            displayName: 'External Ref',
                            name: 'external_ref',
                            type: 'string',
                            default: '',
                            description: 'External system reference used to verify the OPS write',
                        },
                        {
                            displayName: 'Password',
                            name: 'password',
                            type: 'string',
                            typeOptions: { password: true },
                            default: '',
                            description: 'Customer password (auto-generated if empty for full registration)',
                        },
                        {
                            displayName: 'Payon Account',
                            name: 'payon_account',
                            type: 'number',
                            options: [
                                { name: 'Disabled', value: 0 },
                                { name: 'Enabled', value: 1 },
                            ],
                            default: 0,
                            description: '1 to enable payon for this customer, 0 otherwise',
                        },
                        {
                            displayName: 'Payon Limit',
                            name: 'payon_limit',
                            type: 'number',
                            default: 0,
                            description: 'Set payon limit for this customer (required if payon_account is 1)',
                        },
                        {
                            displayName: 'Phone Number',
                            name: 'phone_no',
                            type: 'string',
                            default: '',
                            description: 'Customer phone number',
                        },
                        {
                            displayName: 'Secondary Emails',
                            name: 'secondary_emails',
                            type: 'string',
                            default: '',
                            description: 'Comma-separated secondary emails (e.g., abc@test.com,xyz@test.com)',
                        },
                        {
                            displayName: 'Set Password',
                            name: 'set_password',
                            type: 'number',
                            options: [
                                { name: 'No', value: 0 },
                                { name: 'Yes', value: 1 },
                            ],
                            default: 0,
                            description: 'Set to 1 to change password, 0 otherwise',
                        },
                        {
                            displayName: 'Status',
                            name: 'status',
                            type: 'number',
                            default: 1,
                            description: 'Customer status (0=inactive, 1=active)',
                        },
                        {
                            displayName: 'Tax Exemption',
                            name: 'tax_exemption',
                            type: 'number',
                            options: [
                                { name: 'No', value: 0 },
                                { name: 'Yes', value: 1 },
                            ],
                            default: 0,
                            description: '1 if customer is tax exempted, 0 otherwise',
                        },
                        {
                            displayName: 'User Group',
                            name: 'user_group',
                            type: 'number',
                            default: 0,
                            description: 'Customer user group ID',
                        },
                    ],
                },
                // Customer: Update - Customer ID
                {
                    displayName: 'Customer ID',
                    name: 'customer_id',
                    type: 'number',
                    required: true,
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['update'],
                        },
                    },
                    description: 'Customer ID for update (required for update operation)',
                },
                // Customer: Update - Fields to Update
                {
                    displayName: 'Update Fields',
                    name: 'updateFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['update'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Company Name',
                            name: 'company_name',
                            type: 'string',
                            default: '',
                            description: 'Customer company name',
                        },
                        {
                            displayName: 'Corporate ID',
                            name: 'corporateid',
                            type: 'number',
                            default: 0,
                            description: 'Store ID or 0 for default store',
                        },
                        {
                            displayName: 'Department ID',
                            name: 'departmentid',
                            type: 'number',
                            default: 0,
                            description: 'Department ID if any',
                        },
                        {
                            displayName: 'Email',
                            name: 'email',
                            type: 'string',
                            placeholder: 'name@email.com',
                            default: '',
                            description: 'Customer email address',
                        },
                        {
                            displayName: 'External Ref',
                            name: 'external_ref',
                            type: 'string',
                            default: '',
                            description: 'External system reference used to verify the OPS write',
                        },
                        {
                            displayName: 'First Name',
                            name: 'first_name',
                            type: 'string',
                            default: '',
                            description: 'Customer first name',
                        },
                        {
                            displayName: 'Last Name',
                            name: 'last_name',
                            type: 'string',
                            default: '',
                            description: 'Customer last name',
                        },
                        {
                            displayName: 'Password',
                            name: 'password',
                            type: 'string',
                            typeOptions: { password: true },
                            default: '',
                            description: 'Customer password',
                        },
                        {
                            displayName: 'Payon Account',
                            name: 'payon_account',
                            type: 'number',
                            options: [
                                { name: 'Disabled', value: 0 },
                                { name: 'Enabled', value: 1 },
                            ],
                            default: 0,
                            description: '1 to enable payon for this customer, 0 otherwise',
                        },
                        {
                            displayName: 'Payon Limit',
                            name: 'payon_limit',
                            type: 'number',
                            default: 0,
                            description: 'Set payon limit for this customer (required if payon_account is 1)',
                        },
                        {
                            displayName: 'Phone Number',
                            name: 'phone_no',
                            type: 'string',
                            default: '',
                            description: 'Customer phone number',
                        },
                        {
                            displayName: 'Registration Type',
                            name: 'registration_type',
                            type: 'options',
                            options: [
                                { name: 'Normal Register', value: 0 },
                                { name: 'Two Step Register', value: 1 },
                            ],
                            default: 0,
                            description: '0 for normal register, 1 for two step register',
                        },
                        {
                            displayName: 'Secondary Emails',
                            name: 'secondary_emails',
                            type: 'string',
                            default: '',
                            description: 'Comma-separated secondary emails (e.g., abc@test.com,xyz@test.com)',
                        },
                        {
                            displayName: 'Set Password',
                            name: 'set_password',
                            type: 'number',
                            options: [
                                { name: 'No', value: 0 },
                                { name: 'Yes', value: 1 },
                            ],
                            default: 0,
                            description: 'Set to 1 to change password, 0 otherwise',
                        },
                        {
                            displayName: 'Status',
                            name: 'status',
                            type: 'number',
                            default: 0,
                            description: 'Customer status (0 or 1)',
                        },
                        {
                            displayName: 'Tax Exemption',
                            name: 'tax_exemption',
                            type: 'number',
                            options: [
                                { name: 'No', value: 0 },
                                { name: 'Yes', value: 1 },
                            ],
                            default: 0,
                            description: '1 if customer is tax exempted, 0 otherwise',
                        },
                        {
                            displayName: 'User Group',
                            name: 'user_group',
                            type: 'number',
                            default: 0,
                            description: 'Customer user group ID',
                        },
                    ],
                },
                // Customer: Get Many - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['getAll'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Customer: Get Many - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Date Type',
                            name: 'date_type',
                            type: 'options',
                            options: [
                                {
                                    name: 'Registration Date',
                                    value: 'REGISTRATION',
                                },
                                {
                                    name: 'Last Modified',
                                    value: 'MODIFIED',
                                },
                            ],
                            default: 'REGISTRATION',
                            description: 'Type of date to filter by',
                        },
                        {
                            displayName: 'Delay Between Pages (Ms)',
                            name: 'pageDelay',
                            type: 'number',
                            typeOptions: {
                                minValue: 25,
                            },
                            default: 50,
                            description: 'Delay between API calls when "Fetch All Pages" is enabled (default 50ms for better performance, min 25ms). Ignored for single page requests.',
                        },
                        {
                            displayName: 'Email',
                            name: 'email',
                            type: 'string',
                            placeholder: 'name@email.com',
                            default: '',
                            description: 'Filter customers by email address',
                        },
                        {
                            displayName: 'From Date',
                            name: 'from_date',
                            type: 'dateTime',
                            default: '',
                            description: 'Filter customers from this date',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of customers to skip. Ignored when "Fetch All Pages" is enabled.',
                        },
                        {
                            displayName: 'Page Size',
                            name: 'pageSize',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 250,
                            },
                            default: 250,
                            description: 'Records per page when "Fetch All Pages" is enabled (max 250 - API hard limit). Ignored for single page requests.',
                        },
                        {
                            displayName: 'To Date',
                            name: 'to_date',
                            type: 'dateTime',
                            default: '',
                            description: 'Filter customers to this date',
                        },
                    ],
                },
                // Customer: Get Many - Fields Selection
                {
                    displayName: 'Customer Fields',
                    name: 'customerFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Balance Amount', value: 'customers_balance_amount' },
                        { name: 'Company', value: 'customers_company' },
                        { name: 'Corporate Name', value: 'customers_corporate_name' },
                        { name: 'Customer Name', value: 'customers_name' },
                        { name: 'Department Name', value: 'customers_department_name' },
                        { name: 'Email Address', value: 'customers_email_address' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'First Name', value: 'customers_first_name' },
                        { name: 'Last Name', value: 'customers_last_name' },
                        { name: 'Pay Limit', value: 'customers_pay_limit' },
                        { name: 'Pay On Enable', value: 'customers_payon_enable' },
                        { name: 'Register Date', value: 'customers_register_date' },
                        { name: 'Reward Points', value: 'reward_points' },
                        { name: 'Secondary Emails', value: 'customers_secondary_emails' },
                        { name: 'Status', value: 'customers_status' },
                        { name: 'Telephone', value: 'customers_telephone' },
                        { name: 'User Group Name', value: 'customers_user_group_name' },
                        { name: 'User ID', value: 'userid' },
                        { name: 'User Type', value: 'user_type' },
                        { name: 'Username', value: 'customers_username' },
                    ],
                    default: [
                        'userid',
                        'user_type',
                        'customers_name',
                        'customers_first_name',
                        'customers_last_name',
                        'customers_company',
                        'customers_telephone',
                        'customers_email_address',
                        'customers_corporate_name',
                        'customers_status',
                        'customers_payon_enable',
                        'customers_pay_limit',
                        'customers_balance_amount',
                        'customers_department_name',
                        'customers_user_group_name',
                        'customers_register_date',
                        'customers_username',
                        'customers_secondary_emails',
                        'reward_points',
                        'external_ref',
                    ],
                    description: 'Select customer fields to return when the field mode is Custom Selection. All fields are selected by default.',
                },
                // Customer: Get Many - Address Fields Selection
                {
                    displayName: 'Address Fields',
                    name: 'addressFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['customer'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Address Type', value: 'address_type' },
                        { name: 'City', value: 'city' },
                        { name: 'Company', value: 'company' },
                        { name: 'Country', value: 'country' },
                        { name: 'Extra Field', value: 'extrafield' },
                        { name: 'First Name', value: 'first_name' },
                        { name: 'Is Default Address', value: 'is_default_address' },
                        { name: 'Last Name', value: 'last_name' },
                        { name: 'Name', value: 'name' },
                        { name: 'Postcode', value: 'postcode' },
                        { name: 'State', value: 'state' },
                        { name: 'Street Address', value: 'street_address' },
                        { name: 'Suburb', value: 'suburb' },
                        { name: 'Telephone', value: 'telephone' },
                    ],
                    default: [
                        'name',
                        'first_name',
                        'last_name',
                        'company',
                        'street_address',
                        'suburb',
                        'city',
                        'postcode',
                        'state',
                        'country',
                        'telephone',
                        'address_type',
                        'is_default_address',
                        'extrafield',
                    ],
                    description: 'Select address fields to return when the field mode is Custom Selection. All fields are selected by default. Leave empty to exclude address details.',
                },
                // Order Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['order'],
                        },
                    },
                    options: [
                        {
                            name: 'Create Shipment',
                            value: 'createShipment',
                            description: 'Create a new shipment for an order',
                            action: 'Create order shipment',
                        },
                        {
                            name: 'Get',
                            value: 'get',
                            description: 'Get a single order by ID',
                            action: 'Get an order',
                        },
                        {
                            name: 'Get Many',
                            value: 'getAll',
                            description: 'Get many orders',
                            action: 'Get many orders',
                        },
                        { name: 'Get Many (Legacy)', value: 'getMany', action: 'Get many orders' },
                        {
                            name: 'Get Shipments',
                            value: 'getShipments',
                            description: 'Get shipment details for an order',
                            action: 'Get order shipments',
                        },
                    ],
                    default: 'get',
                },
                // Order: Get - Order ID Field
                {
                    displayName: 'Order ID',
                    name: 'orderId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    description: 'ID of the order to retrieve',
                },
                // Order: Get - Fields Selection
                {
                    displayName: 'Order Fields',
                    name: 'orderFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Airway Bill Number', value: 'airway_bill_number' },
                        { name: 'Blind Shipping Charge', value: 'blind_shipping_charge' },
                        { name: 'Branch Name', value: 'branch_name' },
                        { name: 'Corporate ID', value: 'corporate_id' },
                        { name: 'Cost Center Code', value: 'cost_center_code' },
                        { name: 'Coupon Amount', value: 'coupon_amount' },
                        { name: 'Coupon Code', value: 'coupon_code' },
                        { name: 'Coupon Type', value: 'coupon_type' },
                        { name: 'Courier Company Name', value: 'courirer_company_name' },
                        { name: 'Department ID', value: 'department_id' },
                        { name: 'Extrafield', value: 'extrafield' },
                        { name: 'Invoice Date', value: 'invoice_date' },
                        { name: 'Invoice Number', value: 'invoice_number' },
                        { name: 'Local Orders Date Finished', value: 'local_orders_date_finished' },
                        { name: 'Order Amount', value: 'order_amount' },
                        { name: 'Order Last Modified Date', value: 'order_last_modified_date' },
                        { name: 'Order Name', value: 'order_name' },
                        { name: 'Order Status', value: 'order_status' },
                        { name: 'Order Vendor Amount', value: 'order_vendor_amount' },
                        { name: 'Orders Date Finished', value: 'orders_date_finished' },
                        { name: 'Orders Due Date', value: 'orders_due_date' },
                        { name: 'Orders Extrafield', value: 'orders_extrafield' },
                        { name: 'Orders ID', value: 'orders_id' },
                        { name: 'Orders Status ID', value: 'orders_status_id' },
                        { name: 'Parent Corporate ID', value: 'parent_corporate_id' },
                        { name: 'Partial Payment Details', value: 'partial_payment_details' },
                        { name: 'Payment Date', value: 'payment_date' },
                        { name: 'Payment Due Date', value: 'payment_due_date' },
                        { name: 'Payment Method Name', value: 'payment_method_name' },
                        { name: 'Payment Processing Fees', value: 'payment_processing_fees' },
                        { name: 'Payment Status Title', value: 'payment_status_title' },
                        { name: 'PO Number', value: 'po_number' },
                        { name: 'Production Due Date', value: 'production_due_date' },
                        { name: 'Refund Amount', value: 'refund_amount' },
                        { name: 'Reviewers', value: 'reviewers' },
                        { name: 'Sales Agent Name', value: 'sales_agent_name' },
                        { name: 'Shipping Amount', value: 'shipping_amount' },
                        { name: 'Shipping Mode', value: 'shipping_mode' },
                        { name: 'Shipping Type ID', value: 'shipping_type_id' },
                        { name: 'Tax Amount', value: 'tax_amount' },
                        { name: 'Total Amount', value: 'total_amount' },
                        { name: 'Total Weight', value: 'total_weight' },
                        { name: 'Transaction ID', value: 'transactionid' },
                        { name: 'User ID', value: 'user_id' },
                    ],
                    default: [
                        'user_id',
                        'orders_id',
                        'corporate_id',
                        'order_status',
                        'orders_status_id',
                        'orders_date_finished',
                        'local_orders_date_finished',
                        'shipping_mode',
                        'courirer_company_name',
                        'airway_bill_number',
                        'payment_method_name',
                        'total_amount',
                        'order_amount',
                        'shipping_amount',
                        'tax_amount',
                        'coupon_amount',
                        'coupon_code',
                        'coupon_type',
                        'order_vendor_amount',
                        'orders_due_date',
                        'order_last_modified_date',
                        'department_id',
                        'cost_center_code',
                        'po_number',
                        'total_weight',
                        'partial_payment_details',
                        'refund_amount',
                        'blind_shipping_charge',
                        'payment_due_date',
                        'transactionid',
                        'sales_agent_name',
                        'branch_name',
                        'payment_status_title',
                        'production_due_date',
                        'payment_processing_fees',
                        'payment_date',
                        'shipping_type_id',
                        'invoice_number',
                        'invoice_date',
                        'parent_corporate_id',
                        'order_name',
                        'orders_extrafield',
                        'reviewers',
                        'extrafield',
                    ],
                    description: 'Select order fields to return',
                },
                // Order: Get - Customer Fields
                {
                    displayName: 'Customer Fields',
                    name: 'customerFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Customer Balance', value: 'customers_balance_amount' },
                        { name: 'Customer Company', value: 'customers_company' },
                        { name: 'Customer Department', value: 'customers_department_name' },
                        { name: 'Customer Email', value: 'customers_email_address' },
                        { name: 'Customer First Name', value: 'customers_first_name' },
                        { name: 'Customer Last Name', value: 'customers_last_name' },
                        { name: 'Customer Name', value: 'customers_name' },
                        { name: 'Customer Pay Limit', value: 'customers_pay_limit' },
                        { name: 'Customer PayOn Enable', value: 'customers_payon_enable' },
                        { name: 'Customer Phone', value: 'customers_telephone' },
                        { name: 'Customer Register Date', value: 'customers_register_date' },
                        { name: 'Customer Status', value: 'customers_status' },
                        { name: 'Customer User Group', value: 'customers_user_group_name' },
                        { name: 'Customer Username', value: 'customers_username' },
                    ],
                    default: [
                        'customers_name',
                        'customers_email_address',
                        'customers_telephone',
                        'customers_company',
                    ],
                    description: 'Select customer fields to return',
                },
                // Order: Get - Product Fields
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Features Details', value: 'features_details' },
                        { name: 'Inventory Storage Days', value: 'inventory_storage_days' },
                        { name: 'Is Kit', value: 'is_kit' },
                        { name: 'Item Extra Info JSON', value: 'item_extra_info_json' },
                        { name: 'Mass Personalization Files', value: 'mass_personalization_files' },
                        { name: 'Orders Products ID', value: 'orders_products_id' },
                        { name: 'Orders Products ID Pattern', value: 'orders_products_id_pattern' },
                        { name: 'Orders Products Last Modified Date', value: 'orders_products_last_modified_date' },
                        { name: 'Photo Print Details', value: 'photo_print_details' },
                        { name: 'Predefined Product Type', value: 'predefined_product_type' },
                        { name: 'Print Ready Files', value: 'print_ready_files' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Info', value: 'product_info' },
                        { name: 'Product Printer Name', value: 'product_printer_name' },
                        { name: 'Product Production Due Date', value: 'product_production_due_date' },
                        { name: 'Product Size', value: 'productsize' },
                        { name: 'Product Size Details', value: 'product_size_details' },
                        { name: 'Product Status', value: 'product_status' },
                        { name: 'Product Status ID', value: 'product_status_id' },
                        { name: 'Product Tax', value: 'product_tax' },
                        { name: 'Products Name', value: 'products_name' },
                        { name: 'Products Price', value: 'products_price' },
                        { name: 'Products Quantity', value: 'products_quantity' },
                        { name: 'Products SKU', value: 'products_sku' },
                        { name: 'Products Title', value: 'products_title' },
                        { name: 'Products Unit Price', value: 'products_unit_price' },
                        { name: 'Products Vendor Price', value: 'products_vendor_price' },
                        { name: 'Products Weight', value: 'products_weight' },
                        { name: 'Proof Files', value: 'proof_files' },
                        { name: 'Quote ID', value: 'quote_id' },
                        { name: 'Reference Order ID', value: 'reference_order_id' },
                        { name: 'Template Info', value: 'template_info' },
                        { name: 'Template Type', value: 'template_type' },
                        { name: 'Ziflow Link', value: 'ziflow_link' },
                    ],
                    default: [
                        'orders_products_id',
                        'products_name',
                        'products_sku',
                        'products_price',
                        'products_quantity',
                        'product_status',
                    ],
                    description: 'Select product fields to return',
                },
                // Order: Get - Blind Detail Fields
                {
                    displayName: 'Blind Detail Fields',
                    name: 'blindDetailFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Blind City', value: 'blind_city' },
                        { name: 'Blind Company', value: 'blind_company' },
                        { name: 'Blind Country', value: 'blind_country' },
                        { name: 'Blind Name', value: 'blind_name' },
                        { name: 'Blind Postcode', value: 'blind_postcode' },
                        { name: 'Blind State', value: 'blind_state' },
                        { name: 'Blind State Code', value: 'blind_state_code' },
                        { name: 'Blind Street Address', value: 'blind_street_address' },
                        { name: 'Blind Suburb', value: 'blind_suburb' },
                    ],
                    default: [
                        'blind_name',
                        'blind_company',
                        'blind_street_address',
                        'blind_city',
                        'blind_state',
                        'blind_country',
                    ],
                    description: 'Select blind detail fields to return',
                },
                // Order: Get - Delivery Detail Fields
                {
                    displayName: 'Delivery Detail Fields',
                    name: 'deliveryDetailFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Delivery City', value: 'delivery_city' },
                        { name: 'Delivery Company', value: 'delivery_company' },
                        { name: 'Delivery Country', value: 'delivery_country' },
                        { name: 'Delivery Extrafield', value: 'delivery_extrafield' },
                        { name: 'Delivery Name', value: 'delivery_name' },
                        { name: 'Delivery Postcode', value: 'delivery_postcode' },
                        { name: 'Delivery State', value: 'delivery_state' },
                        { name: 'Delivery State Code', value: 'delivery_state_code' },
                        { name: 'Delivery Street Address', value: 'delivery_street_address' },
                        { name: 'Delivery Suburb', value: 'delivery_suburb' },
                        { name: 'Delivery Telephone', value: 'delivery_telephone' },
                    ],
                    default: [
                        'delivery_name',
                        'delivery_company',
                        'delivery_street_address',
                        'delivery_city',
                        'delivery_state',
                        'delivery_country',
                        'delivery_telephone',
                    ],
                    description: 'Select delivery detail fields to return',
                },
                // Order: Get - Billing Detail Fields
                {
                    displayName: 'Billing Detail Fields',
                    name: 'billingDetailFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Billing City', value: 'billing_city' },
                        { name: 'Billing Company', value: 'billing_company' },
                        { name: 'Billing Country', value: 'billing_country' },
                        { name: 'Billing Extrafield', value: 'billing_extrafield' },
                        { name: 'Billing Name', value: 'billing_name' },
                        { name: 'Billing Postcode', value: 'billing_postcode' },
                        { name: 'Billing State', value: 'billing_state' },
                        { name: 'Billing State Code', value: 'billing_state_code' },
                        { name: 'Billing Street Address', value: 'billing_street_address' },
                        { name: 'Billing Suburb', value: 'billing_suburb' },
                        { name: 'Billing Telephone', value: 'billing_telephone' },
                    ],
                    default: [
                        'billing_name',
                        'billing_company',
                        'billing_street_address',
                        'billing_city',
                        'billing_state',
                        'billing_country',
                        'billing_telephone',
                    ],
                    description: 'Select billing detail fields to return',
                },
                // Order: Get - Shipment Detail Fields
                {
                    displayName: 'Shipment Detail Fields',
                    name: 'shipmentDetailFieldsGet',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['get'],
                        },
                    },
                    options: [
                        { name: 'Shipment Company', value: 'shipment_company' },
                        { name: 'Shipment Package', value: 'shipment_package' },
                        { name: 'Shipment Shipping Type ID', value: 'shipment_shipping_type_id' },
                        { name: 'Shipment Total Weight', value: 'shipment_total_weight' },
                        { name: 'Shipment Tracking Number', value: 'shipment_tracking_number' },
                    ],
                    default: [
                        'shipment_tracking_number',
                        'shipment_company',
                        'shipment_total_weight',
                    ],
                    description: 'Select shipment detail fields to return',
                },
                // Order: Get Many - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Order: Get Many - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Customer ID',
                            name: 'customer_id',
                            type: 'number',
                            default: 0,
                            description: 'Filter by customer ID',
                        },
                        {
                            displayName: 'Delay Between Pages (Ms)',
                            name: 'pageDelay',
                            type: 'number',
                            typeOptions: {
                                minValue: 50,
                            },
                            default: 100,
                            description: 'Delay between API calls when "Fetch All Pages" is enabled (recommended: 100-500ms). Ignored for single page requests.',
                        },
                        {
                            displayName: 'From Date',
                            name: 'from_date',
                            type: 'dateTime',
                            default: '',
                            description: 'Filter orders from this date',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of orders to skip. Ignored when "Fetch All Pages" is enabled.',
                        },
                        {
                            displayName: 'Order Product Status',
                            name: 'order_product_status',
                            type: 'number',
                            default: 0,
                            description: 'Filter by order product status',
                        },
                        {
                            displayName: 'Order Status',
                            name: 'order_status',
                            type: 'string',
                            default: '',
                            description: 'Filter by order status',
                        },
                        {
                            displayName: 'Order Type',
                            name: 'order_type',
                            type: 'options',
                            options: [
                                { name: 'All', value: '' },
                                { name: 'Standard', value: 'STANDARD' },
                                { name: 'Quote', value: 'QUOTE' },
                            ],
                            default: '',
                            description: 'Filter by order type',
                        },
                        {
                            displayName: 'Orders ID',
                            name: 'orders_id',
                            type: 'number',
                            default: 0,
                            description: 'Filter by specific order ID',
                        },
                        {
                            displayName: 'Orders Products ID',
                            name: 'orders_products_id',
                            type: 'number',
                            default: 0,
                            description: 'Filter by orders products ID',
                        },
                        {
                            displayName: 'Page Size',
                            name: 'pageSize',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 250,
                            },
                            default: 250,
                            description: 'Records per page when "Fetch All Pages" is enabled (max 250). Ignored for single page requests.',
                        },
                        {
                            displayName: 'Store ID',
                            name: 'store_id',
                            type: 'string',
                            default: '',
                            description: 'Filter by store ID',
                        },
                        {
                            displayName: 'To Date',
                            name: 'to_date',
                            type: 'dateTime',
                            default: '',
                            description: 'Filter orders to this date',
                        },
                    ],
                },
                // Order: Get Many - Fields Selection (excluding Order ID)
                {
                    displayName: 'Order Fields',
                    name: 'orderFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Airway Bill Number', value: 'airway_bill_number' },
                        { name: 'Blind Shipping Charge', value: 'blind_shipping_charge' },
                        { name: 'Branch Name', value: 'branch_name' },
                        { name: 'Corporate ID', value: 'corporate_id' },
                        { name: 'Cost Center Code', value: 'cost_center_code' },
                        { name: 'Coupon Amount', value: 'coupon_amount' },
                        { name: 'Coupon Code', value: 'coupon_code' },
                        { name: 'Coupon Type', value: 'coupon_type' },
                        { name: 'Courier Company Name', value: 'courirer_company_name' },
                        { name: 'Department ID', value: 'department_id' },
                        { name: 'Extrafield', value: 'extrafield' },
                        { name: 'Invoice Date', value: 'invoice_date' },
                        { name: 'Invoice Number', value: 'invoice_number' },
                        { name: 'Local Orders Date Finished', value: 'local_orders_date_finished' },
                        { name: 'Order Amount', value: 'order_amount' },
                        { name: 'Order Last Modified Date', value: 'order_last_modified_date' },
                        { name: 'Order Name', value: 'order_name' },
                        { name: 'Order Status', value: 'order_status' },
                        { name: 'Order Vendor Amount', value: 'order_vendor_amount' },
                        { name: 'Orders Date Finished', value: 'orders_date_finished' },
                        { name: 'Orders Due Date', value: 'orders_due_date' },
                        { name: 'Orders Extrafield', value: 'orders_extrafield' },
                        { name: 'Orders ID', value: 'orders_id' },
                        { name: 'Orders Status ID', value: 'orders_status_id' },
                        { name: 'Parent Corporate ID', value: 'parent_corporate_id' },
                        { name: 'Partial Payment Details', value: 'partial_payment_details' },
                        { name: 'Payment Date', value: 'payment_date' },
                        { name: 'Payment Due Date', value: 'payment_due_date' },
                        { name: 'Payment Method Name', value: 'payment_method_name' },
                        { name: 'Payment Processing Fees', value: 'payment_processing_fees' },
                        { name: 'Payment Status Title', value: 'payment_status_title' },
                        { name: 'PO Number', value: 'po_number' },
                        { name: 'Production Due Date', value: 'production_due_date' },
                        { name: 'Refund Amount', value: 'refund_amount' },
                        { name: 'Reviewers', value: 'reviewers' },
                        { name: 'Sales Agent Name', value: 'sales_agent_name' },
                        { name: 'Shipping Amount', value: 'shipping_amount' },
                        { name: 'Shipping Mode', value: 'shipping_mode' },
                        { name: 'Shipping Type ID', value: 'shipping_type_id' },
                        { name: 'Tax Amount', value: 'tax_amount' },
                        { name: 'Total Amount', value: 'total_amount' },
                        { name: 'Total Weight', value: 'total_weight' },
                        { name: 'Transaction ID', value: 'transactionid' },
                        { name: 'User ID', value: 'user_id' },
                    ],
                    default: [
                        'user_id',
                        'orders_id',
                        'corporate_id',
                        'order_status',
                        'orders_status_id',
                        'orders_date_finished',
                        'local_orders_date_finished',
                        'shipping_mode',
                        'courirer_company_name',
                        'airway_bill_number',
                        'payment_method_name',
                        'total_amount',
                        'order_amount',
                        'shipping_amount',
                        'tax_amount',
                        'coupon_amount',
                        'coupon_code',
                        'coupon_type',
                        'order_vendor_amount',
                        'orders_due_date',
                        'order_last_modified_date',
                        'department_id',
                        'cost_center_code',
                        'po_number',
                        'total_weight',
                        'partial_payment_details',
                        'refund_amount',
                        'blind_shipping_charge',
                        'payment_due_date',
                        'transactionid',
                        'sales_agent_name',
                        'branch_name',
                        'payment_status_title',
                        'production_due_date',
                        'payment_processing_fees',
                        'payment_date',
                        'shipping_type_id',
                        'invoice_number',
                        'invoice_date',
                        'parent_corporate_id',
                        'order_name',
                        'orders_extrafield',
                        'reviewers',
                        'extrafield',
                    ],
                    description: 'Select order fields to return',
                },
                // Order: Get Many - Customer Fields Selection
                {
                    displayName: 'Customer Fields',
                    name: 'customerFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Customers Balance Amount', value: 'customers_balance_amount' },
                        { name: 'Customers Company', value: 'customers_company' },
                        { name: 'Customers Department Name', value: 'customers_department_name' },
                        { name: 'Customers Email Address', value: 'customers_email_address' },
                        { name: 'Customers First Name', value: 'customers_first_name' },
                        { name: 'Customers Last Name', value: 'customers_last_name' },
                        { name: 'Customers Name', value: 'customers_name' },
                        { name: 'Customers Pay Limit', value: 'customers_pay_limit' },
                        { name: 'Customers Payon Enable', value: 'customers_payon_enable' },
                        { name: 'Customers Register Date', value: 'customers_register_date' },
                        { name: 'Customers Status', value: 'customers_status' },
                        { name: 'Customers Telephone', value: 'customers_telephone' },
                        { name: 'Customers User Group Name', value: 'customers_user_group_name' },
                        { name: 'Customers Username', value: 'customers_username' },
                    ],
                    default: [
                        'customers_name',
                        'customers_email_address',
                        'customers_telephone',
                        'customers_company',
                        'customers_register_date',
                        'customers_username',
                        'customers_user_group_name',
                        'customers_department_name',
                        'customers_balance_amount',
                        'customers_pay_limit',
                        'customers_payon_enable',
                        'customers_status',
                        'customers_first_name',
                        'customers_last_name',
                    ],
                    description: 'Select customer fields to return',
                },
                // Order: Get Many - Product Fields Selection
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Features Details', value: 'features_details' },
                        { name: 'Inventory Storage Days', value: 'inventory_storage_days' },
                        { name: 'Is Kit', value: 'is_kit' },
                        { name: 'Item Extra Info JSON', value: 'item_extra_info_json' },
                        { name: 'Mass Personalization Files', value: 'mass_personalization_files' },
                        { name: 'Orders Products ID', value: 'orders_products_id' },
                        { name: 'Orders Products ID Pattern', value: 'orders_products_id_pattern' },
                        { name: 'Orders Products Last Modified Date', value: 'orders_products_last_modified_date' },
                        { name: 'Photo Print Details', value: 'photo_print_details' },
                        { name: 'Predefined Product Type', value: 'predefined_product_type' },
                        { name: 'Print Ready Files', value: 'print_ready_files' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Info', value: 'product_info' },
                        { name: 'Product Printer Name', value: 'product_printer_name' },
                        { name: 'Product Production Due Date', value: 'product_production_due_date' },
                        { name: 'Product Size', value: 'productsize' },
                        { name: 'Product Size Details', value: 'product_size_details' },
                        { name: 'Product Status', value: 'product_status' },
                        { name: 'Product Status ID', value: 'product_status_id' },
                        { name: 'Product Tax', value: 'product_tax' },
                        { name: 'Products Name', value: 'products_name' },
                        { name: 'Products Price', value: 'products_price' },
                        { name: 'Products Quantity', value: 'products_quantity' },
                        { name: 'Products SKU', value: 'products_sku' },
                        { name: 'Products Title', value: 'products_title' },
                        { name: 'Products Unit Price', value: 'products_unit_price' },
                        { name: 'Products Vendor Price', value: 'products_vendor_price' },
                        { name: 'Products Weight', value: 'products_weight' },
                        { name: 'Proof Files', value: 'proof_files' },
                        { name: 'Quote ID', value: 'quote_id' },
                        { name: 'Reference Order ID', value: 'reference_order_id' },
                        { name: 'Template Info', value: 'template_info' },
                        { name: 'Template Type', value: 'template_type' },
                        { name: 'Ziflow Link', value: 'ziflow_link' },
                    ],
                    default: [
                        'orders_products_id',
                        'product_size_details',
                        'products_name',
                        'products_title',
                        'products_sku',
                        'products_price',
                        'products_quantity',
                        'template_type',
                        'features_details',
                        'photo_print_details',
                        'productsize',
                        'mass_personalization_files',
                        'products_vendor_price',
                        'products_weight',
                        'inventory_storage_days',
                        'product_status_id',
                        'product_status',
                        'product_id',
                        'reference_order_id',
                        'is_kit',
                        'product_tax',
                        'product_info',
                        'template_info',
                        'product_printer_name',
                        'products_unit_price',
                        'quote_id',
                        'product_production_due_date',
                        'orders_products_id_pattern',
                        'orders_products_last_modified_date',
                        'predefined_product_type',
                        'ziflow_link',
                        'print_ready_files',
                        'proof_files',
                        'item_extra_info_json',
                    ],
                    description: 'Select product fields to return',
                },
                // Order: Get Many - Blind Detail Fields Selection
                {
                    displayName: 'Blind Detail Fields',
                    name: 'blindDetailFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Blind City', value: 'blind_city' },
                        { name: 'Blind Company', value: 'blind_company' },
                        { name: 'Blind Country', value: 'blind_country' },
                        { name: 'Blind Name', value: 'blind_name' },
                        { name: 'Blind Postcode', value: 'blind_postcode' },
                        { name: 'Blind State', value: 'blind_state' },
                        { name: 'Blind State Code', value: 'blind_state_code' },
                        { name: 'Blind Street Address', value: 'blind_street_address' },
                        { name: 'Blind Suburb', value: 'blind_suburb' },
                    ],
                    default: [
                        'blind_name',
                        'blind_company',
                        'blind_street_address',
                        'blind_suburb',
                        'blind_city',
                        'blind_postcode',
                        'blind_state',
                        'blind_state_code',
                        'blind_country',
                    ],
                    description: 'Select blind detail fields to return',
                },
                // Order: Get Many - Delivery Detail Fields Selection
                {
                    displayName: 'Delivery Detail Fields',
                    name: 'deliveryDetailFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Delivery City', value: 'delivery_city' },
                        { name: 'Delivery Company', value: 'delivery_company' },
                        { name: 'Delivery Country', value: 'delivery_country' },
                        { name: 'Delivery Extrafield', value: 'delivery_extrafield' },
                        { name: 'Delivery Name', value: 'delivery_name' },
                        { name: 'Delivery Postcode', value: 'delivery_postcode' },
                        { name: 'Delivery State', value: 'delivery_state' },
                        { name: 'Delivery State Code', value: 'delivery_state_code' },
                        { name: 'Delivery Street Address', value: 'delivery_street_address' },
                        { name: 'Delivery Suburb', value: 'delivery_suburb' },
                        { name: 'Delivery Telephone', value: 'delivery_telephone' },
                    ],
                    default: [
                        'delivery_name',
                        'delivery_company',
                        'delivery_street_address',
                        'delivery_suburb',
                        'delivery_city',
                        'delivery_postcode',
                        'delivery_state',
                        'delivery_state_code',
                        'delivery_country',
                        'delivery_telephone',
                        'delivery_extrafield',
                    ],
                    description: 'Select delivery detail fields to return',
                },
                // Order: Get Many - Billing Detail Fields Selection
                {
                    displayName: 'Billing Detail Fields',
                    name: 'billingDetailFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Billing City', value: 'billing_city' },
                        { name: 'Billing Company', value: 'billing_company' },
                        { name: 'Billing Country', value: 'billing_country' },
                        { name: 'Billing Extrafield', value: 'billing_extrafield' },
                        { name: 'Billing Name', value: 'billing_name' },
                        { name: 'Billing Postcode', value: 'billing_postcode' },
                        { name: 'Billing State', value: 'billing_state' },
                        { name: 'Billing State Code', value: 'billing_state_code' },
                        { name: 'Billing Street Address', value: 'billing_street_address' },
                        { name: 'Billing Suburb', value: 'billing_suburb' },
                        { name: 'Billing Telephone', value: 'billing_telephone' },
                    ],
                    default: [
                        'billing_name',
                        'billing_company',
                        'billing_street_address',
                        'billing_suburb',
                        'billing_city',
                        'billing_postcode',
                        'billing_state',
                        'billing_state_code',
                        'billing_country',
                        'billing_telephone',
                        'billing_extrafield',
                    ],
                    description: 'Select billing detail fields to return',
                },
                // Order: Get Many - Shipment Detail Fields Selection
                {
                    displayName: 'Shipment Detail Fields',
                    name: 'shipmentDetailFieldsGetAll',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getAll'],
                        },
                    },
                    options: [
                        { name: 'Shipment Company', value: 'shipment_company' },
                        { name: 'Shipment Package', value: 'shipment_package' },
                        { name: 'Shipment Shipping Type ID', value: 'shipment_shipping_type_id' },
                        { name: 'Shipment Total Weight', value: 'shipment_total_weight' },
                        { name: 'Shipment Tracking Number', value: 'shipment_tracking_number' },
                    ],
                    default: [
                        'shipment_shipping_type_id',
                        'shipment_tracking_number',
                        'shipment_company',
                        'shipment_total_weight',
                        'shipment_package',
                    ],
                    description: 'Select shipment detail fields to return',
                },
                // Order: Get Shipments - Order ID Field
                {
                    displayName: 'Order ID',
                    name: 'orderIdShipments',
                    type: 'number',
                    required: true,
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getShipments'],
                        },
                    },
                    description: 'ID of the order to retrieve shipment details for',
                },
                // Order: Get Shipments - Fields Selection
                {
                    displayName: 'Shipment Fields',
                    name: 'shipmentFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['getShipments'],
                        },
                    },
                    options: [
                        { name: 'Company', value: 'shipment_company' },
                        { name: 'Package', value: 'shipment_package' },
                        { name: 'Total Weight', value: 'shipment_total_weight' },
                        { name: 'Tracking Number', value: 'shipment_tracking_number' },
                    ],
                    default: [
                        'shipment_tracking_number',
                        'shipment_company',
                        'shipment_total_weight',
                        'shipment_package',
                    ],
                    description: 'Select shipment fields to return',
                },
                // Order: Create Shipment - Order ID Field
                {
                    displayName: 'Order ID',
                    name: 'orderIdCreate',
                    type: 'number',
                    required: true,
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['createShipment'],
                        },
                    },
                    description: 'ID of the order to create shipment for',
                },
                // Order: Create Shipment - Shipment ID Field
                {
                    displayName: 'Shipment ID',
                    name: 'shipmentId',
                    type: 'number',
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['createShipment'],
                        },
                    },
                    description: 'Shipment ID (optional, leave 0 for new shipment)',
                },
                // Order: Create Shipment - Tracking Number
                {
                    displayName: 'Tracking Number',
                    name: 'trackingNumber',
                    type: 'string',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['createShipment'],
                        },
                    },
                    description: 'Tracking number for the shipment',
                },
                // Order: Create Shipment - Packages
                {
                    displayName: 'Packages',
                    name: 'packages',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['order'],
                            operation: ['createShipment'],
                        },
                    },
                    placeholder: 'Add Package',
                    options: [
                        {
                            displayName: 'Package',
                            name: 'package',
                            values: [
                                {
                                    displayName: 'Height',
                                    name: 'height',
                                    type: 'number',
                                    default: 0,
                                    description: 'Package height',
                                },
                                {
                                    displayName: 'Length',
                                    name: 'length',
                                    type: 'number',
                                    default: 0,
                                    description: 'Package length',
                                },
                                {
                                    displayName: 'Order Products',
                                    name: 'orderProducts',
                                    type: 'fixedCollection',
                                    default: {},
                                    placeholder: 'Add Product',
                                    options: [
                                        {
                                            displayName: 'Product',
                                            name: 'product',
                                            values: [
                                                {
                                                    displayName: 'Product ID',
                                                    name: 'opid',
                                                    type: 'number',
                                                    default: 0,
                                                    description: 'Order product ID',
                                                },
                                                {
                                                    displayName: 'Quantity',
                                                    name: 'qty',
                                                    type: 'string',
                                                    default: '1',
                                                    description: 'Quantity for this product',
                                                },
                                            ]
                                        },
                                    ],
                                    description: 'Order products included in this package',
                                },
                                {
                                    displayName: 'Package Tracking',
                                    name: 'tracking',
                                    type: 'string',
                                    default: '',
                                    description: 'Package tracking number',
                                },
                                {
                                    displayName: 'Weight',
                                    name: 'weight',
                                    type: 'number',
                                    default: 0,
                                    description: 'Package weight',
                                },
                                {
                                    displayName: 'Width',
                                    name: 'width',
                                    type: 'number',
                                    default: 0,
                                    description: 'Package width',
                                },
                            ],
                        },
                    ],
                    description: 'Package information for the shipment (can add multiple packages)',
                },
                // Product Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Category',
                            value: 'getCategory',
                            description: 'Get a single product category',
                            action: 'Get a product category',
                        },
                        {
                            name: 'Get Detailed',
                            value: 'getDetailed',
                            description: 'Get a single product with detailed fields',
                            action: 'Get a product detailed',
                        },
                        {
                            name: 'Get FAQs',
                            value: 'getFAQs',
                            description: 'Get FAQs for a product or category',
                            action: 'Get fa qs',
                        },
                        {
                            name: 'Get Many Categories',
                            value: 'getManyCategories',
                            description: 'Get many product categories',
                            action: 'Get many product categories',
                        },
                        {
                            name: 'Get Many Detailed',
                            value: 'getManyDetailed',
                            description: 'Get many products with detailed fields',
                            action: 'Get many products detailed',
                        },
                        {
                            name: 'Get Many FAQs',
                            value: 'getManyFAQs',
                            action: 'Get many fa qs',
                        },
                        { name: 'Get Many Master Option Ranges (Legacy)', value: 'getManyMasterOptionRanges', action: 'Get many master option ranges' },
                        { name: 'Get Many Master Option Tags (Legacy)', value: 'getManyMasterOptionTags', action: 'Get many master option tags' },
                        {
                            name: 'Get Many Master Options',
                            value: 'getManyMasterOptions',
                            description: 'Get master options for many products',
                            action: 'Get many product master options',
                        },
                        { name: 'Get Many Option Groups (Legacy)', value: 'getManyOptionGroups', action: 'Get many option groups' },
                        {
                            name: 'Get Many Option Prices',
                            value: 'getManyOptionPrices',
                            description: 'Get option prices for many products',
                            action: 'Get many product option prices',
                        },
                        {
                            name: 'Get Many Options Rules',
                            value: 'getManyOptionsRules',
                            description: 'Get options rules for many products',
                            action: 'Get many product options rules',
                        },
                        {
                            name: 'Get Many Prices',
                            value: 'getManyPrices',
                            description: 'Get prices for many products',
                            action: 'Get many product prices',
                        },
                        {
                            name: 'Get Many Simple',
                            value: 'getManySimple',
                            description: 'Get many products with simple fields',
                            action: 'Get many products simple',
                        },
                        {
                            name: 'Get Master Options',
                            value: 'getMasterOptions',
                            description: 'Get master options for a product',
                            action: 'Get product master options',
                        },
                        {
                            name: 'Get Option Prices',
                            value: 'getOptionPrices',
                            description: 'Get option prices for a product',
                            action: 'Get product option prices',
                        },
                        {
                            name: 'Get Options Rules',
                            value: 'getOptionsRules',
                            description: 'Get options rules for a product',
                            action: 'Get product options rules',
                        },
                        {
                            name: 'Get Prices',
                            value: 'getPrices',
                            description: 'Get prices for a product',
                            action: 'Get product prices',
                        },
                        {
                            name: 'Get Simple',
                            value: 'getSimple',
                            description: 'Get a single product with simple fields',
                            action: 'Get a product simple',
                        },
                        {
                            name: 'Get SKU Matrix (Staging)',
                            value: 'getSkuMatrix',
                            description: 'Get size and option combinations used for product SKU creation',
                            action: 'Get product SKU matrix',
                        },
                        {
                            name: 'Get Stock',
                            value: 'getStock',
                            description: 'Get product stock information',
                            action: 'Get product stock',
                        },
                        {
                            name: 'Set Product SKU (Staging)',
                            value: 'setProductSku',
                            description: 'Create update or delete product SKU mappings',
                            action: 'Set product SKU',
                        },
                        {
                            name: 'Update Stock',
                            value: 'updateStock',
                            description: 'Update product stock',
                            action: 'Update product stock',
                        },
                    ],
                    default: 'getSimple',
                },
                // Product: Get Simple - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getSimple'],
                        },
                    },
                    description: 'ID of the product to retrieve',
                },
                // Product: Get Simple - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getSimple'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of products to skip',
                        },
                    ],
                },
                // Product: Get Simple - Fields Selection
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsSimple',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getSimple'],
                        },
                    },
                    options: [
                        { name: 'Is Stock', value: 'isstock' },
                        { name: 'Main SKU', value: 'main_sku' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Name', value: 'product_name' },
                    ],
                    default: [
                        'product_id',
                        'product_name',
                        'main_sku',
                        'isstock',
                    ],
                    description: 'Select product fields to return',
                },
                // Product: Get Many Simple - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManySimple'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Product: Get Many Simple - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManySimple',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManySimple'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Delay Between Pages (Ms)',
                            name: 'pageDelay',
                            type: 'number',
                            typeOptions: {
                                minValue: 25,
                            },
                            default: 50,
                            description: 'Delay between API calls when "Fetch All Pages" is enabled (default 50ms for better performance, min 25ms). Ignored for single page requests.',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of products to skip. Ignored when "Fetch All Pages" is enabled.',
                        },
                        {
                            displayName: 'Page Size',
                            name: 'pageSize',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 250,
                            },
                            default: 250,
                            description: 'Records per page when "Fetch All Pages" is enabled (max 250 - API hard limit). Ignored for single page requests.',
                        },
                    ],
                },
                // Product: Get Many Simple - Fields Selection
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsManySimple',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManySimple'],
                        },
                    },
                    options: [
                        { name: 'Is Stock', value: 'isstock' },
                        { name: 'Main SKU', value: 'main_sku' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Name', value: 'product_name' },
                    ],
                    default: [
                        'product_id',
                        'product_name',
                        'main_sku',
                        'isstock',
                    ],
                    description: 'Select product fields to return',
                },
                // Product: Get Detailed - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdDetailed',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getDetailed'],
                        },
                    },
                    description: 'ID of the product to retrieve',
                },
                // Product: Get Detailed - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersDetailed',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getDetailed'],
                        },
                    },
                    options: [
                        {
                            displayName: 'All Store',
                            name: 'all_store',
                            type: 'number',
                            default: 0,
                            description: 'All store filter',
                        },
                        {
                            displayName: 'External Catalogue',
                            name: 'externalCatalogue',
                            type: 'number',
                            default: 0,
                            description: 'External catalogue filter from the current OnPrintShop API collection',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of products to skip',
                        },
                        {
                            displayName: 'Status',
                            name: 'status',
                            type: 'number',
                            default: 1,
                            description: 'Product status filter',
                        },
                    ],
                },
                // Product: Get Detailed - Fields Selection
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsDetailed',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getDetailed'],
                        },
                    },
                    options: [
                        { name: 'All Store', value: 'all_store' },
                        { name: 'Associate Attribute ID', value: 'associate_attribute_id' },
                        { name: 'Associate Attribute Key', value: 'associate_attribute_key' },
                        { name: 'Associate Calculation Type', value: 'associate_calculation_type' },
                        { name: 'Associate Multiplier', value: 'associate_multiplier' },
                        { name: 'Associate Option ID', value: 'associate_option_id' },
                        { name: 'Associate Option Key', value: 'associate_option_key' },
                        { name: 'Associate Size ID', value: 'associate_size_id' },
                        { name: 'Associate Status', value: 'associate_status' },
                        { name: 'Associated Category IDs', value: 'associated_category_ids' },
                        { name: 'Associated Category Names', value: 'associated_category_names' },
                        { name: 'Custom Cross Check Height Width', value: 'custom_cross_check_height_width' },
                        { name: 'Custom Size Info', value: 'custom_size_info' },
                        { name: 'Custom Size Restrict Data', value: 'custom_size_restrict_data' },
                        { name: 'Default Category ID', value: 'default_category_id' },
                        { name: 'Default Category Name', value: 'default_category_name' },
                        { name: 'Default Production Days', value: 'default_production_days' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Kit Products', value: 'kit_products' },
                        { name: 'Kit Type ID', value: 'kit_type_id' },
                        { name: 'Large Image', value: 'large_image' },
                        { name: 'Long Description', value: 'long_description' },
                        { name: 'Long Description Two', value: 'long_description_two' },
                        { name: 'Main SKU', value: 'main_sku' },
                        { name: 'Predefined Product Type', value: 'predefined_product_type' },
                        { name: 'Product Cut Off Time', value: 'product_cut_off_time' },
                        { name: 'Product Default Quantity Interval', value: 'product_default_quantity_interval' },
                        { name: 'Product Hire Designer Cost', value: 'product_hire_designer_cost' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Minimum Price', value: 'product_minimum_price' },
                        { name: 'Product Name', value: 'product_name' },
                        { name: 'Product Pages', value: 'productpages' },
                        { name: 'Product Setup Cost', value: 'product_setup_cost' },
                        { name: 'Product Start Price', value: 'product_start_price' },
                        { name: 'Product URL', value: 'product_url' },
                        { name: 'Products Draw Area Margins', value: 'products_draw_area_margins' },
                        { name: 'Products Draw Cutting Margins', value: 'products_draw_cutting_margins' },
                        { name: 'Products Internal Name', value: 'products_internal_name' },
                        { name: 'Schema Markup', value: 'schema_markup' },
                        { name: 'Search Keywords', value: 'search_keywords' },
                        { name: 'SEO Page Description', value: 'seo_page_description' },
                        { name: 'SEO Page Metatags', value: 'seo_page_metatags' },
                        { name: 'SEO Page Title', value: 'seo_page_title' },
                        { name: 'Short Description', value: 'short_description' },
                        { name: 'Small Image', value: 'small_image' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                    ],
                    default: [
                        'product_id',
                        'status',
                        'sort_order',
                        'product_name',
                        'default_category_id',
                        'associated_category_ids',
                        'default_category_name',
                        'associated_category_names',
                        'small_image',
                        'large_image',
                        'product_url',
                        'long_description',
                        'predefined_product_type',
                        'all_store',
                        'products_internal_name',
                        'search_keywords',
                        'short_description',
                        'long_description_two',
                        'seo_page_title',
                        'seo_page_description',
                        'schema_markup',
                        'seo_page_metatags',
                        'main_sku',
                        'default_production_days',
                        'product_cut_off_time',
                        'products_draw_area_margins',
                        'products_draw_cutting_margins',
                        'productpages',
                        'custom_size_restrict_data',
                        'product_default_quantity_interval',
                        'custom_cross_check_height_width',
                        'custom_size_info',
                        'product_setup_cost',
                        'product_hire_designer_cost',
                        'product_minimum_price',
                        'product_start_price',
                        'external_ref',
                    ],
                    description: 'Select product fields to return',
                },
                // Product: Get Many Detailed - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyDetailed'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Product: Get Many Detailed - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyDetailed',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyDetailed'],
                        },
                    },
                    options: [
                        {
                            displayName: 'All Store',
                            name: 'all_store',
                            type: 'number',
                            default: 0,
                            description: 'All store filter',
                        },
                        {
                            displayName: 'Delay Between Pages (Ms)',
                            name: 'pageDelay',
                            type: 'number',
                            typeOptions: {
                                minValue: 25,
                            },
                            default: 50,
                            description: 'Delay between API calls when "Fetch All Pages" is enabled (default 50ms for better performance, min 25ms). Ignored for single page requests.',
                        },
                        {
                            displayName: 'External Catalogue',
                            name: 'externalCatalogue',
                            type: 'number',
                            default: 0,
                            description: 'External catalogue filter from the current OnPrintShop API collection',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of products to skip. Ignored when "Fetch All Pages" is enabled.',
                        },
                        {
                            displayName: 'Page Size',
                            name: 'pageSize',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 250,
                            },
                            default: 250,
                            description: 'Records per page when "Fetch All Pages" is enabled (max 250 - API hard limit). Ignored for single page requests.',
                        },
                        {
                            displayName: 'Status',
                            name: 'status',
                            type: 'number',
                            default: 1,
                            description: 'Product status filter',
                        },
                    ],
                },
                // Product: Get Many Detailed - Fields Selection
                {
                    displayName: 'Product Fields',
                    name: 'productFieldsManyDetailed',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyDetailed'],
                        },
                    },
                    options: [
                        { name: 'All Store', value: 'all_store' },
                        { name: 'Associate Attribute ID', value: 'associate_attribute_id' },
                        { name: 'Associate Attribute Key', value: 'associate_attribute_key' },
                        { name: 'Associate Calculation Type', value: 'associate_calculation_type' },
                        { name: 'Associate Multiplier', value: 'associate_multiplier' },
                        { name: 'Associate Option ID', value: 'associate_option_id' },
                        { name: 'Associate Option Key', value: 'associate_option_key' },
                        { name: 'Associate Size ID', value: 'associate_size_id' },
                        { name: 'Associate Status', value: 'associate_status' },
                        { name: 'Associated Category IDs', value: 'associated_category_ids' },
                        { name: 'Associated Category Names', value: 'associated_category_names' },
                        { name: 'Custom Cross Check Height Width', value: 'custom_cross_check_height_width' },
                        { name: 'Custom Size Info', value: 'custom_size_info' },
                        { name: 'Custom Size Restrict Data', value: 'custom_size_restrict_data' },
                        { name: 'Default Category ID', value: 'default_category_id' },
                        { name: 'Default Category Name', value: 'default_category_name' },
                        { name: 'Default Production Days', value: 'default_production_days' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Kit Products', value: 'kit_products' },
                        { name: 'Kit Type ID', value: 'kit_type_id' },
                        { name: 'Large Image', value: 'large_image' },
                        { name: 'Long Description', value: 'long_description' },
                        { name: 'Long Description Two', value: 'long_description_two' },
                        { name: 'Main SKU', value: 'main_sku' },
                        { name: 'Predefined Product Type', value: 'predefined_product_type' },
                        { name: 'Product Additional Options (Nested)', value: 'product_additional_options' },
                        { name: 'Product Cut Off Time', value: 'product_cut_off_time' },
                        { name: 'Product Default Quantity Interval', value: 'product_default_quantity_interval' },
                        { name: 'Product Hire Designer Cost', value: 'product_hire_designer_cost' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Minimum Price', value: 'product_minimum_price' },
                        { name: 'Product Name', value: 'product_name' },
                        { name: 'Product Pages', value: 'productpages' },
                        { name: 'Product Setup Cost', value: 'product_setup_cost' },
                        { name: 'Product Size (Nested)', value: 'product_size' },
                        { name: 'Product Start Price', value: 'product_start_price' },
                        { name: 'Product URL', value: 'product_url' },
                        { name: 'Products Draw Area Margins', value: 'products_draw_area_margins' },
                        { name: 'Products Draw Cutting Margins', value: 'products_draw_cutting_margins' },
                        { name: 'Products Internal Name', value: 'products_internal_name' },
                        { name: 'Schema Markup', value: 'schema_markup' },
                        { name: 'Search Keywords', value: 'search_keywords' },
                        { name: 'SEO Page Description', value: 'seo_page_description' },
                        { name: 'SEO Page Metatags', value: 'seo_page_metatags' },
                        { name: 'SEO Page Title', value: 'seo_page_title' },
                        { name: 'Short Description', value: 'short_description' },
                        { name: 'Small Image', value: 'small_image' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                    ],
                    default: [
                        'product_id',
                        'status',
                        'sort_order',
                        'product_name',
                        'default_category_id',
                        'associated_category_ids',
                        'default_category_name',
                        'associated_category_names',
                        'small_image',
                        'large_image',
                        'product_url',
                        'long_description',
                        'predefined_product_type',
                        'all_store',
                        'products_internal_name',
                        'search_keywords',
                        'short_description',
                        'long_description_two',
                        'seo_page_title',
                        'seo_page_description',
                        'schema_markup',
                        'seo_page_metatags',
                        'main_sku',
                        'default_production_days',
                        'product_cut_off_time',
                        'products_draw_area_margins',
                        'products_draw_cutting_margins',
                        'productpages',
                        'custom_size_restrict_data',
                        'product_default_quantity_interval',
                        'custom_cross_check_height_width',
                        'custom_size_info',
                        'product_setup_cost',
                        'product_hire_designer_cost',
                        'product_minimum_price',
                        'product_start_price',
                        'external_ref',
                    ],
                    description: 'Select product fields to return',
                },
                // Product: Get Many Detailed - Product Size Fields (Nested)
                {
                    displayName: 'Product Size Fields',
                    name: 'productSizeFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getDetailed', 'getManyDetailed'],
                        },
                    },
                    options: [
                        { name: 'Size Height', value: 'size_height' },
                        { name: 'Size ID', value: 'size_id' },
                        { name: 'Size Image', value: 'size_image' },
                        { name: 'Size Title', value: 'size_title' },
                        { name: 'Size Unit', value: 'size_unit' },
                        { name: 'Size Width', value: 'size_width' },
                        { name: 'Sort Order', value: 'sort_order' },
                    ],
                    default: [
                        'size_id',
                        'size_title',
                        'size_width',
                        'size_height',
                        'sort_order',
                    ],
                    description: 'Select product size fields to return. Leave empty to exclude product sizes.',
                },
                // Product: Get Many Detailed - Product Additional Options Fields (Nested)
                {
                    displayName: 'Product Additional Options Fields',
                    name: 'productAdditionalOptionsFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getDetailed', 'getManyDetailed'],
                        },
                    },
                    options: [
                        { name: 'Applicable For', value: 'applicable_for' },
                        { name: 'Apply Multiplication', value: 'apply_multiplication' },
                        { name: 'Attributes', value: 'attributes' },
                        { name: 'Description', value: 'description' },
                        { name: 'Hire Designer Option', value: 'hire_designer_option' },
                        { name: 'Master Option ID', value: 'master_option_id' },
                        { name: 'Option Key', value: 'option_key' },
                        { name: 'Options Type', value: 'options_type' },
                        { name: 'Price Calculate Type', value: 'price_calculate_type' },
                        { name: 'Product Additional Option ID', value: 'prod_add_opt_id' },
                        { name: 'Required', value: 'required' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                        { name: 'Title', value: 'title' },
                    ],
                    default: [
                        'prod_add_opt_id',
                        'title',
                        'description',
                        'option_key',
                        'options_type',
                        'sort_order',
                        'status',
                        'apply_multiplication',
                        'applicable_for',
                        'required',
                        'price_calculate_type',
                        'hire_designer_option',
                        'master_option_id',
                        'attributes',
                    ],
                    description: 'Select product additional options fields to return. Leave empty to exclude additional options.',
                },
                // Product: Get Category - Category ID
                {
                    displayName: 'Category ID',
                    name: 'categoryId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getCategory'],
                        },
                    },
                    description: 'ID of the category to retrieve',
                },
                // Product: Get Category - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersCategory',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getCategory'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of categories to skip',
                        },
                    ],
                },
                // Product: Get Category - Fields Selection
                {
                    displayName: 'Category Fields',
                    name: 'categoryFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getCategory'],
                        },
                    },
                    options: [
                        { name: 'Category Header Content', value: 'category_header_content' },
                        { name: 'Category ID', value: 'category_id' },
                        { name: 'Category Image', value: 'category_image' },
                        { name: 'Category Internal Name', value: 'category_internal_name' },
                        { name: 'Category Name', value: 'category_name' },
                        { name: 'Category URL', value: 'category_url' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Long Description', value: 'long_description' },
                        { name: 'Long Description Two', value: 'long_description_two' },
                        { name: 'Parent ID', value: 'parent_id' },
                        { name: 'Schema Markup', value: 'schema_markup' },
                        { name: 'SEO Page Description', value: 'seo_page_description' },
                        { name: 'SEO Page Title', value: 'seo_page_title' },
                        { name: 'Short Description', value: 'short_description' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                    ],
                    default: [
                        'category_id',
                        'sort_order',
                        'status',
                        'parent_id',
                        'category_name',
                        'category_url',
                        'category_internal_name',
                        'category_image',
                        'short_description',
                        'category_header_content',
                        'long_description_two',
                        'long_description',
                        'seo_page_title',
                        'seo_page_description',
                        'schema_markup',
                        'external_ref',
                    ],
                    description: 'Select category fields to return',
                },
                // Product: Get Many Categories - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyCategories',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyCategories'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of categories to skip',
                        },
                    ],
                },
                // Product: Get Many Categories - Fields Selection
                {
                    displayName: 'Category Fields',
                    name: 'categoryFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyCategories'],
                        },
                    },
                    options: [
                        { name: 'Category Header Content', value: 'category_header_content' },
                        { name: 'Category ID', value: 'category_id' },
                        { name: 'Category Image', value: 'category_image' },
                        { name: 'Category Internal Name', value: 'category_internal_name' },
                        { name: 'Category Name', value: 'category_name' },
                        { name: 'Category URL', value: 'category_url' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Long Description', value: 'long_description' },
                        { name: 'Long Description Two', value: 'long_description_two' },
                        { name: 'Parent ID', value: 'parent_id' },
                        { name: 'Schema Markup', value: 'schema_markup' },
                        { name: 'SEO Page Description', value: 'seo_page_description' },
                        { name: 'SEO Page Title', value: 'seo_page_title' },
                        { name: 'Short Description', value: 'short_description' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                    ],
                    default: [
                        'category_id',
                        'sort_order',
                        'status',
                        'parent_id',
                        'category_name',
                        'category_url',
                        'category_internal_name',
                        'category_image',
                        'short_description',
                        'category_header_content',
                        'long_description_two',
                        'long_description',
                        'seo_page_title',
                        'seo_page_description',
                        'schema_markup',
                        'external_ref',
                    ],
                    description: 'Select category fields to return',
                },
                // Product: Get Stock - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdStock',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getStock'],
                        },
                    },
                    description: 'ID of the product to retrieve stock for',
                },
                // Product: Get Stock - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersStock',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getStock'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of stock records to skip',
                        },
                    ],
                },
                // Product: Get Stock - Fields Selection
                {
                    displayName: 'Stock Fields',
                    name: 'stockFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getStock'],
                        },
                    },
                    options: [
                        { name: 'Credit Stock', value: 'credit_stock' },
                        { name: 'Debited Stock', value: 'debited_stock' },
                        { name: 'Option Details', value: 'option_details' },
                        { name: 'Product ID', value: 'product_id' },
                        { name: 'Product Name', value: 'product_name' },
                        { name: 'Size ID', value: 'size_id' },
                        { name: 'Size Title', value: 'size_title' },
                        { name: 'Stock ID', value: 'stock_id' },
                        { name: 'Stock Quantity', value: 'stock_quantity' },
                    ],
                    default: [
                        'stock_id',
                        'product_id',
                        'product_name',
                        'size_id',
                        'size_title',
                        'credit_stock',
                        'debited_stock',
                        'stock_quantity',
                        'option_details',
                    ],
                    description: 'Select stock fields to return',
                },
                // Product: Get SKU Matrix - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productSkuMatrix_products_id',
                    type: 'number',
                    required: true,
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getSkuMatrix'],
                        },
                    },
                    description: 'Product ID for SKU matrix generation',
                },
                // Product: Get SKU Matrix - Additional Option IDs
                {
                    displayName: 'Product Additional Option IDs',
                    name: 'productSkuMatrix_prod_add_opt_ids',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getSkuMatrix'],
                        },
                    },
                    description: 'Comma-separated product additional option IDs, e.g. 8021,8022',
                },
                // Product: Set Product SKU
                {
                    displayName: 'Inputs (JSON Array)',
                    name: 'setProductSku_input',
                    type: 'json',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['product', 'mutation'],
                            operation: ['setProductSku'],
                        },
                    },
                    default: '[\n  {\n    "products_id": 288,\n    "sku_type": "size_option_wise",\n    "size_id": 611,\n    "prod_add_opt_ids": "6557",\n    "attribute_ids": "11481",\n    "sku": "SKU-001",\n    "delete": 0\n  }\n]',
                    description: 'ProductSkuInput JSON array; set delete to 1 to remove a SKU mapping',
                },
                // Product: Update Stock - Identifier Type
                {
                    displayName: 'Identifier Type',
                    name: 'stockIdentifierType',
                    type: 'options',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                        },
                    },
                    options: [
                        {
                            name: 'Product SKU',
                            value: 'product_sku',
                        },
                        {
                            name: 'Stock ID',
                            value: 'stock_id',
                        },
                    ],
                    default: 'stock_id',
                    description: 'Choose to identify stock by Stock ID or Product SKU',
                },
                // Product: Update Stock - Stock ID
                {
                    displayName: 'Stock ID',
                    name: 'stockId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                            stockIdentifierType: ['stock_id'],
                        },
                    },
                    description: 'ID of the stock to update',
                },
                // Product: Update Stock - Product SKU
                {
                    displayName: 'Product SKU',
                    name: 'productSku',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                            stockIdentifierType: ['product_sku'],
                        },
                    },
                    description: 'SKU of the product to update stock for',
                },
                // Product: Update Stock - Action
                {
                    displayName: 'Action',
                    name: 'stockAction',
                    type: 'options',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                        },
                    },
                    options: [
                        {
                            name: 'Add',
                            value: 'Add',
                        },
                        {
                            name: 'Remove',
                            value: 'Remove',
                        },
                        {
                            name: 'Set',
                            value: 'Set',
                        },
                    ],
                    default: 'Set',
                },
                // Product: Update Stock - Stock Quantity
                {
                    displayName: 'Stock Quantity',
                    name: 'stock_quantity',
                    type: 'number',
                    required: true,
                    default: 0,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                        },
                    },
                    description: 'Quantity to credit, debit, or set',
                },
                // Product: Update Stock - Comment
                {
                    displayName: 'Comment',
                    name: 'comment',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['updateStock'],
                        },
                    },
                    description: 'Comment for the stock update',
                },
                // ==================== PRODUCT: GET MASTER OPTIONS ====================
                // Product: Get Master Options - Master Option ID
                {
                    displayName: 'Master Option ID',
                    name: 'masterOptionId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getMasterOptions'],
                        },
                    },
                    description: 'ID of the master option to retrieve',
                },
                // Product: Get Master Options - Fields Selection
                {
                    displayName: 'Master Options Fields',
                    name: 'masterOptionsFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getMasterOptions'],
                        },
                    },
                    options: [
                        { name: 'Additional Lookup Details', value: 'additional_lookup_details' },
                        { name: 'Allow Price Cal', value: 'allow_price_cal' },
                        { name: 'Attributes', value: 'attributes' },
                        { name: 'Custom Lookup', value: 'custom_lookup' },
                        { name: 'Description', value: 'description' },
                        { name: 'Enable Assoc Qty', value: 'enable_assoc_qty' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Formula', value: 'formula' },
                        { name: 'Hide From Calc', value: 'hide_from_calc' },
                        { name: 'Hire Designer Option', value: 'hire_designer_option' },
                        { name: 'Linear Formula', value: 'linear_formula' },
                        { name: 'Master Option ID', value: 'master_option_id' },
                        { name: 'Option Key', value: 'option_key' },
                        { name: 'Options Type', value: 'options_type' },
                        { name: 'Price Range Lookup', value: 'price_range_lookup' },
                        { name: 'Pricing Method', value: 'pricing_method' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                        { name: 'Title', value: 'title' },
                        { name: 'Weight Setting', value: 'weight_setting' },
                    ],
                    default: [
                        'master_option_id',
                        'title',
                        'description',
                        'option_key',
                        'pricing_method',
                        'status',
                        'sort_order',
                        'options_type',
                        'external_ref',
                    ],
                    description: 'Select master options fields to return. All fields selected by default.',
                },
                // Product: Get Many Master Options - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyMasterOptions',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyMasterOptions'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Master Option ID',
                            name: 'master_option_id',
                            type: 'string',
                            default: '',
                            description: 'Filter by specific master option ID',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of records to skip',
                        },
                    ],
                },
                // Product: Get Many Master Options - Fields Selection
                {
                    displayName: 'Master Options Fields',
                    name: 'masterOptionsFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyMasterOptions'],
                        },
                    },
                    options: [
                        { name: 'Additional Lookup Details', value: 'additional_lookup_details' },
                        { name: 'Allow Price Cal', value: 'allow_price_cal' },
                        { name: 'Attributes', value: 'attributes' },
                        { name: 'Custom Lookup', value: 'custom_lookup' },
                        { name: 'Description', value: 'description' },
                        { name: 'Enable Assoc Qty', value: 'enable_assoc_qty' },
                        { name: 'External Ref', value: 'external_ref' },
                        { name: 'Formula', value: 'formula' },
                        { name: 'Hide From Calc', value: 'hide_from_calc' },
                        { name: 'Hire Designer Option', value: 'hire_designer_option' },
                        { name: 'Linear Formula', value: 'linear_formula' },
                        { name: 'Master Option ID', value: 'master_option_id' },
                        { name: 'Option Key', value: 'option_key' },
                        { name: 'Options Type', value: 'options_type' },
                        { name: 'Price Range Lookup', value: 'price_range_lookup' },
                        { name: 'Pricing Method', value: 'pricing_method' },
                        { name: 'Sort Order', value: 'sort_order' },
                        { name: 'Status', value: 'status' },
                        { name: 'Title', value: 'title' },
                        { name: 'Weight Setting', value: 'weight_setting' },
                    ],
                    default: [
                        'master_option_id',
                        'title',
                        'description',
                        'option_key',
                        'pricing_method',
                        'status',
                        'sort_order',
                        'options_type',
                        'external_ref',
                    ],
                    description: 'Select master options fields to return. All fields selected by default.',
                },
                // ==================== PRODUCT: GET OPTIONS RULES ====================
                // Product: Get Options Rules - Rule ID
                {
                    displayName: 'Rule ID',
                    name: 'ruleId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getOptionsRules'],
                        },
                    },
                    description: 'ID of the rule to retrieve',
                },
                // Product: Get Options Rules - Fields Selection
                {
                    displayName: 'Options Rules Fields',
                    name: 'optionsRulesFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getOptionsRules'],
                        },
                    },
                    options: [
                        { name: 'Action', value: 'action' },
                        { name: 'Condition', value: 'condition' },
                        { name: 'Rule ID', value: 'rule_id' },
                        { name: 'Rule Name', value: 'rule_name' },
                        { name: 'Rule Type', value: 'rule_type' },
                        { name: 'Sort Order', value: 'sort_order' },
                    ],
                    default: [
                        'rule_id',
                        'rule_name',
                        'rule_type',
                        'condition',
                        'action',
                        'sort_order',
                    ],
                    description: 'Select options rules fields to return. All fields selected by default.',
                },
                // Product: Get Many Options Rules - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyOptionsRules',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyOptionsRules'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of records to skip',
                        },
                        {
                            displayName: 'Rule ID',
                            name: 'rule_id',
                            type: 'string',
                            default: '',
                            description: 'Filter by specific rule ID',
                        },
                    ],
                },
                // Product: Get Many Options Rules - Fields Selection
                {
                    displayName: 'Options Rules Fields',
                    name: 'optionsRulesFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyOptionsRules'],
                        },
                    },
                    options: [
                        { name: 'Action', value: 'action' },
                        { name: 'Condition', value: 'condition' },
                        { name: 'Rule ID', value: 'rule_id' },
                        { name: 'Rule Name', value: 'rule_name' },
                        { name: 'Rule Type', value: 'rule_type' },
                        { name: 'Sort Order', value: 'sort_order' },
                    ],
                    default: [
                        'rule_id',
                        'rule_name',
                        'rule_type',
                        'condition',
                        'action',
                        'sort_order',
                    ],
                    description: 'Select options rules fields to return. All fields selected by default.',
                },
                // ==================== PRODUCT: GET PRICES ====================
                // Product: Get Prices - Product UUID
                {
                    displayName: 'Product UUID',
                    name: 'productIdPrices',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getPrices'],
                        },
                    },
                    description: 'UUID of the product to retrieve prices for',
                },
                // Product: Get Prices - Fields Selection
                {
                    displayName: 'Prices Fields',
                    name: 'pricesFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getPrices'],
                        },
                    },
                    options: [
                        { name: 'Currency', value: 'currency' },
                        { name: 'Maximum Quantity', value: 'max_quantity' },
                        { name: 'Minimum Quantity', value: 'min_quantity' },
                        { name: 'Price ID', value: 'price_id' },
                        { name: 'Price Type', value: 'price_type' },
                        { name: 'Price Value', value: 'price_value' },
                        { name: 'Valid From', value: 'valid_from' },
                        { name: 'Valid To', value: 'valid_to' },
                    ],
                    default: [
                        'price_id',
                        'price_type',
                        'price_value',
                        'currency',
                        'min_quantity',
                        'max_quantity',
                        'valid_from',
                        'valid_to',
                    ],
                    description: 'Select prices fields to return. All fields selected by default.',
                },
                // Product: Get Many Prices - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyPrices',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyPrices'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of records to skip',
                        },
                        {
                            displayName: 'Product UUID',
                            name: 'product_uuid',
                            type: 'string',
                            default: '',
                            description: 'Filter by specific product UUID',
                        },
                    ],
                },
                // Product: Get Many Prices - Fields Selection
                {
                    displayName: 'Prices Fields',
                    name: 'pricesFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyPrices'],
                        },
                    },
                    options: [
                        { name: 'Currency', value: 'currency' },
                        { name: 'Maximum Quantity', value: 'max_quantity' },
                        { name: 'Minimum Quantity', value: 'min_quantity' },
                        { name: 'Price ID', value: 'price_id' },
                        { name: 'Price Type', value: 'price_type' },
                        { name: 'Price Value', value: 'price_value' },
                        { name: 'Valid From', value: 'valid_from' },
                        { name: 'Valid To', value: 'valid_to' },
                    ],
                    default: [
                        'price_id',
                        'price_type',
                        'price_value',
                        'currency',
                        'min_quantity',
                        'max_quantity',
                        'valid_from',
                        'valid_to',
                    ],
                    description: 'Select prices fields to return. All fields selected by default.',
                },
                // ==================== PRODUCT: GET OPTION PRICES ====================
                // Product: Get Option Prices - Attribute ID
                {
                    displayName: 'Attribute ID',
                    name: 'productIdOptionPrices',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getOptionPrices'],
                        },
                    },
                    description: 'Attribute ID to retrieve option prices for',
                },
                // Product: Get Option Prices - Fields Selection
                {
                    displayName: 'Option Prices Fields',
                    name: 'optionPricesFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getOptionPrices'],
                        },
                    },
                    options: [
                        { name: 'Attribute ID', value: 'attr_id' },
                        { name: 'Currency', value: 'currency' },
                        { name: 'Option Price ID', value: 'option_price_id' },
                        { name: 'Option Value', value: 'option_value' },
                        { name: 'Price Adjustment', value: 'price_adjustment' },
                        { name: 'Price Adjustment Type', value: 'price_adjustment_type' },
                        { name: 'Sort Order', value: 'sort_order' },
                    ],
                    default: [
                        'option_price_id',
                        'attr_id',
                        'option_value',
                        'price_adjustment',
                        'price_adjustment_type',
                        'currency',
                        'sort_order',
                    ],
                    description: 'Select option prices fields to return. All fields selected by default.',
                },
                // Product: Get Many Option Prices - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyOptionPrices',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyOptionPrices'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Attribute ID',
                            name: 'attr_id',
                            type: 'string',
                            default: '',
                            description: 'Filter by specific attribute ID',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of records to skip',
                        },
                    ],
                },
                // Product: Get Many Option Prices - Fields Selection
                {
                    displayName: 'Option Prices Fields',
                    name: 'optionPricesFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyOptionPrices'],
                        },
                    },
                    options: [
                        { name: 'Attribute ID', value: 'attr_id' },
                        { name: 'Currency', value: 'currency' },
                        { name: 'Option Price ID', value: 'option_price_id' },
                        { name: 'Option Value', value: 'option_value' },
                        { name: 'Price Adjustment', value: 'price_adjustment' },
                        { name: 'Price Adjustment Type', value: 'price_adjustment_type' },
                        { name: 'Sort Order', value: 'sort_order' },
                    ],
                    default: [
                        'option_price_id',
                        'attr_id',
                        'option_value',
                        'price_adjustment',
                        'price_adjustment_type',
                        'currency',
                        'sort_order',
                    ],
                    description: 'Select option prices fields to return. All fields selected by default.',
                },
                // ==================== PRODUCT: GET FAQS ====================
                // Product: Get FAQs - FAQ ID Field
                {
                    displayName: 'FAQ ID',
                    name: 'faqId',
                    type: 'number',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getFAQs'],
                        },
                    },
                    description: 'ID of the FAQ to retrieve',
                },
                // Product: Get FAQs - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersFAQs',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getFAQs'],
                        },
                    },
                    options: [
                        {
                            displayName: 'FAQ Category ID',
                            name: 'faqcat_id',
                            type: 'number',
                            default: '',
                            description: 'Filter FAQs by category ID',
                        },
                        {
                            displayName: 'FAQ ID',
                            name: 'faq_id',
                            type: 'number',
                            default: '',
                            description: 'Filter FAQs by specific FAQ ID',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of FAQs to skip',
                        },
                    ],
                },
                // Product: Get FAQs - Fields Selection
                {
                    displayName: 'FAQ Fields',
                    name: 'faqFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getFAQs'],
                        },
                    },
                    options: [
                        {
                            name: 'Category_ids',
                            value: 'category_ids',
                        },
                        {
                            name: 'Faq_answer',
                            value: 'faq_answer',
                        },
                        {
                            name: 'Faq_category_name',
                            value: 'faq_category_name',
                        },
                        {
                            name: 'Faq_id',
                            value: 'faq_id',
                        },
                        {
                            name: 'Faq_question',
                            value: 'faq_question',
                        },
                        {
                            name: 'Faq_type',
                            value: 'faq_type',
                        },
                        {
                            name: 'Faqcat_id',
                            value: 'faqcat_id',
                        },
                        {
                            name: 'Product_ids',
                            value: 'product_ids',
                        },
                        {
                            name: 'Sort_order',
                            value: 'sort_order',
                        },
                        {
                            name: 'Status',
                            value: 'status',
                        },
                    ],
                    default: [
                        'faq_id',
                        'faqcat_id',
                        'status',
                        'sort_order',
                        'faq_type',
                        'faq_question',
                        'faq_answer',
                        'faq_category_name',
                        'product_ids',
                        'category_ids',
                    ],
                    description: 'Select FAQ fields to return. All fields selected by default.',
                },
                // Product: Get Many FAQs - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPagesFAQs',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyFAQs'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Product: Get Many FAQs - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyFAQs',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyFAQs'],
                        },
                    },
                    options: [
                        {
                            displayName: 'FAQ Category ID',
                            name: 'faqcat_id',
                            type: 'number',
                            default: '',
                            description: 'Filter FAQs by category ID',
                        },
                        {
                            displayName: 'FAQ ID',
                            name: 'faq_id',
                            type: 'number',
                            default: '',
                            description: 'Filter FAQs by specific FAQ ID',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of FAQs to skip',
                        },
                    ],
                },
                // Product: Get Many FAQs - Fields Selection
                {
                    displayName: 'FAQ Fields',
                    name: 'faqFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getManyFAQs'],
                        },
                    },
                    options: [
                        {
                            name: 'Category_ids',
                            value: 'category_ids',
                        },
                        {
                            name: 'Faq_answer',
                            value: 'faq_answer',
                        },
                        {
                            name: 'Faq_category_name',
                            value: 'faq_category_name',
                        },
                        {
                            name: 'Faq_id',
                            value: 'faq_id',
                        },
                        {
                            name: 'Faq_question',
                            value: 'faq_question',
                        },
                        {
                            name: 'Faq_type',
                            value: 'faq_type',
                        },
                        {
                            name: 'Faqcat_id',
                            value: 'faqcat_id',
                        },
                        {
                            name: 'Product_ids',
                            value: 'product_ids',
                        },
                        {
                            name: 'Sort_order',
                            value: 'sort_order',
                        },
                        {
                            name: 'Status',
                            value: 'status',
                        },
                    ],
                    default: [
                        'faq_id',
                        'faqcat_id',
                        'status',
                        'sort_order',
                        'faq_type',
                        'faq_question',
                        'faq_answer',
                        'faq_category_name',
                        'product_ids',
                        'category_ids',
                    ],
                    description: 'Select FAQ fields to return. All fields selected by default.',
                },
                // Status Operations
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['status'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Many Status',
                            value: 'getManyStatus',
                            description: 'Get many statuses',
                            action: 'Get many statuses',
                        },
                        {
                            name: 'Get Status',
                            value: 'getStatus',
                            description: 'Get a single status by ID',
                            action: 'Get a status',
                        },
                    ],
                    default: 'getStatus',
                },
                // Status: Get Status - Process Status ID
                {
                    displayName: 'Process Status ID',
                    name: 'processStatusId',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getStatus'],
                        },
                    },
                    description: 'ID of the process status to retrieve',
                },
                // Status: Get Status - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersStatus',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getStatus'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of statuses to skip',
                        },
                    ],
                },
                // Status: Get Status - Status Fields Selection
                {
                    displayName: 'Status Fields',
                    name: 'statusFields',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getStatus'],
                        },
                    },
                    options: [
                        { name: 'Process Status ID', value: 'process_status_id' },
                        { name: 'Process Status Internal', value: 'process_status_internal' },
                        { name: 'Process Status Set As', value: 'process_status_set_as' },
                        { name: 'Process Status Title', value: 'process_status_title' },
                        { name: 'Status Type', value: 'status_type' },
                    ],
                    default: [
                        'process_status_id',
                        'process_status_title',
                        'status_type',
                        'process_status_set_as',
                        'process_status_internal',
                    ],
                    description: 'Select status fields to return',
                },
                // Status: Get Many Status - Fetch All Pages
                {
                    displayName: 'Fetch All Pages',
                    name: 'fetchAllPages',
                    type: 'boolean',
                    default: false,
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getManyStatus'],
                        },
                    },
                    description: 'Whether to fetch all pages until no more records are available (ignores limit/offset)',
                },
                // Status: Get Many Status - Query Parameters
                {
                    displayName: 'Query Parameters',
                    name: 'queryParametersManyStatus',
                    type: 'collection',
                    placeholder: 'Add Parameter',
                    default: {},
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getManyStatus'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Delay Between Pages (Ms)',
                            name: 'pageDelay',
                            type: 'number',
                            typeOptions: {
                                minValue: 25,
                            },
                            default: 50,
                            description: 'Delay between API calls when "Fetch All Pages" is enabled (default 50ms for better performance, min 25ms). Ignored for single page requests.',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            default: 0,
                            description: 'Number of statuses to skip. Ignored when "Fetch All Pages" is enabled.',
                        },
                        {
                            displayName: 'Page Size',
                            name: 'pageSize',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 250,
                            },
                            default: 250,
                            description: 'Records per page when "Fetch All Pages" is enabled (max 250 - API hard limit). Ignored for single page requests.',
                        },
                    ],
                },
                // Status: Get Many Status - Status Type Filter
                {
                    displayName: 'Status Type Filter',
                    name: 'statusTypeFilter',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getManyStatus'],
                        },
                    },
                    options: [
                        {
                            name: 'Both',
                            value: 'both',
                            description: 'Show both Order and Product statuses',
                        },
                        {
                            name: 'Order Only',
                            value: 'order',
                            description: 'Show only Order statuses',
                        },
                        {
                            name: 'Product Only',
                            value: 'product',
                            description: 'Show only Product statuses',
                        },
                    ],
                    default: 'both',
                    description: 'Filter statuses by type',
                },
                // Status: Get Many Status - Status Fields Selection
                {
                    displayName: 'Status Fields',
                    name: 'statusFieldsMany',
                    type: 'multiOptions',
                    displayOptions: {
                        show: {
                            resource: ['status'],
                            operation: ['getManyStatus'],
                        },
                    },
                    options: [
                        { name: 'Process Status ID', value: 'process_status_id' },
                        { name: 'Process Status Internal', value: 'process_status_internal' },
                        { name: 'Process Status Set As', value: 'process_status_set_as' },
                        { name: 'Process Status Title', value: 'process_status_title' },
                        { name: 'Status Type', value: 'status_type' },
                    ],
                    default: [
                        'process_status_id',
                        'process_status_title',
                        'status_type',
                        'process_status_set_as',
                        'process_status_internal',
                    ],
                    description: 'Select status fields to return',
                },
                // Product: Get Product Details - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdDetails',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getProductDetails'],
                        },
                    },
                    description: 'ID of the product to retrieve detailed information for',
                },
                // Product: Get Product Master Options - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdMasterOptions',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getProductMasterOptions'],
                        },
                    },
                    description: 'ID of the product to retrieve master options for',
                },
                // Product: Get Product Options Rules - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdOptionsRules',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getProductOptionsRules'],
                        },
                    },
                    description: 'ID of the product to retrieve options rules for',
                },
                // Product: Get Product Prices - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdPrices',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getProductPrices'],
                        },
                    },
                    description: 'ID of the product to retrieve pricing information for',
                },
                // Product: Get Product Option Prices - Product ID
                {
                    displayName: 'Product ID',
                    name: 'productIdOptionPrices',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getProductOptionPrices'],
                        },
                    },
                    description: 'ID of the product to retrieve option pricing information for',
                },
                // Product: Get Category Details - Category ID
                {
                    displayName: 'Category ID',
                    name: 'categoryIdDetails',
                    type: 'string',
                    required: true,
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['product'],
                            operation: ['getCategoryDetails'],
                        },
                    },
                    description: 'ID of the category to retrieve detailed information for',
                },
            ],
        };
        this.description = (0, OnPrintShopHelp_1.addOnPrintShopHelp)(this.description);
    }
    async execute() {
        var _a, _b;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('onPrintShopApi');
        const baseUrl = credentials.baseUrl || 'https://api.onprintshop.com';
        const tokenUrl = credentials.tokenUrl || 'https://api.onprintshop.com/oauth/token';
        const clientId = credentials.clientId;
        const clientSecret = credentials.clientSecret;
        // Get OAuth2 access token
        let accessToken;
        try {
            // OnPrintShop exposes a client-credentials token URL instead of n8n-managed auth.
            // eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
            const tokenResponse = await this.helpers.httpRequest({
                method: 'POST',
                url: tokenUrl,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                },
                json: true,
            });
            accessToken = tokenResponse.access_token;
        }
        catch (error) {
            throw new n8n_workflow_1.NodeApiError(this.getNode(), toNodeApiErrorResponse(error), { message: `Failed to get access token: ${getErrorMessage(error)}` });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestGraphql = async (body) => {
            const query = String(body.query || '');
            const variables = (body.variables || {});
            const aliases = { ...OPS_ROOT_FIELD_ALIASES, ...OPS_VARIABLE_ALIASES };
            const preparedQuery = replaceGraphqlTokens(query, aliases);
            const preparedVariables = prepareVariablesForOpsSchema(variables);
            const responseData = await this.helpers.httpRequest({
                method: 'POST',
                url: `${baseUrl}/api/`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: {
                    ...body,
                    query: preparedQuery,
                    variables: preparedVariables,
                },
                json: true,
            });
            return addResponseAliases(responseData);
        };
        const nodeDescription = new OnPrintShop().description;
        for (let i = 0; i < items.length; i++) {
            try {
                let resource = this.getNodeParameter('resource', i);
                let operation = this.getNodeParameter('operation', i);
                if (operation === 'getMany' && ['customer', 'customerAddress', 'order', 'orderDetails', 'orderShipment'].includes(resource))
                    operation = 'getAll';
                if (resource === 'faq' && operation === 'getMany') {
                    resource = 'product';
                    operation = 'getManyFAQs';
                }
                const getFieldSelection = (parameterName, fallback = []) => {
                    const selectedFields = this.getNodeParameter(parameterName, i, fallback);
                    const mode = hasFieldSelectionModeForExecution(nodeDescription, parameterName, resource, operation)
                        ? this.getNodeParameter(`${parameterName}${OnPrintShopHelp_1.ONPRINTSHOP_FIELD_SELECTION_MODE_SUFFIX}`, i, 'custom')
                        : 'custom';
                    return resolveFieldSelection(nodeDescription, parameterName, selectedFields, mode, resource, operation);
                };
                if (resource === 'graphql' && operation === 'execute') {
                    const query = this.getNodeParameter('graphqlQuery', i);
                    const variables = JSON.parse(this.getNodeParameter('graphqlVariables', i) || '{}');
                    const responseData = await requestGraphql({ query: query.trim(), variables });
                    if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    returnData.push(responseData);
                }
                if (resource === 'masterOptionStock') {
                    if (operation === 'getConfigs') {
                        const optionFilter = parseJsonParameter(this.getNodeParameter('masterOptionStock_optionFilter', i), 'masterOptionStock_optionFilter', this.getNode(), i);
                        if (!Array.isArray(optionFilter)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Option Filter must be a JSON array, e.g. [52,59]', { itemIndex: i });
                        }
                        const variables = {
                            limit: this.getNodeParameter('masterOptionStock_limit', i),
                            offset: this.getNodeParameter('masterOptionStock_offset', i),
                        };
                        const configId = this.getNodeParameter('masterOptionStock_configId', i);
                        if (configId)
                            variables.config_id = configId;
                        if (optionFilter.length)
                            variables.optionFilter = optionFilter;
                        const query = `query getMasterOptionStockConfigs($limit: Int, $offset: Int, $config_id: Int, $optionFilter: [Int]) { getMasterOptionStockConfigs(limit: $limit, offset: $offset, config_id: $config_id, optionFilter: $optionFilter) { groups { group_title stock_type stock_type_id option_ids allow_out_of_stock notify_quantity configs { id option_ids attribute_ids stock type credit_stock debit_stock stock_title stock_label } } totalRecords currentCount } }`;
                        const responseData = await requestGraphql({ query, variables });
                        if (responseData && responseData.data && responseData.data.getMasterOptionStockConfigs)
                            returnData.push(responseData.data.getMasterOptionStockConfigs);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'getHistory') {
                        const configId = this.getNodeParameter('masterOptionStock_configId', i);
                        if (!configId)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Config ID is required for master option stock history', { itemIndex: i });
                        const variables = {
                            config_id: configId,
                            limit: this.getNodeParameter('masterOptionStock_limit', i),
                            offset: this.getNodeParameter('masterOptionStock_offset', i),
                        };
                        const query = `query getMasterOptionStockHistory($config_id: Int!, $limit: Int, $offset: Int) { getMasterOptionStockHistory(config_id: $config_id, limit: $limit, offset: $offset) { history { id config_id stock_change change_type comments date_added } totalRecords currentCount } }`;
                        const responseData = await requestGraphql({ query, variables });
                        if (responseData && responseData.data && responseData.data.getMasterOptionStockHistory)
                            returnData.push(responseData.data.getMasterOptionStockHistory);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'getCombinationMatrix') {
                        const optionIds = parseJsonParameter(this.getNodeParameter('masterOptionStock_optionIdsArray', i), 'masterOptionStock_optionIdsArray', this.getNode(), i);
                        if (!Array.isArray(optionIds) || optionIds.length === 0) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Option IDs must be a non-empty JSON array, e.g. [50,52]', { itemIndex: i });
                        }
                        const query = `query getMasterOptionCombinationMatrix($option_ids: [Int!]!) { getMasterOptionCombinationMatrix(option_ids: $option_ids) { matrix { option_ids attribute_ids } totalRecords } }`;
                        const responseData = await requestGraphql({ query, variables: { option_ids: optionIds } });
                        if (responseData && responseData.data && responseData.data.getMasterOptionCombinationMatrix)
                            returnData.push(responseData.data.getMasterOptionCombinationMatrix);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'addConfig') {
                        const input = parseJsonParameter(this.getNodeParameter('masterOptionStock_input', i), 'masterOptionStock_input', this.getNode(), i);
                        const mutation = `mutation addMasterOptionStockConfig($input: AddMasterOptionStockConfigInput!) { addMasterOptionStockConfig(input: $input) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.addMasterOptionStockConfig)
                            returnData.push(responseData.data.addMasterOptionStockConfig);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'deleteConfig') {
                        const variables = {};
                        const configId = this.getNodeParameter('masterOptionStock_configId', i);
                        const optionIds = this.getNodeParameter('masterOptionStock_optionIds', i);
                        if (configId)
                            variables.config_id = configId;
                        if (optionIds)
                            variables.option_ids = optionIds;
                        if (variables.config_id === undefined && variables.option_ids === undefined) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Either Config ID or Option IDs is required to delete a master option stock config', { itemIndex: i });
                        }
                        const mutation = `mutation deleteMasterOptionStockConfig($config_id: Int, $option_ids: String) { deleteMasterOptionStockConfig(config_id: $config_id, option_ids: $option_ids) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.deleteMasterOptionStockConfig)
                            returnData.push(responseData.data.deleteMasterOptionStockConfig);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'updateStock') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('masterOptionStock_inputs', i), 'masterOptionStock_inputs', this.getNode(), i), 'masterOptionStock_inputs', this.getNode(), i);
                        const mutation = `mutation updateMasterOptionStock($inputs: [UpdateMasterOptionStockInput!]!) { updateMasterOptionStock(inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.updateMasterOptionStock)
                            returnData.push(responseData.data.updateMasterOptionStock);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setSettings') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('masterOptionStock_settingsInputs', i), 'masterOptionStock_settingsInputs', this.getNode(), i), 'masterOptionStock_settingsInputs', this.getNode(), i);
                        const mutation = `mutation setMasterOptionStockSettings($inputs: [SetMasterOptionStockSettingsInput!]!) { setMasterOptionStockSettings(inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setMasterOptionStockSettings)
                            returnData.push(responseData.data.setMasterOptionStockSettings);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getSkuMatrix') {
                    const products_id = this.getNodeParameter('productSkuMatrix_products_id', i);
                    const prod_add_opt_ids = this.getNodeParameter('productSkuMatrix_prod_add_opt_ids', i);
                    if (!products_id)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID is required for product SKU matrix', { itemIndex: i });
                    if (!prod_add_opt_ids)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product Additional Option IDs are required for product SKU matrix', { itemIndex: i });
                    const query = `query getProductSkuMatrix ($products_id: Int!, $prod_add_opt_ids: String!) { getProductSkuMatrix (products_id: $products_id, prod_add_opt_ids: $prod_add_opt_ids) { matrix { size_id prod_add_opt_ids attribute_ids } totalRecords } }`;
                    const responseData = await requestGraphql({ query, variables: { products_id, prod_add_opt_ids } });
                    if (responseData && responseData.data && responseData.data.getProductSkuMatrix)
                        returnData.push(responseData.data.getProductSkuMatrix);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if ((resource === 'product' || resource === 'mutation') && operation === 'setProductSku') {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductSku_input', i), 'setProductSku_input', this.getNode(), i), 'setProductSku_input', this.getNode(), i);
                    const mutation = `mutation setProductSku($inputs: [ProductSkuInput!]!) { setProductSku(inputs: $inputs) { index result message id } }`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setProductSku)
                        returnData.push(responseData.data.setProductSku);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                // Legacy workflow compatibility handlers
                if (resource === 'storeMarkup' && operation === 'getAll') {
                    const query = `query get_store_markup($corporate_markup_id: Int, $limit: Int, $offset: Int) { get_store_markup(corporate_markup_id: $corporate_markup_id, limit: $limit, offset: $offset) { store_markup { corporate_markup_id markup_title markup_details status appliedon } totalStoreMarkup } }`;
                    const fields = getFieldSelection('storeMarkupFields', []);
                    const fetchAllPages = this.getNodeParameter('storeMarkupFetchAllPages', i, false);
                    const pageSize = 250;
                    let offset = 0;
                    let hasMore = true;
                    do {
                        const responseData = await requestGraphql({ query, variables: { limit: pageSize, offset } });
                        if (responseData && responseData.data && responseData.data.get_store_markup) {
                            const markups = responseData.data.get_store_markup.store_markup || [];
                            for (const markup of markups) {
                                const item = fields.length ? Object.fromEntries(Object.entries(markup).filter(([key]) => fields.includes(key))) : markup;
                                returnData.push({ ...item, _totalStoreMarkup: responseData.data.get_store_markup.totalStoreMarkup });
                            }
                            hasMore = fetchAllPages && markups.length === pageSize;
                            offset += pageSize;
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            hasMore = false;
                        }
                    } while (hasMore);
                }
                if (resource === 'product' && operation === 'getManyOptionGroups') {
                    const queryParameters = this.getNodeParameter('queryParametersManyOptionGroups', i, {});
                    const variables = {};
                    if (queryParameters.prod_add_opt_group_id)
                        variables.prod_add_opt_group_id = Number(queryParameters.prod_add_opt_group_id);
                    if (queryParameters.use_for)
                        variables.use_for = String(queryParameters.use_for);
                    variables.limit = queryParameters.limit || 50;
                    variables.offset = queryParameters.offset || 0;
                    const query = `query getOptionGroup ($prod_add_opt_group_id: Int,$use_for: String, $limit: Int, $offset: Int) { getOptionGroup (prod_add_opt_group_id: $prod_add_opt_group_id,use_for: $use_for, limit: $limit, offset: $offset) { optionGroup { prod_add_opt_group_id opt_group_name use_for display_style option_count is_collapse sort_order } totalOptionGroup } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getOptionGroup) {
                        for (const group of responseData.data.getOptionGroup.optionGroup || [])
                            returnData.push({ ...group, _totalOptionGroup: responseData.data.getOptionGroup.totalOptionGroup });
                    }
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'product' && operation === 'getManyMasterOptionRanges') {
                    const queryParameters = this.getNodeParameter('queryParametersManyMasterOptionRanges', i, {});
                    const variables = {};
                    if (queryParameters.range_id)
                        variables.range_id = Number(queryParameters.range_id);
                    if (queryParameters.option_id)
                        variables.option_id = Number(queryParameters.option_id);
                    variables.limit = queryParameters.limit || 50;
                    variables.offset = queryParameters.offset || 0;
                    const query = `query getMasterOptionRange ($range_id: Int, $option_id: Int, $limit: Int, $offset: Int) { getMasterOptionRange (range_id: $range_id, option_id: $option_id, limit: $limit, offset: $offset) { masterOptionRange { range_id option_id from_range to_range } totalMasterOptionRange } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionRange) {
                        for (const range of responseData.data.getMasterOptionRange.masterOptionRange || [])
                            returnData.push({ ...range, _totalMasterOptionRange: responseData.data.getMasterOptionRange.totalMasterOptionRange });
                    }
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'product' && operation === 'getManyMasterOptionTags') {
                    const queryParameters = this.getNodeParameter('queryParametersManyMasterOptionTags', i, {});
                    const variables = {};
                    if (queryParameters.master_option_tag_id)
                        variables.master_option_tag_id = Number(queryParameters.master_option_tag_id);
                    variables.limit = queryParameters.limit || 50;
                    variables.offset = queryParameters.offset || 0;
                    const query = `query getMasterOptionTag ($master_option_tag_id: Int, $limit: Int, $offset: Int) { getMasterOptionTag (master_option_tag_id: $master_option_tag_id, limit: $limit, offset: $offset) { masterOptionTag { master_option_tag_id master_option_tag_name } totalMasterOptionTag } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionTag) {
                        for (const tag of responseData.data.getMasterOptionTag.masterOptionTag || [])
                            returnData.push({ ...tag, _totalMasterOptionTag: responseData.data.getMasterOptionTag.totalMasterOptionTag });
                    }
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'orderProducts' && (operation === 'get' || operation === 'getMany')) {
                    const orderProductId = this.getNodeParameter('orderProductId', i, '');
                    const variables = {};
                    if (orderProductId)
                        variables.orders_products_id = Number(orderProductId);
                    variables.limit = 50;
                    variables.offset = 0;
                    const query = `query orders ($orders_products_id: Int, $limit: Int, $offset: Int) { orders (orders_products_id: $orders_products_id, limit: $limit, offset: $offset) { orders { user_id orders_id corporate_id order_status orders_status_id total_amount order_amount product { orders_products_id products_name products_quantity products_price product_status features_details product_size_details products_title products_sku template_type products_vendor_price } } totalOrders } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.orders) {
                        for (const order of responseData.data.orders.orders || [])
                            returnData.push({ ...order, _totalOrders: responseData.data.orders.totalOrders });
                    }
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'orderProducts' && operation === 'setDesign') {
                    const order_product_id = Number(this.getNodeParameter('orderProductIdSetDesign', i));
                    const ziflow_link = this.getNodeParameter('ziflowLink', i, '');
                    const ziflow_preflight_link = this.getNodeParameter('ziflowPreflightLink', i, '');
                    const mutation = `mutation setProductDesign ($order_product_id: Int, $ziflow_link: String, $ziflow_preflight_link: String) { setProductDesign (order_product_id: $order_product_id, ziflow_link: $ziflow_link, ziflow_preflight_link: $ziflow_preflight_link) { result message id } }`;
                    const responseData = await requestGraphql({ query: mutation, variables: { order_product_id, ziflow_link, ziflow_preflight_link } });
                    if (responseData && responseData.data && responseData.data.setProductDesign)
                        returnData.push(responseData.data.setProductDesign);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'orderProducts' && operation === 'updateStatus') {
                    const orders_products_id = Number(this.getNodeParameter('orderProductIdUpdate', i));
                    const order_product_status = this.getNodeParameter('orderProductStatusUpdate', i);
                    const additionalFields = this.getNodeParameter('additionalFieldsProductUpdate', i, {});
                    const input = { order_product_status, comment: additionalFields.comment || '', notify: additionalFields.notify || 0 };
                    const mutation = `mutation updateOrderStatus ($type: OrderStatusUpdateTypeEnum!, $orders_products_id: Int, $input: UpdateOrderStatusInput!) { updateOrderStatus (type: $type, orders_products_id: $orders_products_id, input: $input) { result message id } }`;
                    const responseData = await requestGraphql({ query: mutation, variables: { type: 'product', orders_products_id, input } });
                    if (responseData && responseData.data && responseData.data.updateOrderStatus)
                        returnData.push(responseData.data.updateOrderStatus);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'customerAddress' && operation === 'getAll') {
                    const userId = this.getNodeParameter('userId', i);
                    const addressFieldsSelected = getFieldSelection('addressFieldsCustomer');
                    const addressFields = addressFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const query = `
					query customerAddressDetails ($user_id: Int!) {
						customerAddressDetails (user_id: $user_id) {
							customerAddressDetails {
								${addressFields}
							}
						}
					}
				`;
                    const variables = {
                        user_id: parseInt(String(userId), 10)
                    };
                    const responseData = await requestGraphql({ query: query.trim(), variables });
                    if (responseData && responseData.data && responseData.data.customerAddressDetails) {
                        const addresses = responseData.data.customerAddressDetails.customerAddressDetails || [];
                        if (Array.isArray(addresses)) {
                            returnData.push(...addresses);
                        }
                        else if (addresses) {
                            returnData.push(addresses);
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        returnData.push({ error: 'Unexpected response format from API' });
                    }
                }
                if (resource === 'orderDetails' && operation === 'getAll') {
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const productFieldsSelected = getFieldSelection('productFieldsOrderDetails');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i, false) || false;
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const query = `
						query orders ($orders_id: Int, $orders_products_id: Int, $order_product_status: Int, $store_id: String, $from_date: String, $to_date: String, $order_status: String, $customer_id: Int, $order_type: OrdersOrderTypeEnum, $limit: Int, $offset: Int) {
							orders (orders_id: $orders_id, orders_products_id: $orders_products_id, order_product_status: $order_product_status, store_id: $store_id, from_date: $from_date, to_date: $to_date, order_status: $order_status, customer_id: $customer_id, order_type: $order_type, limit: $limit, offset: $offset) {
								orders {
									product { ${productFields} }
								}
								totalOrders
							}
						}
					`;
                    const allDetails = [];
                    let offset = 0;
                    let hasMorePages = true;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250);
                    let adaptiveDelay = Math.max(queryParameters.pageDelay || 50, 25);
                    if (fetchAllPages) {
                        let pageCount = 0;
                        const maxPages = 100;
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            const variables = { limit: pageSize, offset };
                            const qp = queryParameters || {};
                            if (qp.orders_id !== undefined && qp.orders_id !== '')
                                variables.orders_id = Number(qp.orders_id);
                            if (qp.orders_products_id !== undefined && qp.orders_products_id !== '')
                                variables.orders_products_id = Number(qp.orders_products_id);
                            if (qp.order_product_status !== undefined && qp.order_product_status !== '')
                                variables.order_product_status = Number(qp.order_product_status);
                            if (qp.store_id)
                                variables.store_id = String(qp.store_id);
                            if (qp.from_date)
                                variables.from_date = new Date(String(qp.from_date)).toISOString().split('T')[0];
                            if (qp.to_date)
                                variables.to_date = new Date(String(qp.to_date)).toISOString().split('T')[0];
                            if (qp.order_status)
                                variables.order_status = String(qp.order_status);
                            if (qp.customer_id !== undefined && qp.customer_id !== '')
                                variables.customer_id = Number(qp.customer_id);
                            if (qp.order_type)
                                variables.order_type = qp.order_type;
                            const responseData = await requestGraphql({ query: query.trim(), variables });
                            if (responseData && responseData.data && responseData.data.orders) {
                                const orders = responseData.data.orders.orders || [];
                                for (const o of orders) {
                                    if (o && o.product)
                                        allDetails.push(o.product);
                                }
                                offset += pageSize;
                                pageCount++;
                                hasMorePages = orders.length === pageSize;
                                const responseTime = Date.now() - requestStartTime;
                                if (responseTime < 100)
                                    adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                else if (responseTime > 500)
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 1.25);
                                if (hasMorePages)
                                    await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                            }
                            else if (responseData && responseData.errors) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                            }
                            else {
                                hasMorePages = false;
                            }
                        }
                        returnData.push(...allDetails);
                    }
                    else {
                        const variables = {};
                        const qp = queryParameters || {};
                        if (qp.orders_id !== undefined && qp.orders_id !== '')
                            variables.orders_id = Number(qp.orders_id);
                        if (qp.orders_products_id !== undefined && qp.orders_products_id !== '')
                            variables.orders_products_id = Number(qp.orders_products_id);
                        if (qp.order_product_status !== undefined && qp.order_product_status !== '')
                            variables.order_product_status = Number(qp.order_product_status);
                        if (qp.store_id)
                            variables.store_id = String(qp.store_id);
                        if (qp.from_date)
                            variables.from_date = new Date(String(qp.from_date)).toISOString().split('T')[0];
                        if (qp.to_date)
                            variables.to_date = new Date(String(qp.to_date)).toISOString().split('T')[0];
                        if (qp.order_status)
                            variables.order_status = String(qp.order_status);
                        if (qp.customer_id !== undefined && qp.customer_id !== '')
                            variables.customer_id = Number(qp.customer_id);
                        if (qp.order_type)
                            variables.order_type = qp.order_type;
                        if (qp.limit)
                            variables.limit = qp.limit;
                        if (qp.offset)
                            variables.offset = qp.offset;
                        const responseData = await requestGraphql({ query: query.trim(), variables });
                        if (responseData && responseData.data && responseData.data.orders) {
                            const orders = responseData.data.orders.orders || [];
                            for (const o of orders) {
                                if (o && o.product)
                                    returnData.push(o.product);
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            returnData.push({ error: 'Unexpected response format from API' });
                        }
                    }
                }
                if (resource === 'orderShipment' && operation === 'getAll') {
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const shipmentFieldsSelected = getFieldSelection('shipmentFieldsOrderShipment');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i, false) || false;
                    const shipmentFields = shipmentFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const query = `
						query orders ($orders_id: Int, $from_date: String, $to_date: String, $order_status: String, $customer_id: Int, $order_type: OrdersOrderTypeEnum, $limit: Int, $offset: Int) {
							orders (orders_id: $orders_id, from_date: $from_date, to_date: $to_date, order_status: $order_status, customer_id: $customer_id, order_type: $order_type, limit: $limit, offset: $offset) {
								orders {
									shipment_detail { ${shipmentFields} }
								}
								totalOrders
							}
						}
					`;
                    const allShipments = [];
                    let offset = 0;
                    let hasMorePages = true;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250);
                    let adaptiveDelay = Math.max(queryParameters.pageDelay || 50, 25);
                    if (fetchAllPages) {
                        let pageCount = 0;
                        const maxPages = 100;
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            const variables = { limit: pageSize, offset };
                            const qp = queryParameters || {};
                            if (qp.orders_id !== undefined && qp.orders_id !== '')
                                variables.orders_id = Number(qp.orders_id);
                            if (qp.from_date)
                                variables.from_date = new Date(String(qp.from_date)).toISOString().split('T')[0];
                            if (qp.to_date)
                                variables.to_date = new Date(String(qp.to_date)).toISOString().split('T')[0];
                            if (qp.order_status)
                                variables.order_status = String(qp.order_status);
                            if (qp.customer_id !== undefined && qp.customer_id !== '')
                                variables.customer_id = Number(qp.customer_id);
                            if (qp.order_type)
                                variables.order_type = qp.order_type;
                            const responseData = await requestGraphql({ query: query.trim(), variables });
                            if (responseData && responseData.data && responseData.data.orders) {
                                const orders = responseData.data.orders.orders || [];
                                for (const o of orders) {
                                    if (o && o.shipment_detail)
                                        allShipments.push(o.shipment_detail);
                                }
                                offset += pageSize;
                                pageCount++;
                                hasMorePages = orders.length === pageSize;
                                const responseTime = Date.now() - requestStartTime;
                                if (responseTime < 100)
                                    adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                else if (responseTime > 500)
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 1.25);
                                if (hasMorePages)
                                    await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                            }
                            else if (responseData && responseData.errors) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                            }
                            else {
                                hasMorePages = false;
                            }
                        }
                        returnData.push(...allShipments);
                    }
                    else {
                        const variables = {};
                        const qp = queryParameters || {};
                        if (qp.orders_id !== undefined && qp.orders_id !== '')
                            variables.orders_id = Number(qp.orders_id);
                        if (qp.from_date)
                            variables.from_date = new Date(String(qp.from_date)).toISOString().split('T')[0];
                        if (qp.to_date)
                            variables.to_date = new Date(String(qp.to_date)).toISOString().split('T')[0];
                        if (qp.order_status)
                            variables.order_status = String(qp.order_status);
                        if (qp.customer_id !== undefined && qp.customer_id !== '')
                            variables.customer_id = Number(qp.customer_id);
                        if (qp.order_type)
                            variables.order_type = qp.order_type;
                        if (qp.limit)
                            variables.limit = qp.limit;
                        if (qp.offset)
                            variables.offset = qp.offset;
                        const responseData = await requestGraphql({ query: query.trim(), variables });
                        if (responseData && responseData.data && responseData.data.orders) {
                            const orders = responseData.data.orders.orders || [];
                            for (const o of orders) {
                                if (o && o.shipment_detail)
                                    returnData.push(o.shipment_detail);
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            returnData.push({ error: 'Unexpected response format from API' });
                        }
                    }
                }
                if (resource === 'shipToMultipleAddress' && operation === 'getAll') {
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const stmFieldsSelected = getFieldSelection('stmFields');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i, false) || false;
                    const stmFields = stmFieldsSelected.filter(f => !f.startsWith('SELECT_') && f !== 'DESELECT_ALL' && f !== 'SEPARATOR').join('\n\t\t\t\t\t\t\t');
                    const query = `
						query orders ($orders_id: Int, $limit: Int, $offset: Int) {
							orders (orders_id: $orders_id, limit: $limit, offset: $offset) {
								orders { ship_to_multiple_detail { ${stmFields} } }
								totalOrders
							}
						}
					`;
                    const results = [];
                    let offset = 0;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250);
                    let adaptiveDelay = Math.max(queryParameters.pageDelay || 50, 25);
                    let hasMorePages = true;
                    let pageCount = 0;
                    const maxPages = 100;
                    if (fetchAllPages) {
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            const variables = { limit: pageSize, offset };
                            if (queryParameters.orders_id)
                                variables.orders_id = Number(queryParameters.orders_id);
                            const responseData = await requestGraphql({ query: query.trim(), variables });
                            if (responseData && responseData.data && responseData.data.orders) {
                                const orders = responseData.data.orders.orders || [];
                                for (const o of orders) {
                                    if (o && o.ship_to_multiple_detail)
                                        results.push(o.ship_to_multiple_detail);
                                }
                                offset += pageSize;
                                pageCount++;
                                hasMorePages = orders.length === pageSize;
                                const responseTime = Date.now() - requestStartTime;
                                if (responseTime < 100)
                                    adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                else if (responseTime > 500)
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 1.25);
                                if (hasMorePages)
                                    await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                            }
                            else if (responseData && responseData.errors) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                            }
                            else {
                                hasMorePages = false;
                            }
                        }
                        returnData.push(...results);
                    }
                    else {
                        const variables = {};
                        if (queryParameters.orders_id)
                            variables.orders_id = Number(queryParameters.orders_id);
                        if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                        const responseData = await requestGraphql({ query: query.trim(), variables });
                        if (responseData && responseData.data && responseData.data.orders) {
                            const orders = responseData.data.orders.orders || [];
                            for (const o of orders) {
                                if (o && o.ship_to_multiple_detail)
                                    returnData.push(o.ship_to_multiple_detail);
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            returnData.push({ error: 'Unexpected response format from API' });
                        }
                    }
                }
                if (resource === 'productStocks' && operation === 'getAll') {
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const stockFieldsSelected = getFieldSelection('stockFields');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i, false) || false;
                    const stockFields = stockFieldsSelected.filter(f => !f.startsWith('SELECT_') && f !== 'DESELECT_ALL' && f !== 'SEPARATOR').join('\n\t\t\t\t\t\t\t');
                    const query = `
						query products ($product_id: Int, $products_sku: String, $limit: Int, $offset: Int) {
							products (product_id: $product_id, products_sku: $products_sku, limit: $limit, offset: $offset) {
								products { stock_detail { ${stockFields} } }
								totalProducts
							}
						}
					`;
                    const results = [];
                    let offset = 0;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250);
                    let adaptiveDelay = Math.max(queryParameters.pageDelay || 50, 25);
                    let hasMorePages = true;
                    let pageCount = 0;
                    const maxPages = 100;
                    if (fetchAllPages) {
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            const variables = { limit: pageSize, offset };
                            const qp = queryParameters || {};
                            if (qp.product_id)
                                variables.product_id = Number(qp.product_id);
                            if (qp.products_sku)
                                variables.products_sku = String(qp.products_sku);
                            const responseData = await requestGraphql({ query: query.trim(), variables });
                            if (responseData && responseData.data && responseData.data.products) {
                                const products = responseData.data.products.products || [];
                                for (const p of products) {
                                    if (p && p.stock_detail)
                                        results.push(p.stock_detail);
                                }
                                offset += pageSize;
                                pageCount++;
                                hasMorePages = products.length === pageSize;
                                const responseTime = Date.now() - requestStartTime;
                                if (responseTime < 100)
                                    adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                else if (responseTime > 500)
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 1.25);
                                if (hasMorePages)
                                    await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                            }
                            else if (responseData && responseData.errors) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                            }
                            else {
                                hasMorePages = false;
                            }
                        }
                        returnData.push(...results);
                    }
                    else {
                        const variables = {};
                        if (queryParameters.product_id)
                            variables.product_id = Number(queryParameters.product_id);
                        if (queryParameters.products_sku)
                            variables.products_sku = String(queryParameters.products_sku);
                        if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                        const responseData = await requestGraphql({ query: query.trim(), variables });
                        if (responseData && responseData.data && responseData.data.products) {
                            const products = responseData.data.products.products || [];
                            for (const p of products) {
                                if (p && p.stock_detail)
                                    returnData.push(p.stock_detail);
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            returnData.push({ error: 'Unexpected response format from API' });
                        }
                    }
                }
                if (resource === 'status') {
                    const statusFieldsSelected = getFieldSelection('statusFields');
                    const statusFields = statusFieldsSelected.filter(f => !f.startsWith('SELECT_') && f !== 'DESELECT_ALL' && f !== 'SEPARATOR').join('\n\t\t\t\t\t\t\t');
                    if (operation === 'orderStatus') {
                        const query = `query orderStatus { orderStatus { ${statusFields} } }`;
                        const responseData = await requestGraphql({ query });
                        if (responseData && responseData.data && responseData.data.orderStatus)
                            returnData.push(...responseData.data.orderStatus);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'orderProductStatus') {
                        const query = `query orderProductStatus { orderProductStatus { ${statusFields} } }`;
                        const responseData = await requestGraphql({ query });
                        if (responseData && responseData.data && responseData.data.orderProductStatus)
                            returnData.push(...responseData.data.orderProductStatus);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'batch' && operation === 'getAll') {
                    const variables = {};
                    const batchId = this.getNodeParameter('batch_batchId', i);
                    const search = this.getNodeParameter('batch_search', i);
                    const limit = this.getNodeParameter('batch_limit', i);
                    const offset = this.getNodeParameter('batch_offset', i);
                    if (batchId)
                        variables.batch_id = batchId;
                    if (search)
                        variables.search = search;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query getBatch ($batch_id: Int, $search: String, $limit: Int, $offset: Int) { getBatch (batch_id: $batch_id, search: $search, limit: $limit, offset: $offset) { batchDetails { id batch_name nesting_size nest_width nest_height print_count print_instructions finishing_instructions front_print_filename front_cut_filename front_image_link rear_print_filename rear_cut_filename rear_image_link jobs } totalBatchDetails } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getBatch) {
                        const batches = responseData.data.getBatch.batchDetails || [];
                        for (const b of batches) {
                            returnData.push({ ...b, _totalBatchDetails: responseData.data.getBatch.totalBatchDetails });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'quote' && operation === 'getAll') {
                    const variables = {};
                    const quoteId = this.getNodeParameter('quote_quoteId', i);
                    const userId = this.getNodeParameter('quote_userId', i);
                    const limit = this.getNodeParameter('quote_limit', i);
                    const offset = this.getNodeParameter('quote_offset', i);
                    if (quoteId)
                        variables.quote_id = quoteId;
                    if (userId)
                        variables.user_id = userId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_quote ($quote_id: Int, $user_id: Int, $limit: Int, $offset: Int) { get_quote (quote_id: $quote_id, user_id: $user_id, limit: $limit, offset: $offset) { quote { quote_id user_id quote_title quote_price quote_vendor_price sort_order quote_status quote_date admin_notes quote_shipping_addr quote_billing_addr ship_amt quote_tax_exampt quoteproduct { isCustomProduct quote_products_id quote_id products_id products_title quote_products_quantity quote_products_price quote_products_vendor_price quote_products_info products_prd_day products_weight quote_product_sku quote_product_notes } } totalQuote } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_quote) {
                        const quotes = responseData.data.get_quote.quote || [];
                        for (const q of quotes) {
                            returnData.push({ ...q, _totalQuote: responseData.data.get_quote.totalQuote });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'quoteProduct' && operation === 'getAll') {
                    const variables = {};
                    const quoteId = this.getNodeParameter('quoteProduct_quoteId', i);
                    const quoteProductsId = this.getNodeParameter('quoteProduct_quoteProductsId', i);
                    const limit = this.getNodeParameter('quoteProduct_limit', i);
                    const offset = this.getNodeParameter('quoteProduct_offset', i);
                    if (quoteId)
                        variables.quote_id = quoteId;
                    if (quoteProductsId)
                        variables.quote_products_id = quoteProductsId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query quoteproduct ($quote_id: Int, $quote_products_id: Int, $limit: Int, $offset: Int) { quoteproduct (quote_id: $quote_id, quote_products_id: $quote_products_id, limit: $limit, offset: $offset) { quoteproduct { isCustomProduct quote_products_id quote_id products_id products_title quote_products_quantity quote_products_price quote_products_vendor_price quote_products_info products_prd_day products_weight quote_product_sku quote_product_notes } totalQuoteProduct } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.quoteproduct) {
                        const products = responseData.data.quoteproduct.quoteproduct || [];
                        for (const p of products) {
                            returnData.push({ ...p, _totalQuoteProduct: responseData.data.quoteproduct.totalQuoteProduct });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'store' && operation === 'getAll') {
                    const variables = {};
                    const corporateId = this.getNodeParameter('store_corporateId', i);
                    const email = this.getNodeParameter('store_email', i);
                    const status = this.getNodeParameter('store_status', i);
                    const limit = this.getNodeParameter('store_limit', i);
                    const offset = this.getNodeParameter('store_offset', i);
                    if (corporateId)
                        variables.corporate_id = corporateId;
                    if (email)
                        variables.email = email;
                    if (status)
                        variables.status = status;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_store ($corporate_id: Int, $email: String, $status: Int, $limit: Int, $offset: Int) { get_store (corporate_id: $corporate_id, email: $email, status: $status, limit: $limit, offset: $offset) { store { corporate_id email username corporate_name phone_number status tax_exempt tax_exempt_type order_approval price_visible price_text department_module_enable fix_billing_address fix_shipping_address manage_email_notification main_url created_on modified_on url_type parent_corporate_id manage_private_store markup_type flat_markup corporate_markup_id unassigned_products production_days display_in_company_list department { department_id name email_to status cost_center_code production_days created_on modified_on } } totalStore } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_store) {
                        const stores = responseData.data.get_store.store || [];
                        for (const s of stores) {
                            returnData.push({ ...s, _totalStore: responseData.data.get_store.totalStore });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'department' && operation === 'getAll') {
                    const variables = {};
                    const departmentId = this.getNodeParameter('department_departmentId', i);
                    const corporateId = this.getNodeParameter('department_corporateId', i);
                    const limit = this.getNodeParameter('department_limit', i);
                    const offset = this.getNodeParameter('department_offset', i);
                    if (departmentId)
                        variables.department_id = departmentId;
                    if (corporateId)
                        variables.corporate_id = corporateId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_departments ($department_id: Int, $corporate_id: Int, $limit: Int, $offset: Int) { get_departments (department_id: $department_id, corporate_id: $corporate_id, limit: $limit, offset: $offset) { departments { department_id corporate_id name email_to status cost_center_code production_days created_on modified_on } totalDepartments } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_departments) {
                        const departments = responseData.data.get_departments.departments || [];
                        for (const d of departments) {
                            returnData.push({ ...d, _totalDepartments: responseData.data.get_departments.totalDepartments });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'countries' && operation === 'getAll') {
                    const variables = {};
                    const countriesId = this.getNodeParameter('countries_countriesId', i);
                    const status = this.getNodeParameter('countries_status', i);
                    const limit = this.getNodeParameter('countries_limit', i);
                    const offset = this.getNodeParameter('countries_offset', i);
                    if (countriesId)
                        variables.countries_id = countriesId;
                    if (status)
                        variables.status = status;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_countries ($countries_id: Int, $status: Int, $limit: Int, $offset: Int) { get_countries (countries_id: $countries_id, status: $status, limit: $limit, offset: $offset) { countries { countries_id countries_name countries_iso_code_2 countries_iso_code_3 status } totalCountries } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_countries) {
                        const countries = responseData.data.get_countries.countries || [];
                        for (const c of countries) {
                            returnData.push({ ...c, _totalCountries: responseData.data.get_countries.totalCountries });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'faqCategory' && operation === 'getAll') {
                    const variables = {};
                    const faqcatId = this.getNodeParameter('faqCategory_faqcatId', i);
                    const status = this.getNodeParameter('faqCategory_status', i);
                    const limit = this.getNodeParameter('faqCategory_limit', i);
                    const offset = this.getNodeParameter('faqCategory_offset', i);
                    if (faqcatId)
                        variables.faqcat_id = faqcatId;
                    if (status)
                        variables.status = status;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_faq_category ($faqcat_id: Int, $status: Int, $limit: Int, $offset: Int) { get_faq_category (faqcat_id: $faqcat_id, status: $status, limit: $limit, offset: $offset) { faq_category { faqcat_id faqcat_name status sort_order } totalFaqCategory } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_faq_category) {
                        const categories = responseData.data.get_faq_category.faq_category || [];
                        for (const c of categories) {
                            returnData.push({ ...c, _totalFaqCategory: responseData.data.get_faq_category.totalFaqCategory });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'markupMaster' && operation === 'getAll') {
                    const variables = {};
                    const corporateMarkupId = this.getNodeParameter('markupMaster_corporateMarkupId', i);
                    const limit = this.getNodeParameter('markupMaster_limit', i);
                    const offset = this.getNodeParameter('markupMaster_offset', i);
                    if (corporateMarkupId)
                        variables.corporate_markup_id = corporateMarkupId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_store_markup ($corporate_markup_id: Int, $limit: Int, $offset: Int) { get_store_markup (corporate_markup_id: $corporate_markup_id, limit: $limit, offset: $offset) { storeMarkup { corporate_markup_id markup_title markup_percentage status } totalStoreMarkup } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_store_markup) {
                        const markups = responseData.data.get_store_markup.storeMarkup || [];
                        for (const m of markups) {
                            returnData.push({ ...m, _totalStoreMarkup: responseData.data.get_store_markup.totalStoreMarkup });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'masterOptionRanges' && operation === 'getAll') {
                    const variables = {};
                    const rangeId = this.getNodeParameter('masterOptionRanges_rangeId', i);
                    const optionId = this.getNodeParameter('masterOptionRanges_optionId', i);
                    const limit = this.getNodeParameter('masterOptionRanges_limit', i);
                    const offset = this.getNodeParameter('masterOptionRanges_offset', i);
                    if (rangeId)
                        variables.range_id = rangeId;
                    if (optionId)
                        variables.option_id = optionId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query getMasterOptionRange ($range_id: Int, $option_id: Int, $limit: Int, $offset: Int) { getMasterOptionRange (range_id: $range_id, option_id: $option_id, limit: $limit, offset: $offset) { masterOptionRange { range_id option_id range_from range_to } totalMasterOptionRange } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionRange) {
                        const ranges = responseData.data.getMasterOptionRange.masterOptionRange || [];
                        for (const r of ranges) {
                            returnData.push({ ...r, _totalMasterOptionRange: responseData.data.getMasterOptionRange.totalMasterOptionRange });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'masterOptionTag' && operation === 'getAll') {
                    const variables = {};
                    const tagId = this.getNodeParameter('masterOptionTag_tagId', i);
                    const limit = this.getNodeParameter('masterOptionTag_limit', i);
                    const offset = this.getNodeParameter('masterOptionTag_offset', i);
                    if (tagId)
                        variables.master_option_tag_id = tagId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query getMasterOptionTag ($master_option_tag_id: Int, $limit: Int, $offset: Int) { getMasterOptionTag (master_option_tag_id: $master_option_tag_id, limit: $limit, offset: $offset) { masterOptionTag { master_option_tag_id tag_name } totalMasterOptionTag } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionTag) {
                        const tags = responseData.data.getMasterOptionTag.masterOptionTag || [];
                        for (const t of tags) {
                            returnData.push({ ...t, _totalMasterOptionTag: responseData.data.getMasterOptionTag.totalMasterOptionTag });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'optionFormulas' && operation === 'getAll') {
                    const variables = {};
                    const formulaId = this.getNodeParameter('optionFormulas_formulaId', i);
                    const limit = this.getNodeParameter('optionFormulas_limit', i);
                    const offset = this.getNodeParameter('optionFormulas_offset', i);
                    if (formulaId)
                        variables.formula_id = formulaId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query getCustomFormula ($formula_id: Int, $limit: Int, $offset: Int) { getCustomFormula (formula_id: $formula_id, limit: $limit, offset: $offset) { customFormula { formula_id formula_name formula_expression } totalCustomFormula } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getCustomFormula) {
                        const formulas = responseData.data.getCustomFormula.customFormula || [];
                        for (const f of formulas) {
                            returnData.push({ ...f, _totalCustomFormula: responseData.data.getCustomFormula.totalCustomFormula });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'optionGroup' && operation === 'getAll') {
                    const variables = {};
                    const groupId = this.getNodeParameter('optionGroup_groupId', i);
                    const useFor = this.getNodeParameter('optionGroup_useFor', i);
                    const limit = this.getNodeParameter('optionGroup_limit', i);
                    const offset = this.getNodeParameter('optionGroup_offset', i);
                    if (groupId)
                        variables.prod_add_opt_group_id = groupId;
                    if (useFor)
                        variables.use_for = useFor;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query getOptionGroup ($prod_add_opt_group_id: Int, $use_for: String, $limit: Int, $offset: Int) { getOptionGroup (prod_add_opt_group_id: $prod_add_opt_group_id, use_for: $use_for, limit: $limit, offset: $offset) { optionGroup { prod_add_opt_group_id group_name use_for } totalOptionGroup } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.getOptionGroup) {
                        const groups = responseData.data.getOptionGroup.optionGroup || [];
                        for (const g of groups) {
                            returnData.push({ ...g, _totalOptionGroup: responseData.data.getOptionGroup.totalOptionGroup });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'paymentTerms' && operation === 'getAll') {
                    const variables = {};
                    const termId = this.getNodeParameter('paymentTerms_termId', i);
                    const limit = this.getNodeParameter('paymentTerms_limit', i);
                    const offset = this.getNodeParameter('paymentTerms_offset', i);
                    if (termId)
                        variables.term_id = termId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query get_payment_term_master ($term_id: Int, $limit: Int, $offset: Int) { get_payment_term_master (term_id: $term_id, limit: $limit, offset: $offset) { paymentTermMaster { term_id term_name term_days status } totalPaymentTermMaster } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.get_payment_term_master) {
                        const terms = responseData.data.get_payment_term_master.paymentTermMaster || [];
                        for (const t of terms) {
                            returnData.push({ ...t, _totalPaymentTermMaster: responseData.data.get_payment_term_master.totalPaymentTermMaster });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'storeAddress' && operation === 'getAll') {
                    const variables = {};
                    const corporateId = this.getNodeParameter('storeAddress_corporateId', i);
                    const corporateAddressId = this.getNodeParameter('storeAddress_corporateAddressId', i);
                    const limit = this.getNodeParameter('storeAddress_limit', i);
                    const offset = this.getNodeParameter('storeAddress_offset', i);
                    if (corporateId)
                        variables.corporate_id = corporateId;
                    if (corporateAddressId)
                        variables.corporate_address_id = corporateAddressId;
                    if (limit)
                        variables.limit = limit;
                    if (offset)
                        variables.offset = offset;
                    const query = `query storeaddress ($corporate_id: Int, $corporate_address_id: Int, $limit: Int, $offset: Int) { storeaddress (corporate_id: $corporate_id, corporate_address_id: $corporate_address_id, limit: $limit, offset: $offset) { storeAddress { corporate_address_id corporate_id address_name company street_address city state postcode country telephone is_default } totalStoreAddress } }`;
                    const responseData = await requestGraphql({ query, variables });
                    if (responseData && responseData.data && responseData.data.storeaddress) {
                        const addresses = responseData.data.storeaddress.storeAddress || [];
                        for (const a of addresses) {
                            returnData.push({ ...a, _totalStoreAddress: responseData.data.storeaddress.totalStoreAddress });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                if (resource === 'mutation') {
                    if (operation === 'updateOrderStatus') {
                        const type = this.getNodeParameter('statusUpdateType', i);
                        const variables = {
                            type,
                            input: JSON.parse(this.getNodeParameter('updateOrderStatusInput', i)),
                        };
                        if (type === 'order') {
                            const orders_id = this.getNodeParameter('orders_id', i);
                            if (orders_id)
                                variables.orders_id = orders_id;
                        }
                        else {
                            const orders_products_id = this.getNodeParameter('orders_products_id', i);
                            if (orders_products_id)
                                variables.orders_products_id = orders_products_id;
                        }
                        const mutation = `mutation updateOrderStatus ($type: OrderStatusUpdateTypeEnum!, $orders_id: Int, $orders_products_id: Int, $input: UpdateOrderStatusInput!) { updateOrderStatus (type: $type, orders_id: $orders_id, orders_products_id: $orders_products_id, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.updateOrderStatus)
                            returnData.push(responseData.data.updateOrderStatus);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setOrderProduct') {
                        const order_product_id = this.getNodeParameter('setOrderProduct_order_product_id', i);
                        const width = this.getNodeParameter('setOrderProduct_width', i);
                        const height = this.getNodeParameter('setOrderProduct_height', i);
                        const input = JSON.parse(this.getNodeParameter('setOrderProduct_input', i));
                        const variables = { input };
                        if (order_product_id)
                            variables.order_product_id = order_product_id;
                        if (width)
                            variables.width = width;
                        if (height)
                            variables.height = height;
                        const mutation = `mutation setOrderProduct ($order_product_id: Int, $width: Float, $height: Float, $input: SetOrderProductInput!) { setOrderProduct (order_product_id: $order_product_id, width: $width, height: $height, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setOrderProduct)
                            returnData.push(responseData.data.setOrderProduct);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setBatch') {
                        const batch_id = this.getNodeParameter('setBatch_batch_id', i);
                        const input = JSON.parse(this.getNodeParameter('setBatch_input', i));
                        const variables = { batch_id, input };
                        const mutation = `mutation setBatch ($batch_id: Int, $input: SetBatchMasterInput!) { setBatch (batch_id: $batch_id, input: $input) { result message id batch_link batch_pdf_link } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setBatch)
                            returnData.push(addLegacyBatchIdAlias(responseData.data.setBatch));
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProduct') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProduct_input', i), 'setProduct_input', this.getNode(), i), 'setProduct_input', this.getNode(), i);
                        const mutation = `mutation setProduct ($inputs: [ProductInput!]!) { setProduct (inputs: $inputs) { index result message id external_ref sizes_result { index result message id } pages_result { index result message id } } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProduct)
                            returnData.push(responseData.data.setProduct);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductPrice') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductPrice_input', i), 'setProductPrice_input', this.getNode(), i), 'setProductPrice_input', this.getNode(), i);
                        const mutation = `mutation setProductPrice ($inputs: [ProductPriceInput!]!) { setProductPrice (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProductPrice)
                            returnData.push(responseData.data.setProductPrice);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setQuote') {
                        const userid = this.getNodeParameter('setQuote_userid', i);
                        const quote_id = this.getNodeParameter('setQuote_quote_id', i);
                        const quote_title = this.getNodeParameter('setQuote_quote_title', i);
                        const selectedShippingType = this.getNodeParameter('setQuote_selectedShippingType', i);
                        const input = JSON.parse(this.getNodeParameter('setQuote_input', i));
                        const variables = { userid, quote_title, input };
                        if (quote_id)
                            variables.quote_id = quote_id;
                        if (selectedShippingType)
                            variables.selectedShippingType = selectedShippingType;
                        const mutation = `mutation setQuote ($userid: Int!, $quote_id: Int, $selectedShippingType: String, $quote_title: String!, $input: SetQuoteInput!) { setQuote (userid: $userid, quote_title: $quote_title, selectedShippingType: $selectedShippingType, quote_id: $quote_id, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setQuote)
                            returnData.push(responseData.data.setQuote);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductDesign') {
                        const order_product_id = this.getNodeParameter('setProductDesign_order_product_id', i);
                        const ziflow_link = this.getNodeParameter('setProductDesign_ziflow_link', i);
                        const ziflow_preflight_link = this.getNodeParameter('setProductDesign_ziflow_preflight_link', i);
                        const variables = {};
                        if (order_product_id)
                            variables.order_product_id = order_product_id;
                        if (ziflow_link)
                            variables.ziflow_link = ziflow_link;
                        if (ziflow_preflight_link)
                            variables.ziflow_preflight_link = ziflow_preflight_link;
                        const mutation = `mutation setProductDesign ($order_product_id: Int, $ziflow_link: String, $ziflow_preflight_link: String) { setProductDesign (order_product_id: $order_product_id, ziflow_link: $ziflow_link, ziflow_preflight_link: $ziflow_preflight_link) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setProductDesign)
                            returnData.push(responseData.data.setProductDesign);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductImage') {
                        const products_id = this.getNodeParameter('setProductImage_products_id', i);
                        const optimizeimg = this.getNodeParameter('setProductImage_optimizeimg', i);
                        const input = JSON.parse(this.getNodeParameter('setProductImage_input', i));
                        const variables = { products_id, optimizeimg, input };
                        const mutation = `mutation setProductsImageGallery ($products_id: Int!, $optimizeimg: Int, $input: ProductsImageGalleryBulkInput!) { setProductsImageGallery (products_id: $products_id, optimizeimg: $optimizeimg, input: $input) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setProductsImageGallery)
                            returnData.push(responseData.data.setProductsImageGallery);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'updateOrderProductImages') {
                        const order_product_id = this.getNodeParameter('updateOrderProductImages_order_product_id', i);
                        const input = JSON.parse(this.getNodeParameter('updateOrderProductImages_input', i));
                        const variables = { input };
                        if (order_product_id)
                            variables.order_product_id = order_product_id;
                        const mutation = `mutation setOrderProductImage ($order_product_id: Int, $input: SetOrderProductImageInput!) { setOrderProductImage (order_product_id: $order_product_id, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setOrderProductImage)
                            returnData.push(responseData.data.setOrderProductImage);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'addProofVersion') {
                        const order_product_id = this.getNodeParameter('addProofVersion_order_product_id', i);
                        const add_version_file_only = this.getNodeParameter('addProofVersion_add_version_file_only', i);
                        const ask_for_approval = this.getNodeParameter('addProofVersion_ask_for_approval', i);
                        const input = JSON.parse(this.getNodeParameter('addProofVersion_input', i));
                        const variables = { update_ziflow_link_only: 0, add_version_file_only, ask_for_approval, input };
                        if (order_product_id)
                            variables.order_product_id = order_product_id;
                        const mutation = `mutation setOrderProductImage ($order_product_id: Int, $update_ziflow_link_only: Int, $add_version_file_only: Int, $ask_for_approval: Int, $input: SetOrderProductImageInput!) { setOrderProductImage (order_product_id: $order_product_id, update_ziflow_link_only: $update_ziflow_link_only, add_version_file_only: $add_version_file_only, ask_for_approval: $ask_for_approval, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setOrderProductImage)
                            returnData.push(responseData.data.setOrderProductImage);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'updateZiflowLinkImages') {
                        const order_product_id = this.getNodeParameter('updateZiflowLinkImages_order_product_id', i);
                        const input = JSON.parse(this.getNodeParameter('updateZiflowLinkImages_input', i));
                        const variables = { update_ziflow_link_only: 1, input };
                        if (order_product_id)
                            variables.order_product_id = order_product_id;
                        const mutation = `mutation setOrderProductImage ($order_product_id: Int, $update_ziflow_link_only: Int, $input: SetOrderProductImageInput!) { setOrderProductImage (order_product_id: $order_product_id, update_ziflow_link_only: $update_ziflow_link_only, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setOrderProductImage)
                            returnData.push(responseData.data.setOrderProductImage);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setShipment') {
                        const order_id = this.getNodeParameter('setShipment_order_id', i);
                        const shipment_id = this.getNodeParameter('setShipment_shipment_id', i);
                        const tracking_number = this.getNodeParameter('setShipment_tracking_number', i);
                        const shipmentinfo = JSON.parse(this.getNodeParameter('setShipment_shipmentinfo', i));
                        const variables = { order_id, shipmentinfo };
                        if (shipment_id)
                            variables.shipment_id = shipment_id;
                        if (tracking_number)
                            variables.tracking_number = tracking_number;
                        const mutation = `mutation setShipment ($order_id: Int, $shipment_id: Int, $tracking_number: String, $shipmentinfo: JSON) { setShipment (order_id: $order_id, shipment_id: $shipment_id, tracking_number: $tracking_number, shipmentinfo: $shipmentinfo) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setShipment)
                            returnData.push(responseData.data.setShipment);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMasterOptionRules' || operation === 'setProductOptionRules') {
                        const inputParameterName = operation === 'setProductOptionRules' ? 'setProductOptionRules_input' : 'setMasterOptionRules_input';
                        const input = JSON.parse(this.getNodeParameter(inputParameterName, i));
                        const mutation = `mutation setProductOptionRules ($input: ProductOptionRulesInput!) { setProductOptionRules (input: $input) { result message rule_id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setProductOptionRules)
                            returnData.push(responseData.data.setProductOptionRules);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setOptionFormulas') {
                        const input = JSON.parse(this.getNodeParameter('setOptionFormulas_input', i));
                        const mutation = `mutation setCustomFormula ($input: CustomFormulaInput!) { setCustomFormula (input: $input) { result message } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setCustomFormula)
                            returnData.push(responseData.data.setCustomFormula);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setOptionGroup') {
                        const input = JSON.parse(this.getNodeParameter('setOptionGroup_input', i));
                        const mutation = `mutation setOptionGroup ($input: OptionGroupInput!) { setOptionGroup (input: $input) { result message } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setOptionGroup)
                            returnData.push(responseData.data.setOptionGroup);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMasterOptionTags') {
                        const input = JSON.parse(this.getNodeParameter('setMasterOptionTags_input', i));
                        const mutation = `mutation setMasterOptionTag ($input: MasterOptionTagInput!) { setMasterOptionTag (input: $input) { result message } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setMasterOptionTag)
                            returnData.push(responseData.data.setMasterOptionTag);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMasterOptionAttributes') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setMasterOptionAttributes_input', i), 'setMasterOptionAttributes_input', this.getNode(), i), 'setMasterOptionAttributes_input', this.getNode(), i);
                        const mutation = `mutation setMasterOptionAttributes ($inputs: [MasterOptionAttributesInput!]!) { setMasterOptionAttributes (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setMasterOptionAttributes)
                            returnData.push(responseData.data.setMasterOptionAttributes);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMasterOptionAttributePrice') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setMasterOptionAttributePrice_input', i), 'setMasterOptionAttributePrice_input', this.getNode(), i), 'setMasterOptionAttributePrice_input', this.getNode(), i);
                        const mutation = `mutation setMasterOptionAttributePrice ($inputs: [MasterOptionAttributePriceInput!]!) { setMasterOptionAttributePrice (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setMasterOptionAttributePrice)
                            returnData.push(responseData.data.setMasterOptionAttributePrice);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMasterOption') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setMasterOption_input', i), 'setMasterOption_input', this.getNode(), i), 'setMasterOption_input', this.getNode(), i);
                        const mutation = `mutation setMasterOption ($inputs: [MasterOptionInput!]!) { setMasterOption (inputs: $inputs) { index result message id external_ref } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setMasterOption)
                            returnData.push(responseData.data.setMasterOption);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'assignOptions') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('assignOptions_input', i), 'assignOptions_input', this.getNode(), i), 'assignOptions_input', this.getNode(), i);
                        const mutation = `mutation setAssignOptions ($inputs: [AssignOptionsInput!]!) { setAssignOptions (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setAssignOptions)
                            returnData.push(responseData.data.setAssignOptions);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductSize') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductSize_input', i), 'setProductSize_input', this.getNode(), i), 'setProductSize_input', this.getNode(), i);
                        const mutation = `mutation setProductSize ($inputs: [ProductSizeInput!]!) { setProductSize (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProductSize)
                            returnData.push(responseData.data.setProductSize);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductPages') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductPages_input', i), 'setProductPages_input', this.getNode(), i), 'setProductPages_input', this.getNode(), i);
                        const mutation = `mutation setProductPages ($inputs: [ProductPagesInput!]!) { setProductPages (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProductPages)
                            returnData.push(responseData.data.setProductPages);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setStoreAddress') {
                        const input = JSON.parse(this.getNodeParameter('setStoreAddress_input', i));
                        const mutation = `mutation setStoreAddress ($input: StoreAddressInput!) { setStoreAddress (input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setStoreAddress)
                            returnData.push(responseData.data.setStoreAddress);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setDepartment') {
                        const input = JSON.parse(this.getNodeParameter('setDepartment_input', i));
                        const mutation = `mutation setDepartment ($input: DepartmentInput!) { setDepartment (input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setDepartment)
                            returnData.push(responseData.data.setDepartment);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setStore') {
                        const input = JSON.parse(this.getNodeParameter('setStore_input', i));
                        const mutation = `mutation setStore ($input: StoreInput!) { setStore (input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setStore)
                            returnData.push(responseData.data.setStore);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setMarkupMaster' || operation === 'setStoreMarkup') {
                        const inputParameterName = operation === 'setStoreMarkup' ? 'setStoreMarkup_input' : 'setMarkupMaster_input';
                        const input = JSON.parse(this.getNodeParameter(inputParameterName, i));
                        const mutation = `mutation setStoreMarkup ($input: StoreMarkupInput!) { setStoreMarkup (input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setStoreMarkup)
                            returnData.push(responseData.data.setStoreMarkup);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductCategory') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductCategory_input', i), 'setProductCategory_input', this.getNode(), i), 'setProductCategory_input', this.getNode(), i);
                        const mutation = `mutation setProductCategory ($inputs: [ProductCategoryInput!]!) { setProductCategory (inputs: $inputs) { index result message id external_ref } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProductCategory)
                            returnData.push(responseData.data.setProductCategory);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setFaqCategory') {
                        const input = JSON.parse(this.getNodeParameter('setFaqCategory_input', i));
                        const mutation = `mutation setFaqCategory ($input: FaqCategoryInput!) { setFaqCategory (input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { input } });
                        if (responseData && responseData.data && responseData.data.setFaqCategory)
                            returnData.push(responseData.data.setFaqCategory);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setOrder') {
                        const userid = this.getNodeParameter('setOrder_userid', i);
                        const order_id = this.getNodeParameter('setOrder_order_id', i);
                        const order_title = this.getNodeParameter('setOrder_order_title', i);
                        const selectedShippingType = this.getNodeParameter('setOrder_selectedShippingType', i);
                        const input = JSON.parse(this.getNodeParameter('setOrder_input', i));
                        const variables = { userid, order_title, input };
                        if (order_id)
                            variables.order_id = order_id;
                        if (selectedShippingType)
                            variables.selectedShippingType = selectedShippingType;
                        const mutation = `mutation setOrder ($userid: Int!, $order_id: Int, $selectedShippingType: Int, $order_title: String!, $input: SetOrderInput!) { setOrder (userid: $userid, order_title: $order_title, selectedShippingType: $selectedShippingType, order_id: $order_id, input: $input) { result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables });
                        if (responseData && responseData.data && responseData.data.setOrder)
                            returnData.push(responseData.data.setOrder);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'modifyOrderProduct') {
                        const orderid = this.getNodeParameter('modifyOrderProduct_orderid', i);
                        const input = JSON.parse(this.getNodeParameter('modifyOrderProduct_input', i));
                        const mutation = `mutation modifyOrderProduct ($orderid: Int!, $input: ModifyOrderProductInput!) { modifyOrderProduct (orderid: $orderid, input: $input) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { orderid, input } });
                        if (responseData && responseData.data && responseData.data.modifyOrderProduct)
                            returnData.push(responseData.data.modifyOrderProduct);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setAdditionalOption') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setAdditionalOption_input', i), 'setAdditionalOption_input', this.getNode(), i), 'setAdditionalOption_input', this.getNode(), i);
                        const mutation = `mutation setAdditionalOption ($inputs: [AdditionalOptionInput!]!) { setAdditionalOption (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setAdditionalOption)
                            returnData.push(responseData.data.setAdditionalOption);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setAdditionalOptionAttributes') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setAdditionalOptionAttributes_input', i), 'setAdditionalOptionAttributes_input', this.getNode(), i), 'setAdditionalOptionAttributes_input', this.getNode(), i);
                        const mutation = `mutation setAdditionalOptionAttributes ($inputs: [AdditionalOptionAttributesInput!]!) { setAdditionalOptionAttributes (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setAdditionalOptionAttributes)
                            returnData.push(responseData.data.setAdditionalOptionAttributes);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setProductsAttributePrice') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setProductsAttributePrice_input', i), 'setProductsAttributePrice_input', this.getNode(), i), 'setProductsAttributePrice_input', this.getNode(), i);
                        const mutation = `mutation setProductsAttributePrice ($inputs: [ProductsAttributePriceInput!]!) { setProductsAttributePrice (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setProductsAttributePrice)
                            returnData.push(responseData.data.setProductsAttributePrice);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    if (operation === 'setQuantityBasedAttributePrice') {
                        const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter('setQuantityBasedAttributePrice_input', i), 'setQuantityBasedAttributePrice_input', this.getNode(), i), 'setQuantityBasedAttributePrice_input', this.getNode(), i);
                        const mutation = `mutation setQuantityBasedAttributePrice ($inputs: [QuantityBasedAttributePriceInput!]!) { setQuantityBasedAttributePrice (inputs: $inputs) { index result message id } }`;
                        const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                        if (responseData && responseData.data && responseData.data.setQuantityBasedAttributePrice)
                            returnData.push(responseData.data.setQuantityBasedAttributePrice);
                        else if (responseData && responseData.errors)
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                }
                // P0 OPS parity operation handlers
                if (resource === "category" && operation === "setProductCategory") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setProductCategory_input", i), "setProductCategory_input", this.getNode(), i), "setProductCategory_input", this.getNode(), i);
                    const mutation = `mutation setProductCategory($inputs: [ProductCategoryInput!]!) {
  setProductCategory(inputs: $inputs) {
    index
    result
    message
    id
    external_ref
  }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setProductCategory)
                        returnData.push(responseData.data.setProductCategory);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setAssignOptions") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setAssignOptions_input", i), "setAssignOptions_input", this.getNode(), i), "setAssignOptions_input", this.getNode(), i);
                    const mutation = `mutation setAssignOptions ($inputs: [AssignOptionsInput!]!) {
    setAssignOptions (inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setAssignOptions)
                        returnData.push(responseData.data.setAssignOptions);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setMasterOption") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setMasterOption_input", i), "setMasterOption_input", this.getNode(), i), "setMasterOption_input", this.getNode(), i);
                    const mutation = `mutation setMasterOption ($inputs: [MasterOptionInput!]!) {
    setMasterOption (inputs: $inputs) {
        index
        result
        message
        id
        external_ref
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setMasterOption)
                        returnData.push(responseData.data.setMasterOption);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setMasterOptionAttributes") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setMasterOptionAttributes_input", i), "setMasterOptionAttributes_input", this.getNode(), i), "setMasterOptionAttributes_input", this.getNode(), i);
                    const mutation = `mutation setMasterOptionAttributes ($inputs: [MasterOptionAttributesInput!]!) {
    setMasterOptionAttributes (inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setMasterOptionAttributes)
                        returnData.push(responseData.data.setMasterOptionAttributes);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setMasterOptionAttributePrice") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setMasterOptionAttributePrice_input", i), "setMasterOptionAttributePrice_input", this.getNode(), i), "setMasterOptionAttributePrice_input", this.getNode(), i);
                    const mutation = `mutation setMasterOptionAttributePrice ($inputs: [MasterOptionAttributePriceInput!]!) {
    setMasterOptionAttributePrice (inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setMasterOptionAttributePrice)
                        returnData.push(responseData.data.setMasterOptionAttributePrice);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setMasterOptionRange") {
                    const input = JSON.parse(this.getNodeParameter("setMasterOptionRange_input", i));
                    const mutation = `mutation setMasterOptionRange ($input: MasterOptionRangeInput!) {
    setMasterOptionRange (input: $input) {
        result
        message
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setMasterOptionRange)
                        returnData.push(responseData.data.setMasterOptionRange);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setMasterOptionTag") {
                    const input = JSON.parse(this.getNodeParameter("setMasterOptionTag_input", i));
                    const mutation = `mutation setMasterOptionTag ($input: MasterOptionTagInput!) {
    setMasterOptionTag (input: $input) {
        result
        message
        master_option_tag_id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setMasterOptionTag)
                        returnData.push(responseData.data.setMasterOptionTag);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setOptionGroup") {
                    const input = JSON.parse(this.getNodeParameter("setOptionGroup_input", i));
                    const mutation = `mutation setOptionGroup ($input: OptionGroupInput!) {
    setOptionGroup (input: $input) {
        result
        message
        prod_add_opt_group_id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setOptionGroup)
                        returnData.push(responseData.data.setOptionGroup);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "setCustomFormula") {
                    const input = JSON.parse(this.getNodeParameter("setCustomFormula_input", i));
                    const mutation = `mutation setCustomFormula ($input: CustomFormulaInput!) {
    setCustomFormula (input: $input) {
        result
        message
        formula_id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setCustomFormula)
                        returnData.push(responseData.data.setCustomFormula);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "optionRule" && operation === "setProductOptionRules") {
                    const input = JSON.parse(this.getNodeParameter("setProductOptionRules_input", i));
                    const mutation = `mutation setProductOptionRules ($input: ProductOptionRulesInput!) {
    setProductOptionRules (input: $input) {
        result
        message
        rule_id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setProductOptionRules)
                        returnData.push(responseData.data.setProductOptionRules);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "markup" && operation === "setStoreMarkup") {
                    const input = JSON.parse(this.getNodeParameter("setStoreMarkup_input", i));
                    const mutation = `mutation setStoreMarkup ($input: StoreMarkupInput!) {
    setStoreMarkup (input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setStoreMarkup)
                        returnData.push(responseData.data.setStoreMarkup);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "markup" && operation === "getStoreMarkup") {
                    const variables = {};
                    const corporate_markup_id = this.getNodeParameter("getStoreMarkup_corporate_markup_id", i);
                    variables.corporate_markup_id = corporate_markup_id;
                    const limit = this.getNodeParameter("getStoreMarkup_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getStoreMarkup_offset", i);
                    variables.offset = offset;
                    const query = `query get_store_markup($corporate_markup_id: Int, $limit: Int, $offset: Int) {
  get_store_markup(corporate_markup_id: $corporate_markup_id, limit: $limit, offset: $offset) {
    store_markup {
        corporate_markup_id
        markup_title
        markup_details
        status
        appliedon
    }
    totalStoreMarkup
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.get_store_markup)
                        returnData.push(responseData.data.get_store_markup);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "getCustomFormula") {
                    const variables = {};
                    const formula_id = this.getNodeParameter("getCustomFormula_formula_id", i);
                    variables.formula_id = formula_id;
                    const limit = this.getNodeParameter("getCustomFormula_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getCustomFormula_offset", i);
                    variables.offset = offset;
                    const query = `query getCustomFormula ($formula_id: Int, $limit: Int, $offset: Int) {
    getCustomFormula (formula_id: $formula_id, limit: $limit, offset: $offset) {
        customFormula {
            formula_id
            formula_label
            formula_syntax
        }
        totalCustomFormula
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.getCustomFormula)
                        returnData.push(responseData.data.getCustomFormula);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "getOptionGroup") {
                    const variables = {};
                    const prod_add_opt_group_id = this.getNodeParameter("getOptionGroup_prod_add_opt_group_id", i);
                    variables.prod_add_opt_group_id = prod_add_opt_group_id;
                    const use_for = this.getNodeParameter("getOptionGroup_use_for", i);
                    variables.use_for = use_for;
                    const limit = this.getNodeParameter("getOptionGroup_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getOptionGroup_offset", i);
                    variables.offset = offset;
                    const query = `query getOptionGroup ($prod_add_opt_group_id: Int,$use_for: String, $limit: Int, $offset: Int) {
    getOptionGroup (prod_add_opt_group_id: $prod_add_opt_group_id,use_for: $use_for, limit: $limit, offset: $offset) {
        optionGroup {
            prod_add_opt_group_id
            opt_group_name
            use_for
            display_style
            option_count
            is_collapse
            sort_order
        }
        totalOptionGroup
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.getOptionGroup)
                        returnData.push(responseData.data.getOptionGroup);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "getMasterOptionTag") {
                    const variables = {};
                    const master_option_tag_id = this.getNodeParameter("getMasterOptionTag_master_option_tag_id", i);
                    variables.master_option_tag_id = master_option_tag_id;
                    const limit = this.getNodeParameter("getMasterOptionTag_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getMasterOptionTag_offset", i);
                    variables.offset = offset;
                    const query = `query getMasterOptionTag ($master_option_tag_id: Int, $limit: Int, $offset: Int) {
    getMasterOptionTag (master_option_tag_id: $master_option_tag_id, limit: $limit, offset: $offset) {
        masterOptionTag {
            master_option_tag_id
            master_option_tag_name
        }
        totalMasterOptionTag
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionTag)
                        returnData.push(responseData.data.getMasterOptionTag);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "masterOption" && operation === "getMasterOptionRange") {
                    const variables = {};
                    const range_id = this.getNodeParameter("getMasterOptionRange_range_id", i);
                    variables.range_id = range_id;
                    const option_id = this.getNodeParameter("getMasterOptionRange_option_id", i);
                    variables.option_id = option_id;
                    const limit = this.getNodeParameter("getMasterOptionRange_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getMasterOptionRange_offset", i);
                    variables.offset = offset;
                    const query = `query getMasterOptionRange ($range_id: Int, $option_id: Int, $limit: Int, $offset: Int) {
    getMasterOptionRange (range_id: $range_id, option_id: $option_id, limit: $limit, offset: $offset) {
        masterOptionRange {
            range_id
            option_id
            from_range
            to_range
        }
        totalMasterOptionRange
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.getMasterOptionRange)
                        returnData.push(responseData.data.getMasterOptionRange);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "getFaqCategory") {
                    const variables = {};
                    const faqcat_id = this.getNodeParameter("getFaqCategory_faqcat_id", i);
                    variables.faqcat_id = faqcat_id;
                    const status = this.getNodeParameter("getFaqCategory_status", i);
                    variables.status = status;
                    const limit = this.getNodeParameter("getFaqCategory_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getFaqCategory_offset", i);
                    variables.offset = offset;
                    const query = `query get_faq_category($faqcat_id: Int, $status: Int, $limit: Int, $offset: Int) {
  get_faq_category(faqcat_id: $faqcat_id, status: $status, limit: $limit, offset: $offset) {
    faq_category {
      faqcat_id
      status
      sort_order
      faq_category_name
    }
    totalFaqCategory
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.get_faq_category)
                        returnData.push(responseData.data.get_faq_category);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setProductSize") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setProductSize_input", i), "setProductSize_input", this.getNode(), i), "setProductSize_input", this.getNode(), i);
                    const mutation = `mutation setProductSize ($inputs: [ProductSizeInput!]!) {
    setProductSize (inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setProductSize)
                        returnData.push(responseData.data.setProductSize);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setFaq") {
                    const input = JSON.parse(this.getNodeParameter("setFaq_input", i));
                    const mutation = `mutation setFaq($input: FaqInput!) {
  setFaq(input: $input) {
    result
    message
    id
  }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setFaq)
                        returnData.push(responseData.data.setFaq);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setFaqCategory") {
                    const input = JSON.parse(this.getNodeParameter("setFaqCategory_input", i));
                    const mutation = `mutation setFaqCategory($input: FaqCategoryInput!) {
  setFaqCategory(input: $input) {
    result
    message
    id
  }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setFaqCategory)
                        returnData.push(responseData.data.setFaqCategory);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                // P1 OPS parity operation handlers
                if (resource === "store" && operation === "setStore") {
                    const input = JSON.parse(this.getNodeParameter("setStore_input", i));
                    const mutation = `mutation setStore ($input: StoreInput!) {
    setStore (input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setStore)
                        returnData.push(responseData.data.setStore);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "store" && operation === "setStoreAddress") {
                    const input = JSON.parse(this.getNodeParameter("setStoreAddress_input", i));
                    const mutation = `mutation setStoreAddress ($input: StoreAddressInput!) {
    setStoreAddress (input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setStoreAddress)
                        returnData.push(responseData.data.setStoreAddress);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "store" && operation === "storeAddress") {
                    const variables = {};
                    const corporate_id = this.getNodeParameter("storeAddress_corporate_id", i);
                    variables.corporate_id = corporate_id;
                    const corporate_address_id = this.getNodeParameter("storeAddress_corporate_address_id", i);
                    variables.corporate_address_id = corporate_address_id;
                    const limit = this.getNodeParameter("storeAddress_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("storeAddress_offset", i);
                    variables.offset = offset;
                    const query = `query storeaddress($corporate_id: Int, $corporate_address_id: Int, $limit: Int, $offset: Int) {
    storeaddress(corporate_id: $corporate_id, corporate_address_id: $corporate_address_id, limit: $limit, offset: $offset) {
        storeaddress {
            office_name
            corporate_address_id
            address_flag
            corporate_id
            department_id
            available_to
            corporate_address
            suburb
            city
            postcode
            state
            country
            country_iso_code
            phone_number
            status
            extrafield
            receiver_name
            companyname
        }
        totalStoreAddress
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.storeaddress)
                        returnData.push(responseData.data.storeaddress);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "department" && operation === "setDepartment") {
                    const input = JSON.parse(this.getNodeParameter("setDepartment_input", i));
                    const mutation = `mutation setDepartment ($input: DepartmentInput!) {
    setDepartment (input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setDepartment)
                        returnData.push(responseData.data.setDepartment);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "customerAddress" && operation === "setCustomerAddressDetail") {
                    const input = JSON.parse(this.getNodeParameter("setCustomerAddressDetail_input", i));
                    const mutation = `mutation setCustomerAddressDetail ($input: CustomerAddressInput!) {
    setCustomerAddressDetail (input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { input } });
                    if (responseData && responseData.data && responseData.data.setCustomerAddressDetail)
                        returnData.push(responseData.data.setCustomerAddressDetail);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "customer" && operation === "notifyUser") {
                    const variables = {};
                    const usertype = this.getNodeParameter("notifyUser_usertype", i);
                    variables.usertype = usertype;
                    const cust_id = this.getNodeParameter("notifyUser_cust_id", i);
                    variables.cust_id = cust_id;
                    const input = JSON.parse(this.getNodeParameter("notifyUser_input", i));
                    variables.input = input;
                    const mutation = `mutation notifyUser ($usertype: UserNotifyTypeEnum!, $cust_id: Int, $input: UserNotifyInput!) {
    notifyUser (cust_id: $cust_id, usertype: $usertype, input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables });
                    if (responseData && responseData.data && responseData.data.notifyUser)
                        returnData.push(responseData.data.notifyUser);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "store" && operation === "getCountries") {
                    const variables = {};
                    const countries_id = this.getNodeParameter("getCountries_countries_id", i);
                    variables.countries_id = countries_id;
                    const status = this.getNodeParameter("getCountries_status", i);
                    variables.status = status;
                    const limit = this.getNodeParameter("getCountries_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getCountries_offset", i);
                    variables.offset = offset;
                    const query = `query get_countries($countries_id: Int, $status: Int, $limit: Int, $offset: Int) {
  get_countries(countries_id: $countries_id, status: $status, limit: $limit, offset: $offset) {
    countries {
      countries_id
      countries_name
      countries_iso_code_2
      countries_iso_code_3
      status
    }
    totalCountries
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.get_countries)
                        returnData.push(responseData.data.get_countries);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                // P2 OPS parity operation handlers
                if (resource === "order" && operation === "setOrder") {
                    const variables = {};
                    const userid = this.getNodeParameter("setOrder_userid", i);
                    variables.userid = userid;
                    const order_id = this.getNodeParameter("setOrder_order_id", i);
                    variables.order_id = order_id;
                    const selectedShippingType = this.getNodeParameter("setOrder_selectedShippingType", i);
                    variables.selectedShippingType = selectedShippingType;
                    const order_title = this.getNodeParameter("setOrder_order_title", i);
                    variables.order_title = order_title;
                    const input = JSON.parse(this.getNodeParameter("setOrder_input", i));
                    variables.input = input;
                    const mutation = `mutation setOrder ($userid: Int!, $order_id: Int, $selectedShippingType: Int, $order_title: String!, $input: SetOrderInput!) {
    setOrder (userid: $userid, order_title: $order_title, selectedShippingType: $selectedShippingType, order_id: $order_id, input: $input) {
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables });
                    if (responseData && responseData.data && responseData.data.setOrder)
                        returnData.push(responseData.data.setOrder);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "order" && operation === "modifyOrderProduct") {
                    const variables = {};
                    const orderid = this.getNodeParameter("modifyOrderProduct_orderid", i);
                    variables.orderid = orderid;
                    const input = JSON.parse(this.getNodeParameter("modifyOrderProduct_input", i));
                    variables.input = input;
                    const mutation = `mutation modifyOrderProduct ($orderid: Int!, $input: ModifyOrderProductInput!) {
    modifyOrderProduct (orderid: $orderid, input: $input) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables });
                    if (responseData && responseData.data && responseData.data.modifyOrderProduct)
                        returnData.push(responseData.data.modifyOrderProduct);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "basket" && operation === "setUserBasket") {
                    const variables = {};
                    const userId = this.getNodeParameter("setUserBasket_userId", i);
                    variables.userId = userId;
                    const action = this.getNodeParameter("setUserBasket_action", i);
                    variables.action = action;
                    const itemIndex = this.getNodeParameter("setUserBasket_itemIndex", i);
                    variables.itemIndex = itemIndex;
                    const input = JSON.parse(this.getNodeParameter("setUserBasket_input", i));
                    variables.input = input;
                    const mutation = `mutation setUserBasket ($userId: Int!, $action: String!, $itemIndex: Int!, $input: SetUserBasketInput!) {
    setUserBasket (userId: $userId, action: $action, itemIndex: $itemIndex, input: $input) {
        result
        message
        basket_id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables });
                    if (responseData && responseData.data && responseData.data.setUserBasket)
                        returnData.push(responseData.data.setUserBasket);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "basket" && operation === "getUserBasket") {
                    const variables = {};
                    const user_id = this.getNodeParameter("getUserBasket_user_id", i);
                    variables.user_id = user_id;
                    const query = `query getUserBasket( $user_id: Int!) {
  getUserBasket( user_id: $user_id ) {
    baskets {
        basket_id
        user_id
        cart_detail
        cart_count
        date
    }
    totalBaskets
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.getUserBasket)
                        returnData.push(responseData.data.getUserBasket);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setProductsImageGallery") {
                    const variables = {};
                    const products_id = this.getNodeParameter("setProductsImageGallery_products_id", i);
                    variables.products_id = products_id;
                    const optimizeimg = this.getNodeParameter("setProductsImageGallery_optimizeimg", i);
                    variables.optimizeimg = optimizeimg;
                    const input = JSON.parse(this.getNodeParameter("setProductsImageGallery_input", i));
                    variables.input = input;
                    const mutation = `mutation setProductsImageGallery($products_id : Int!, $optimizeimg : Int, $input: ProductsImageGalleryBulkInput!) {
  setProductsImageGallery(products_id: $products_id, optimizeimg: $optimizeimg, input: $input) {
    result
    message {
      id
      status
      message
    }
  }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables });
                    if (responseData && responseData.data && responseData.data.setProductsImageGallery)
                        returnData.push(responseData.data.setProductsImageGallery);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "productsImageGallery") {
                    const variables = {};
                    const products_image_gallery_id = this.getNodeParameter("productsImageGallery_products_image_gallery_id", i);
                    variables.products_image_gallery_id = products_image_gallery_id;
                    const products_id = this.getNodeParameter("productsImageGallery_products_id", i);
                    variables.products_id = products_id;
                    const corporate_id = this.getNodeParameter("productsImageGallery_corporate_id", i);
                    variables.corporate_id = corporate_id;
                    const limit = this.getNodeParameter("productsImageGallery_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("productsImageGallery_offset", i);
                    variables.offset = offset;
                    const query = `query productsImageGallery ($products_image_gallery_id: Int, $products_id: Int, $corporate_id: Int, $limit: Int, $offset: Int) {
    products_image_gallery ( products_image_gallery_id: $products_image_gallery_id, products_id: $products_id,corporate_id: $corporate_id, limit: $limit, offset: $offset) {
        products_image_gallery {
            products_image_gallery_id
            products_id
            corporate_id
            title
            products_thumb_image_name
            products_large_image_name
            option_id
            attribute_id
            option_ids
            attribute_ids
            sort_order
            status
        }
        totalProductsImageGallery
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.productsImageGallery)
                        returnData.push(responseData.data.productsImageGallery);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "product" && operation === "setProductPages") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setProductPages_input", i), "setProductPages_input", this.getNode(), i), "setProductPages_input", this.getNode(), i);
                    const mutation = `mutation setProductPages ($inputs: [ProductPagesInput!]!) {
    setProductPages (inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setProductPages)
                        returnData.push(responseData.data.setProductPages);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "customer" && operation === "accountSummary") {
                    const variables = {};
                    const storeid = this.getNodeParameter("accountSummary_storeid", i);
                    variables.storeid = storeid;
                    const limit = this.getNodeParameter("accountSummary_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("accountSummary_offset", i);
                    variables.offset = offset;
                    const query = `query accountSummary($storeid: Int, $limit: Int, $offset: Int) {
  accountSummary(storeid: $storeid, limit: $limit, offset: $offset) {
    accountSummary {
        storeid
        department_id
        amount
        type
        comments
        paymethod
        duedate
        term_title
        date_added
    }
    totalAccountSummary
    remainingInvoiceAmount
    remainingPaidLimit
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.accountSummary)
                        returnData.push(responseData.data.accountSummary);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "customer" && operation === "storeCreditSummary") {
                    const variables = {};
                    const storeid = this.getNodeParameter("storeCreditSummary_storeid", i);
                    variables.storeid = storeid;
                    const user_id = this.getNodeParameter("storeCreditSummary_user_id", i);
                    variables.user_id = user_id;
                    const limit = this.getNodeParameter("storeCreditSummary_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("storeCreditSummary_offset", i);
                    variables.offset = offset;
                    const query = `query storeCreditSummary($storeid: Int, $user_id: Int, $limit: Int, $offset: Int) {
  storeCreditSummary(storeid: $storeid, user_id: $user_id, limit: $limit, offset: $offset) {
    storeCreditSummary {
        user_id
        storeid
        customer_name
        store_name
        tran_type
        transaction_msg
        order_id
        transaction_date_time
        maintain_by
        comments
    }
    totalStoreCreditSummary
    remainingCredit
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.storeCreditSummary)
                        returnData.push(responseData.data.storeCreditSummary);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "order" && operation === "getPaymentTermMaster") {
                    const variables = {};
                    const term_id = this.getNodeParameter("getPaymentTermMaster_term_id", i);
                    variables.term_id = term_id;
                    const limit = this.getNodeParameter("getPaymentTermMaster_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("getPaymentTermMaster_offset", i);
                    variables.offset = offset;
                    const query = `query get_payment_term_master($term_id: Int, $limit: Int, $offset: Int) {
  get_payment_term_master(term_id: $term_id, limit: $limit, offset: $offset) {
    payment_term_master {
        term_id
        term_details
        default_term
        check_order
        status
        term_title
        term_description
    }
    totalPaymentTermMaster
  }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.get_payment_term_master)
                        returnData.push(responseData.data.get_payment_term_master);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                // P3 OPS parity operation handlers
                if (resource === "additionalOption" && operation === "setAdditionalOption") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setAdditionalOption_input", i), "setAdditionalOption_input", this.getNode(), i), "setAdditionalOption_input", this.getNode(), i);
                    const mutation = `mutation setAdditionalOption($inputs: [AdditionalOptionInput!]!) {
    setAdditionalOption(inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setAdditionalOption)
                        returnData.push(responseData.data.setAdditionalOption);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "additionalOption" && operation === "setAdditionalOptionAttributes") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setAdditionalOptionAttributes_input", i), "setAdditionalOptionAttributes_input", this.getNode(), i), "setAdditionalOptionAttributes_input", this.getNode(), i);
                    const mutation = `mutation setAdditionalOptionAttributes($inputs: [AdditionalOptionAttributesInput!]!) {
    setAdditionalOptionAttributes(inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setAdditionalOptionAttributes)
                        returnData.push(responseData.data.setAdditionalOptionAttributes);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "additionalOption" && operation === "setProductsAttributePrice") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setProductsAttributePrice_input", i), "setProductsAttributePrice_input", this.getNode(), i), "setProductsAttributePrice_input", this.getNode(), i);
                    const mutation = `mutation setProductsAttributePrice($inputs: [ProductsAttributePriceInput!]!) {
    setProductsAttributePrice(inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setProductsAttributePrice)
                        returnData.push(responseData.data.setProductsAttributePrice);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "additionalOption" && operation === "setQuantityBasedAttributePrice") {
                    const inputs = toBatchInputs(parseJsonParameter(this.getNodeParameter("setQuantityBasedAttributePrice_input", i), "setQuantityBasedAttributePrice_input", this.getNode(), i), "setQuantityBasedAttributePrice_input", this.getNode(), i);
                    const mutation = `mutation setQuantityBasedAttributePrice($inputs: [QuantityBasedAttributePriceInput!]!) {
    setQuantityBasedAttributePrice(inputs: $inputs) {
        index
        result
        message
        id
    }
}`;
                    const responseData = await requestGraphql({ query: mutation, variables: { inputs } });
                    if (responseData && responseData.data && responseData.data.setQuantityBasedAttributePrice)
                        returnData.push(responseData.data.setQuantityBasedAttributePrice);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "additionalOption" && operation === "productAdditionalOptions") {
                    const variables = {};
                    const products_id = this.getNodeParameter("productAdditionalOptions_products_id", i);
                    variables.products_id = products_id;
                    const limit = this.getNodeParameter("productAdditionalOptions_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("productAdditionalOptions_offset", i);
                    variables.offset = offset;
                    const query = `query product_additional_options ($products_id: Int, $limit: Int, $offset: Int) {
    product_additional_options (products_id: $products_id, limit: $limit, offset: $offset) {
        product_additional_options {
                prod_add_opt_id
                title
                description
                options_type
                sort_order
                status
                apply_multiplication
                applicable_for
                required
                price_calculate_type
                hire_designer_option
                option_key
                master_option_id
                attributes
            }
        total_product_additional_options
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.product_additional_options)
                        returnData.push(responseData.data.product_additional_options);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "additionalOption" && operation === "productsAttributePrice") {
                    const variables = {};
                    const attribute_id = this.getNodeParameter("productsAttributePrice_attribute_id", i);
                    variables.attribute_id = attribute_id;
                    const size_id = this.getNodeParameter("productsAttributePrice_size_id", i);
                    variables.size_id = size_id;
                    const limit = this.getNodeParameter("productsAttributePrice_limit", i);
                    variables.limit = limit;
                    const offset = this.getNodeParameter("productsAttributePrice_offset", i);
                    variables.offset = offset;
                    const query = `query products_attribute_price($attribute_id: Int, $size_id: Int, $limit: Int, $offset: Int) {
    products_attribute_price(attribute_id: $attribute_id, size_id: $size_id, limit: $limit, offset: $offset) {
        products_attribute_price {
            attribute_price_id
            attribute_id
            size_id
            quantity
            quantity_to
            attributes_price
            extra_page_price
        }
        total_products_attribute_price
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.products_attribute_price)
                        returnData.push(responseData.data.products_attribute_price);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === "shipToMultipleAddress" && operation === "shipToMultipleAddress") {
                    const variables = {};
                    const order_id = this.getNodeParameter("shipToMultipleAddress_order_id", i);
                    variables.order_id = order_id;
                    const query = `query shipToMultipleAddress ($order_id: Int) {
    shipToMultipleAddress (order_id: $order_id) {
        shipToMultipleAddress {
			ship_to_multiple_address_shipping_type_id,
            ship_to_multiple_address_shipping_price,
			ship_to_multiple_address_shipping_name,
			ship_to_multiple_address_shipping_mode,
			ship_to_multiple_address_production_due_date,
			ship_to_multiple_address_shipment_due_date,
			ship_to_multiple_address_product_details,
			ship_to_multiple_address_delivery_name,
			ship_to_multiple_address_delivery_company,
			ship_to_multiple_address_delivery_street_address,
			ship_to_multiple_address_delivery_suburb,
			ship_to_multiple_address_delivery_city,
			ship_to_multiple_address_delivery_postcode,
			ship_to_multiple_address_delivery_state,
			ship_to_multiple_address_delivery_country,
			ship_to_multiple_address_delivery_telephone,
			ship_to_multiple_address_blind_address,
			ship_to_multiple_address_extra_field
        }
    }
}`;
                    const responseData = await requestGraphql({ query: query, variables });
                    if (responseData && responseData.data && responseData.data.shipToMultipleAddress)
                        returnData.push(responseData.data.shipToMultipleAddress);
                    else if (responseData && responseData.errors)
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                }
                if (resource === 'customer' && operation === 'create') {
                    // Create customer - registration type, first name, last name, and email required
                    const registration_type = this.getNodeParameter('registration_type', i);
                    const first_name = this.getNodeParameter('first_name', i);
                    const last_name = this.getNodeParameter('last_name', i);
                    const email = this.getNodeParameter('email', i);
                    const optionalFields = this.getNodeParameter('optionalFields', i);
                    // Generate password if not provided and doing full registration
                    let password = optionalFields.password || '';
                    // If doing normal registration (not two step) and no password provided, generate one
                    if (registration_type === 0 && !password) {
                        // Generate a random 8-character password
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        password = '';
                        for (let j = 0; j < 8; j++) {
                            password += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                    }
                    // Build input object with smart defaults
                    const input = {
                        registration_type, // Default to 1 (Two Step)
                        corporateid: optionalFields.corporateid !== undefined ? optionalFields.corporateid : 0,
                        departmentid: optionalFields.departmentid !== undefined ? optionalFields.departmentid : 0,
                        first_name,
                        last_name,
                        email,
                        password: password || '', // Use provided or generated password
                        set_password: registration_type === 0 ? 1 : 0, // Set password for normal registration
                        phone_no: optionalFields.phone_no !== undefined ? optionalFields.phone_no : '',
                        company_name: optionalFields.company_name !== undefined ? optionalFields.company_name : '',
                        external_ref: optionalFields.external_ref !== undefined ? optionalFields.external_ref : '',
                        user_group: optionalFields.user_group !== undefined ? optionalFields.user_group : 0,
                        secondary_emails: optionalFields.secondary_emails !== undefined ? optionalFields.secondary_emails : '',
                        status: optionalFields.status !== undefined ? optionalFields.status : 1, // Default to active
                        tax_exemption: optionalFields.tax_exemption !== undefined ? optionalFields.tax_exemption : 0,
                        payon_account: optionalFields.payon_account !== undefined ? optionalFields.payon_account : 0,
                        payon_limit: optionalFields.payon_limit !== undefined ? optionalFields.payon_limit : 0,
                    };
                    // Build the GraphQL mutation
                    const mutation = `
						mutation setCustomer ($customer_id: Int, $input: SetCustomerInput!) {
								setCustomer (customer_id: $customer_id, input: $input) {
									result
									message
									id
									external_ref
								}
							}
						`;
                    // Make the GraphQL request (customer_id = 0 for create)
                    const responseData = await requestGraphql({
                        query: mutation.trim(),
                        variables: {
                            customer_id: 0, // 0 for create
                            input,
                        },
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.setCustomer) {
                        const result = responseData.data.setCustomer;
                        returnData.push({
                            ...result,
                            _operation: 'create',
                            _registration_type: registration_type === 0 ? 'Normal' : 'Two Step',
                            _generated_password: registration_type === 0 && password ? password : null,
                            _input: input,
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'customer' && operation === 'update') {
                    // Update customer
                    const customer_id = this.getNodeParameter('customer_id', i);
                    const updateFields = this.getNodeParameter('updateFields', i);
                    // Build input object with only provided fields
                    const input = {};
                    // Add fields if provided
                    if (updateFields.registration_type !== undefined)
                        input.registration_type = updateFields.registration_type;
                    if (updateFields.corporateid !== undefined)
                        input.corporateid = updateFields.corporateid;
                    if (updateFields.departmentid !== undefined)
                        input.departmentid = updateFields.departmentid;
                    if (updateFields.first_name !== undefined)
                        input.first_name = updateFields.first_name;
                    if (updateFields.last_name !== undefined)
                        input.last_name = updateFields.last_name;
                    if (updateFields.email !== undefined)
                        input.email = updateFields.email;
                    if (updateFields.password !== undefined)
                        input.password = updateFields.password;
                    if (updateFields.set_password !== undefined)
                        input.set_password = updateFields.set_password;
                    if (updateFields.phone_no !== undefined)
                        input.phone_no = updateFields.phone_no;
                    if (updateFields.company_name !== undefined)
                        input.company_name = updateFields.company_name;
                    if (updateFields.external_ref !== undefined)
                        input.external_ref = updateFields.external_ref;
                    if (updateFields.user_group !== undefined)
                        input.user_group = updateFields.user_group;
                    if (updateFields.secondary_emails !== undefined)
                        input.secondary_emails = updateFields.secondary_emails;
                    if (updateFields.status !== undefined)
                        input.status = updateFields.status;
                    if (updateFields.tax_exemption !== undefined)
                        input.tax_exemption = updateFields.tax_exemption;
                    if (updateFields.payon_account !== undefined)
                        input.payon_account = updateFields.payon_account;
                    if (updateFields.payon_limit !== undefined)
                        input.payon_limit = updateFields.payon_limit;
                    // Build the GraphQL mutation
                    const mutation = `
						mutation setCustomer ($customer_id: Int, $input: SetCustomerInput!) {
								setCustomer (customer_id: $customer_id, input: $input) {
									result
									message
									id
									external_ref
								}
							}
						`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: mutation.trim(),
                        variables: {
                            customer_id,
                            input,
                        },
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.setCustomer) {
                        const result = responseData.data.setCustomer;
                        returnData.push({
                            ...result,
                            _operation: 'update',
                            _customer_id: customer_id,
                            _input: input,
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'customer' && operation === 'get') {
                    // Get customer by email
                    const email = this.getNodeParameter('email', i);
                    const customerFieldsSelected = getFieldSelection('customerFields');
                    const addressFieldsSelected = getFieldSelection('addressFields');
                    // Filter out special options and separators
                    const customerFields = customerFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL_') && !field.startsWith('DESELECT_ALL_') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build address fields string
                    let addressFields = '';
                    const validAddressFields = addressFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL_') && !field.startsWith('DESELECT_ALL_') && field !== 'SEPARATOR');
                    if (validAddressFields.length > 0) {
                        const addressFieldsStr = validAddressFields.join('\n\t\t\t\t\t\t\t\t');
                        addressFields = `
							address_detail {
								${addressFieldsStr}
							}
						`;
                    }
                    // Build the GraphQL query
                    const query = `
						query customers ($email: String) {
							customers (email: $email) {
								customers {
									${customerFields}
									${addressFields}
								}
								totalCustomers
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables: { email },
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.customers) {
                        const customers = responseData.data.customers.customers;
                        const totalCustomers = responseData.data.customers.totalCustomers;
                        // Add each customer to returnData
                        if (Array.isArray(customers) && customers.length > 0) {
                            customers.forEach((customer) => {
                                returnData.push({
                                    ...customer,
                                    _totalCustomers: totalCustomers,
                                });
                            });
                        }
                        else {
                            // No customer found
                            returnData.push({
                                error: 'No customer found with this email',
                                email,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'customer' && operation === 'getAll') {
                    // Get query parameters
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const customerFieldsSelected = getFieldSelection('customerFieldsGetAll');
                    const addressFieldsSelected = getFieldSelection('addressFieldsGetAll');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i) || false;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250); // Max 250 (API hard limit)
                    const pageDelay = Math.max(queryParameters.pageDelay || 50, 25); // Min 25ms, default 50ms
                    // Filter out special options and separators
                    const customerFields = customerFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL_') && !field.startsWith('DESELECT_ALL_') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build address fields string
                    let addressFields = '';
                    const validAddressFields = addressFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL_') && !field.startsWith('DESELECT_ALL_') && field !== 'SEPARATOR');
                    if (validAddressFields.length > 0) {
                        const addressFieldsStr = validAddressFields.join('\n\t\t\t\t\t\t\t\t');
                        addressFields = `
							address_detail {
								${addressFieldsStr}
							}
						`;
                    }
                    // Build the GraphQL query
                    const query = `
						query customers ($email: String, $from_date: String, $to_date: String, $date_type: CustomerDateTypeEnum, $limit: Int, $offset: Int) {
							customers (email: $email, from_date: $from_date, to_date: $to_date, date_type: $date_type, limit: $limit, offset: $offset) {
								customers {
									${customerFields}
									${addressFields}
								}
								totalCustomers
							}
						}
					`;
                    let allCustomers = [];
                    let totalCustomers = 0;
                    let offset = 0;
                    let hasMorePages = true;
                    if (fetchAllPages) {
                        // Auto-pagination: fetch all pages with rate limiting
                        let pageCount = 0;
                        const maxPages = 100; // Safety limit to prevent infinite loops
                        let adaptiveDelay = pageDelay;
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            const variables = {
                                limit: pageSize,
                                offset: offset,
                            };
                            if (queryParameters.email)
                                variables.email = queryParameters.email;
                            if (queryParameters.from_date)
                                variables.from_date = new Date(queryParameters.from_date).toISOString().split('T')[0];
                            if (queryParameters.to_date)
                                variables.to_date = new Date(queryParameters.to_date).toISOString().split('T')[0];
                            if (queryParameters.date_type)
                                variables.date_type = queryParameters.date_type;
                            try {
                                const responseData = await requestGraphql({
                                    query: query.trim(),
                                    variables,
                                });
                                if (responseData && responseData.data && responseData.data.customers) {
                                    const customers = responseData.data.customers.customers;
                                    totalCustomers = responseData.data.customers.totalCustomers;
                                    if (Array.isArray(customers) && customers.length > 0) {
                                        allCustomers = allCustomers.concat(customers);
                                        offset += pageSize;
                                        pageCount++;
                                        hasMorePages = customers.length === pageSize; // Continue if we got a full page
                                        // Adaptive delay: adjust based on response time
                                        const responseTime = Date.now() - requestStartTime;
                                        if (responseTime < 100) {
                                            // Fast response, can reduce delay
                                            adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                        }
                                        else if (responseTime > 500) {
                                            // Slow response, increase delay
                                            adaptiveDelay = Math.min(200, adaptiveDelay * 1.2);
                                        }
                                        // Add adaptive delay between requests
                                        if (hasMorePages) {
                                            await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                                        }
                                    }
                                    else {
                                        hasMorePages = false;
                                    }
                                }
                                else if (responseData && responseData.errors) {
                                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error on page ${pageCount + 1}: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                                }
                                else {
                                    hasMorePages = false;
                                }
                            }
                            catch (error) {
                                // Handle rate limiting or server errors
                                const statusCode = getErrorStatusCode(error);
                                if (statusCode === 429 || statusCode === 502) {
                                    // Rate limited or server error - wait longer and retry
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 2); // Increase delay on rate limit
                                    await (0, n8n_workflow_1.sleep)(2000); // 2 second delay
                                    continue; // Retry the same page
                                }
                                throw new n8n_workflow_1.NodeApiError(this.getNode(), toNodeApiErrorResponse(error), { itemIndex: i });
                            }
                        }
                        if (pageCount >= maxPages) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Auto-pagination stopped at ${maxPages} pages for safety. Consider using smaller page sizes or manual pagination.`, { itemIndex: i });
                        }
                        // Add all customers to returnData
                        allCustomers.forEach((customer) => {
                            returnData.push({
                                ...customer,
                                _totalCustomers: totalCustomers,
                                _autoPaginated: true,
                                _totalPages: pageCount,
                                _pageSize: pageSize,
                                _totalRecords: allCustomers.length,
                                _paginationInfo: `Fetched ${allCustomers.length} records across ${pageCount} pages`,
                            });
                        });
                    }
                    else {
                        // Single page request (original behavior)
                        const variables = {};
                        if (queryParameters.email)
                            variables.email = queryParameters.email;
                        if (queryParameters.from_date)
                            variables.from_date = new Date(queryParameters.from_date).toISOString().split('T')[0];
                        if (queryParameters.to_date)
                            variables.to_date = new Date(queryParameters.to_date).toISOString().split('T')[0];
                        if (queryParameters.date_type)
                            variables.date_type = queryParameters.date_type;
                        if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                        const responseData = await requestGraphql({
                            query: query.trim(),
                            variables,
                        });
                        // Handle GraphQL response
                        if (responseData && responseData.data && responseData.data.customers) {
                            const customers = responseData.data.customers.customers;
                            totalCustomers = responseData.data.customers.totalCustomers;
                            // Add each customer to returnData
                            if (Array.isArray(customers)) {
                                customers.forEach((customer) => {
                                    returnData.push({
                                        ...customer,
                                        _totalCustomers: totalCustomers,
                                    });
                                });
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                        }
                    }
                }
                if (resource === 'order' && operation === 'get') {
                    // Get single order by ID
                    const orderId = this.getNodeParameter('orderId', i);
                    const orderFieldsSelected = getFieldSelection('orderFields');
                    const customerFieldsSelected = getFieldSelection('customerFieldsGet');
                    const productFieldsSelected = getFieldSelection('productFieldsGet');
                    const blindDetailFieldsSelected = getFieldSelection('blindDetailFieldsGet');
                    const deliveryDetailFieldsSelected = getFieldSelection('deliveryDetailFieldsGet');
                    const billingDetailFieldsSelected = getFieldSelection('billingDetailFieldsGet');
                    const shipmentDetailFieldsSelected = getFieldSelection('shipmentDetailFieldsGet');
                    // Filter out special options and separators
                    const orderFields = orderFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const customerFields = customerFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    const blindDetailFields = blindDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    const deliveryDetailFields = deliveryDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    const billingDetailFields = billingDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    const shipmentDetailFields = shipmentDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    // Build the GraphQL query with nested response structure
                    const query = `
					query orders ($orders_id: Int) {
						orders (orders_id: $orders_id) {
							orders {
								${orderFields}
								${customerFields ? `customer { ${customerFields} }` : ''}
								${productFields ? `product { ${productFields} }` : ''}
								${blindDetailFields ? `blind_detail { ${blindDetailFields} }` : ''}
								${deliveryDetailFields ? `delivery_detail { ${deliveryDetailFields} }` : ''}
								${billingDetailFields ? `billing_detail { ${billingDetailFields} }` : ''}
								${shipmentDetailFields ? `shipment_detail { ${shipmentDetailFields} }` : ''}
							}
							totalOrders
						}
					}
				`;
                    const variables = { orders_id: parseInt(orderId) };
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    if (responseData && responseData.data && responseData.data.orders) {
                        const orders = responseData.data.orders.orders;
                        if (Array.isArray(orders) && orders.length > 0) {
                            returnData.push(orders[0]);
                        }
                        else {
                            returnData.push({
                                error: 'No order found with this ID',
                                orderId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'order' && operation === 'getAll') {
                    // Get many orders
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const orderFieldsSelected = getFieldSelection('orderFieldsGetAll');
                    const customerFieldsSelected = getFieldSelection('customerFieldsGetAll');
                    const productFieldsSelected = getFieldSelection('productFieldsGetAll');
                    const blindDetailFieldsSelected = getFieldSelection('blindDetailFieldsGetAll');
                    const deliveryDetailFieldsSelected = getFieldSelection('deliveryDetailFieldsGetAll');
                    const billingDetailFieldsSelected = getFieldSelection('billingDetailFieldsGetAll');
                    const shipmentDetailFieldsSelected = getFieldSelection('shipmentDetailFieldsGetAll');
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i) || false;
                    const pageSize = Math.min(queryParameters.pageSize || 250, 250); // Max 250 (API hard limit)
                    const pageDelay = Math.max(queryParameters.pageDelay || 50, 25); // Min 25ms, default 50ms
                    // Filter out special options and separators for each field group
                    const orderFields = orderFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const customerFields = customerFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const blindDetailFields = blindDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const deliveryDetailFields = deliveryDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const billingDetailFields = billingDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    const shipmentDetailFields = shipmentDetailFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query with nested response structure
                    const query = `
					query orders ($orders_id: Int, $orders_products_id: Int, $order_product_status: Int, $store_id: String, $from_date: String, $to_date: String, $order_status: String, $customer_id: Int, $order_type: OrdersOrderTypeEnum, $limit: Int, $offset: Int) {
						orders (orders_id: $orders_id, orders_products_id: $orders_products_id, order_product_status: $order_product_status, store_id: $store_id, from_date: $from_date, to_date: $to_date, order_status: $order_status, customer_id: $customer_id, order_type: $order_type, limit: $limit, offset: $offset) {
							orders {
								${orderFields}
								${customerFields ? `customer { ${customerFields} }` : ''}
								${productFields ? `product { ${productFields} }` : ''}
								${blindDetailFields ? `blind_detail { ${blindDetailFields} }` : ''}
								${deliveryDetailFields ? `delivery_detail { ${deliveryDetailFields} }` : ''}
								${billingDetailFields ? `billing_detail { ${billingDetailFields} }` : ''}
								${shipmentDetailFields ? `shipment_detail { ${shipmentDetailFields} }` : ''}
							}
							totalOrders
						}
					}
				`;
                    let allOrders = [];
                    let totalOrders = 0;
                    let offset = 0;
                    let hasMorePages = true;
                    if (fetchAllPages) {
                        // Auto-pagination: fetch all pages with rate limiting
                        let pageCount = 0;
                        const maxPages = 100; // Safety limit to prevent infinite loops
                        let adaptiveDelay = pageDelay;
                        while (hasMorePages && pageCount < maxPages) {
                            const requestStartTime = Date.now();
                            // Build variables with normalization and omit empty/undefined
                            const variables = { limit: pageSize, offset };
                            const qp = queryParameters || {};
                            if (qp.orders_id !== undefined && qp.orders_id !== '')
                                variables.orders_id = Number(qp.orders_id);
                            if (qp.orders_products_id !== undefined && qp.orders_products_id !== '')
                                variables.orders_products_id = Number(qp.orders_products_id);
                            if (qp.order_product_status !== undefined && qp.order_product_status !== '')
                                variables.order_product_status = Number(qp.order_product_status);
                            if (qp.store_id)
                                variables.store_id = String(qp.store_id);
                            if (qp.from_date)
                                variables.from_date = new Date(String(qp.from_date)).toISOString().split('T')[0];
                            if (qp.to_date)
                                variables.to_date = new Date(String(qp.to_date)).toISOString().split('T')[0];
                            if (qp.order_status)
                                variables.order_status = String(qp.order_status);
                            if (qp.customer_id !== undefined && qp.customer_id !== '')
                                variables.customer_id = Number(qp.customer_id);
                            if (qp.order_type)
                                variables.order_type = qp.order_type;
                            // Optional Safe Mode: reduce nested groups if first page fails with 5xx
                            const safeMode = this.getNodeParameter('safeMode', i, false) || false;
                            try {
                                const responseData = await requestGraphql({
                                    query: query.trim(),
                                    variables,
                                });
                                if (responseData && responseData.data && responseData.data.orders) {
                                    const orders = responseData.data.orders.orders;
                                    totalOrders = responseData.data.orders.totalOrders;
                                    if (Array.isArray(orders) && orders.length > 0) {
                                        allOrders = allOrders.concat(orders);
                                        offset += pageSize;
                                        pageCount++;
                                        hasMorePages = orders.length === pageSize; // Continue if we got a full page
                                        // Adaptive delay: adjust based on response time
                                        const responseTime = Date.now() - requestStartTime;
                                        if (responseTime < 100) {
                                            // Fast response, can reduce delay
                                            adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                        }
                                        else if (responseTime > 500) {
                                            // Slow response, increase delay
                                            adaptiveDelay = Math.min(200, adaptiveDelay * 1.2);
                                        }
                                        // Add adaptive delay between requests
                                        if (hasMorePages) {
                                            await (0, n8n_workflow_1.sleep)(Math.round(adaptiveDelay));
                                        }
                                    }
                                    else {
                                        hasMorePages = false;
                                    }
                                }
                                else if (responseData && responseData.errors) {
                                    // When safeMode is enabled and this is the first page, retry without nested groups
                                    if (safeMode && pageCount === 0) {
                                        const minimalQuery = `
											query orders ($orders_id: Int, $orders_products_id: Int, $order_product_status: Int, $store_id: String, $from_date: String, $to_date: String, $order_status: String, $customer_id: Int, $order_type: OrdersOrderTypeEnum, $limit: Int, $offset: Int) {
												orders (orders_id: $orders_id, orders_products_id: $orders_products_id, order_product_status: $order_product_status, store_id: $store_id, from_date: $from_date, to_date: $to_date, order_status: $order_status, customer_id: $customer_id, order_type: $order_type, limit: $limit, offset: $offset) {
													orders {
														${orderFields}
													}
													totalOrders
												}
											}
										`;
                                        const retryResponse = await requestGraphql({ query: minimalQuery.trim(), variables });
                                        if (retryResponse && retryResponse.data && retryResponse.data.orders) {
                                            const orders = retryResponse.data.orders.orders;
                                            totalOrders = retryResponse.data.orders.totalOrders;
                                            if (Array.isArray(orders) && orders.length > 0) {
                                                allOrders = allOrders.concat(orders);
                                                offset += pageSize;
                                                pageCount++;
                                                hasMorePages = orders.length === pageSize;
                                                const responseTime = Date.now() - requestStartTime;
                                                if (responseTime < 100) {
                                                    adaptiveDelay = Math.max(25, adaptiveDelay * 0.8);
                                                }
                                                else if (responseTime > 500) {
                                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 1.25);
                                                }
                                                continue;
                                            }
                                        }
                                    }
                                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error on page ${pageCount + 1}: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                                }
                                else {
                                    hasMorePages = false;
                                }
                            }
                            catch (error) {
                                // Handle rate limiting or server errors
                                const statusCode = getErrorStatusCode(error);
                                if (statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
                                    // Rate limited or server error - wait longer and retry
                                    adaptiveDelay = Math.min(1000, adaptiveDelay * 2); // Increase delay on rate limit
                                    await (0, n8n_workflow_1.sleep)(2000); // 2 second delay
                                    continue; // Retry the same page
                                }
                                throw new n8n_workflow_1.NodeApiError(this.getNode(), toNodeApiErrorResponse(error), { itemIndex: i });
                            }
                        }
                        if (pageCount >= maxPages) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Auto-pagination stopped at ${maxPages} pages for safety. Consider using smaller page sizes or manual pagination.`, { itemIndex: i });
                        }
                        // Add all orders to returnData
                        allOrders.forEach((order) => {
                            returnData.push({
                                ...order,
                                _totalOrders: totalOrders,
                                _autoPaginated: true,
                                _totalPages: pageCount,
                                _pageSize: pageSize,
                                _totalRecords: allOrders.length,
                                _paginationInfo: `Fetched ${allOrders.length} records across ${pageCount} pages`,
                            });
                        });
                    }
                    else {
                        // Single page request (original behavior)
                        const variables = {};
                        if (queryParameters.orders_id)
                            variables.orders_id = queryParameters.orders_id;
                        if (queryParameters.orders_products_id)
                            variables.orders_products_id = queryParameters.orders_products_id;
                        if (queryParameters.order_product_status)
                            variables.order_product_status = queryParameters.order_product_status;
                        if (queryParameters.store_id)
                            variables.store_id = queryParameters.store_id;
                        if (queryParameters.from_date)
                            variables.from_date = new Date(queryParameters.from_date).toISOString().split('T')[0];
                        if (queryParameters.to_date)
                            variables.to_date = new Date(queryParameters.to_date).toISOString().split('T')[0];
                        if (queryParameters.order_status)
                            variables.order_status = queryParameters.order_status;
                        if (queryParameters.customer_id)
                            variables.customer_id = queryParameters.customer_id;
                        if (queryParameters.order_type)
                            variables.order_type = queryParameters.order_type;
                        if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                        const responseData = await requestGraphql({
                            query: query.trim(),
                            variables,
                        });
                        // Handle GraphQL response
                        if (responseData && responseData.data && responseData.data.orders) {
                            const orders = responseData.data.orders.orders;
                            totalOrders = responseData.data.orders.totalOrders;
                            // Add each order to returnData
                            if (Array.isArray(orders)) {
                                orders.forEach((order) => {
                                    returnData.push({
                                        ...order,
                                        _totalOrders: totalOrders,
                                    });
                                });
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                        }
                    }
                }
                if (resource === 'order' && operation === 'getShipments') {
                    // Get order shipment details
                    const orderId = this.getNodeParameter('orderIdShipments', i);
                    const shipmentFieldsSelected = getFieldSelection('shipmentFields');
                    // Filter out special options and separators
                    const shipmentFields = shipmentFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query orderShipmentDetails ($orders_id: Int) {
							orderShipmentDetails (orders_id: $orders_id) {
								orderShipmentDetails {
									${shipmentFields}
								}
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables: { orders_id: orderId },
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.orderShipmentDetails) {
                        const shipmentData = responseData.data.orderShipmentDetails.orderShipmentDetails;
                        // Add shipment details to returnData
                        if (Array.isArray(shipmentData) && shipmentData.length > 0) {
                            shipmentData.forEach((shipment) => {
                                returnData.push({
                                    ...shipment,
                                    _order_id: orderId,
                                });
                            });
                        }
                        else {
                            // No shipment found
                            returnData.push({
                                message: 'No shipment details found for this order',
                                order_id: orderId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'order' && operation === 'createShipment') {
                    // Create shipment for order
                    const orderId = this.getNodeParameter('orderIdCreate', i);
                    const shipmentId = this.getNodeParameter('shipmentId', i);
                    const trackingNumber = this.getNodeParameter('trackingNumber', i);
                    const packages = this.getNodeParameter('packages', i);
                    // Build package information array
                    const packageData = [];
                    if (packages && packages.package && Array.isArray(packages.package)) {
                        packages.package.forEach((pkg) => {
                            const opdata = [];
                            // Type assertion for nested orderProducts
                            const orderProducts = pkg.orderProducts;
                            if (orderProducts && orderProducts.product && Array.isArray(orderProducts.product)) {
                                orderProducts.product.forEach((product) => {
                                    opdata.push({
                                        opid: product.opid,
                                        qty: product.qty
                                    });
                                });
                            }
                            packageData.push({
                                weight: pkg.weight || 0,
                                length: pkg.length || 0,
                                width: pkg.width || 0,
                                height: pkg.height || 0,
                                tracking: pkg.tracking || trackingNumber,
                                opdata: opdata
                            });
                        });
                    }
                    // Build shipmentinfo structure
                    const shipmentinfo = [
                        {
                            packageinfo: packageData
                        }
                    ];
                    // Build the GraphQL mutation
                    const mutation = `
						mutation setShipment ($order_id: Int, $shipment_id: Int, $tracking_number: String, $shipmentinfo: JSON) {
							setShipment (order_id: $order_id, shipment_id: $shipment_id, tracking_number: $tracking_number, shipmentinfo: $shipmentinfo) {
								result
								message
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: mutation.trim(),
                        variables: {
                            order_id: orderId,
                            shipment_id: shipmentId,
                            tracking_number: trackingNumber,
                            shipmentinfo: shipmentinfo
                        },
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.setShipment) {
                        const result = responseData.data.setShipment;
                        returnData.push({
                            ...result,
                            _operation: 'createShipment',
                            _order_id: orderId,
                            _shipment_id: shipmentId,
                            _tracking_number: trackingNumber
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getSimple') {
                    // Get single product with simple fields
                    const productIdStr = this.getNodeParameter('productId', i);
                    // Validate Product ID is provided
                    if (!productIdStr || productIdStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID is required for Get Simple operation', { itemIndex: i });
                    }
                    // Convert to number for API call
                    const productId = parseInt(productIdStr, 10);
                    if (isNaN(productId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID must be a valid number', { itemIndex: i });
                    }
                    const queryParameters = this.getNodeParameter('queryParameters', i);
                    const productFieldsSelected = getFieldSelection('productFieldsSimple');
                    // Build variables object
                    const variables = {
                        products_id: productId,
                    };
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query products ($products_id: Int, $limit: Int, $offset: Int) {
							products (products_id: $products_id, limit: $limit, offset: $offset) {
								products {
									${productFields}
								}
								totalProducts
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.products) {
                        const products = responseData.data.products.products;
                        const totalProducts = responseData.data.products.totalProducts;
                        // Add each product to returnData
                        if (Array.isArray(products) && products.length > 0) {
                            products.forEach((product) => {
                                returnData.push({
                                    ...product,
                                    _totalProducts: totalProducts,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                error: 'No product found with this ID',
                                productId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManySimple') {
                    // Get many products with simple fields
                    const queryParameters = this.getNodeParameter('queryParametersManySimple', i);
                    const productFieldsSelected = getFieldSelection('productFieldsManySimple');
                    // Build variables object (no products_id for get many)
                    const variables = {};
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query (no products_id parameter)
                    const query = `
						query products ($limit: Int, $offset: Int) {
							products (limit: $limit, offset: $offset) {
								products {
									${productFields}
								}
								totalProducts
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.products) {
                        const products = responseData.data.products.products;
                        const totalProducts = responseData.data.products.totalProducts;
                        // Add each product to returnData
                        if (Array.isArray(products)) {
                            products.forEach((product) => {
                                returnData.push({
                                    ...product,
                                    _totalProducts: totalProducts,
                                });
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getDetailed') {
                    // Get single product with detailed fields
                    const productIdStr = this.getNodeParameter('productIdDetailed', i);
                    // Validate Product ID is provided
                    if (!productIdStr || productIdStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID is required for Get Detailed operation', { itemIndex: i });
                    }
                    // Convert to number for API call
                    const productId = parseInt(productIdStr, 10);
                    if (isNaN(productId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID must be a valid number', { itemIndex: i });
                    }
                    const queryParameters = this.getNodeParameter('queryParametersDetailed', i);
                    const productFieldsSelected = getFieldSelection('productFieldsDetailed');
                    const productSizeFieldsSelected = getFieldSelection('productSizeFields');
                    const productAdditionalOptionsFieldsSelected = getFieldSelection('productAdditionalOptionsFields');
                    // Build variables object
                    const variables = {
                        products_id: productId,
                    };
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    if (queryParameters.status !== undefined)
                        variables.status = queryParameters.status;
                    if (queryParameters.all_store !== undefined)
                        variables.all_store = queryParameters.all_store;
                    if (queryParameters.externalCatalogue !== undefined)
                        variables.externalCatalogue = queryParameters.externalCatalogue;
                    // Filter out special options and separators
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build nested product_size fields
                    let productSizeQuery = '';
                    const validSizeFields = productSizeFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR');
                    if (validSizeFields.length > 0) {
                        const sizeFields = validSizeFields.join('\n\t\t\t\t\t\t\t\t');
                        productSizeQuery = `
						product_size {
							${sizeFields}
						}
					`;
                    }
                    // Build nested product_additional_options fields
                    let productOptionsQuery = '';
                    const validOptionsFields = productAdditionalOptionsFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR');
                    if (validOptionsFields.length > 0) {
                        const optionsFields = validOptionsFields.join('\n\t\t\t\t\t\t\t\t');
                        productOptionsQuery = `
						product_additional_options {
							${optionsFields}
						}
					`;
                    }
                    // Build the GraphQL query with nested fields
                    const query = `
					query productsDetails ($products_id: Int, $limit: Int, $offset: Int, $status: Int, $all_store: Int, $externalCatalogue: Int) {
						products_details (products_id: $products_id, limit: $limit, offset: $offset, status: $status, all_store: $all_store, externalCatalogue: $externalCatalogue) {
							products {
								${productFields}
								${productSizeQuery}
								${productOptionsQuery}
							}
							totalProducts
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.products_details) {
                        const products = responseData.data.products_details.products;
                        const totalProducts = responseData.data.products_details.totalProducts;
                        // Add each product to returnData
                        if (Array.isArray(products) && products.length > 0) {
                            products.forEach((product) => {
                                returnData.push({
                                    ...product,
                                    _totalProducts: totalProducts,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                error: 'No product found with this ID',
                                productId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyDetailed') {
                    // Get many products with detailed fields
                    const queryParameters = this.getNodeParameter('queryParametersManyDetailed', i);
                    const fetchAllPages = this.getNodeParameter('fetchAllPages', i, false);
                    const productFieldsSelected = getFieldSelection('productFieldsManyDetailed');
                    const productSizeFieldsSelected = getFieldSelection('productSizeFields');
                    const productAdditionalOptionsFieldsSelected = getFieldSelection('productAdditionalOptionsFields');
                    const buildManyDetailedVariables = (limit, offset) => {
                        const variables = {};
                        if (limit !== undefined)
                            variables.limit = limit;
                        else if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (offset !== undefined)
                            variables.offset = offset;
                        else if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                        if (queryParameters.status !== undefined)
                            variables.status = queryParameters.status;
                        if (queryParameters.all_store !== undefined)
                            variables.all_store = queryParameters.all_store;
                        if (queryParameters.externalCatalogue !== undefined)
                            variables.externalCatalogue = queryParameters.externalCatalogue;
                        return variables;
                    };
                    // Filter out special options and separators
                    const productFields = productFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build nested product_size fields
                    let productSizeQuery = '';
                    const validSizeFields = productSizeFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR');
                    if (validSizeFields.length > 0) {
                        const sizeFields = validSizeFields.join('\n\t\t\t\t\t\t\t\t');
                        productSizeQuery = `
						product_size {
							${sizeFields}
						}
					`;
                    }
                    // Build nested product_additional_options fields
                    let productOptionsQuery = '';
                    const validOptionsFields = productAdditionalOptionsFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR');
                    if (validOptionsFields.length > 0) {
                        const optionsFields = validOptionsFields.join('\n\t\t\t\t\t\t\t\t');
                        productOptionsQuery = `
						product_additional_options {
							${optionsFields}
						}
					`;
                    }
                    // Build the GraphQL query with nested fields (no products_id parameter)
                    const query = `
					query productsDetails ($limit: Int, $offset: Int, $status: Int, $all_store: Int, $externalCatalogue: Int) {
						products_details (limit: $limit, offset: $offset, status: $status, all_store: $all_store, externalCatalogue: $externalCatalogue) {
							products {
								${productFields}
								${productSizeQuery}
								${productOptionsQuery}
							}
							totalProducts
							currentCount
						}
					}
				`;
                    const pushManyDetailedProducts = (responseData) => {
                        if (responseData && responseData.data && responseData.data.products_details) {
                            const response = (responseData.data.products_details || {});
                            const products = response.products;
                            const totalProducts = response.totalProducts;
                            const currentCount = response.currentCount;
                            if (Array.isArray(products)) {
                                for (const product of products) {
                                    returnData.push({
                                        ...product,
                                        _totalProducts: totalProducts,
                                        _currentCount: currentCount,
                                    });
                                }
                                return products.length;
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                        }
                        return 0;
                    };
                    if (fetchAllPages) {
                        let offset = Number(queryParameters.offset || 0);
                        const pageSize = Math.min(Number(queryParameters.pageSize || queryParameters.limit || 250), 250);
                        const pageDelay = Math.max(Number(queryParameters.pageDelay || 50), 25);
                        let hasMorePages = true;
                        let pageCount = 0;
                        const maxPages = 1000;
                        while (hasMorePages && pageCount < maxPages) {
                            const responseData = await requestGraphql({
                                query: query.trim(),
                                variables: buildManyDetailedVariables(pageSize, offset),
                            });
                            const count = pushManyDetailedProducts(responseData);
                            offset += pageSize;
                            pageCount++;
                            hasMorePages = count === pageSize;
                            if (hasMorePages)
                                await (0, n8n_workflow_1.sleep)(pageDelay);
                        }
                    }
                    else {
                        const responseData = await requestGraphql({
                            query: query.trim(),
                            variables: buildManyDetailedVariables(),
                        });
                        pushManyDetailedProducts(responseData);
                    }
                }
                if (resource === 'product' && operation === 'getCategory') {
                    // Get product category
                    const categoryIdStr = this.getNodeParameter('categoryId', i);
                    const queryParameters = this.getNodeParameter('queryParametersCategory', i);
                    const categoryFieldsSelected = getFieldSelection('categoryFields');
                    // Convert to number for API call
                    const categoryId = parseInt(categoryIdStr, 10);
                    if (isNaN(categoryId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Category ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        category_id: categoryId,
                    };
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const categoryFields = categoryFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query product_category ($category_id: Int, $limit: Int, $offset: Int) {
							product_category (category_id: $category_id, limit: $limit, offset: $offset) {
								product_category {
									${categoryFields}
								}
								total_product_category_size
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_category) {
                        const categories = responseData.data.product_category.product_category;
                        const totalCategories = responseData.data.product_category.total_product_category_size;
                        // Add each category to returnData
                        if (Array.isArray(categories) && categories.length > 0) {
                            categories.forEach((category) => {
                                returnData.push({
                                    ...category,
                                    _totalCategories: totalCategories,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                error: 'No category found with this ID',
                                categoryId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyCategories') {
                    // Get many product categories
                    const queryParameters = this.getNodeParameter('queryParametersManyCategories', i);
                    const categoryFieldsSelected = getFieldSelection('categoryFieldsMany');
                    // Build variables object
                    const variables = {};
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const categoryFields = categoryFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query product_category ($limit: Int, $offset: Int) {
							product_category (limit: $limit, offset: $offset) {
								product_category {
									${categoryFields}
								}
								total_product_category_size
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_category) {
                        const categories = responseData.data.product_category.product_category;
                        const totalCategories = responseData.data.product_category.total_product_category_size;
                        // Add each category to returnData
                        if (Array.isArray(categories)) {
                            categories.forEach((category) => {
                                returnData.push({
                                    ...category,
                                    _totalCategories: totalCategories,
                                });
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getStock') {
                    // Get product stock information
                    const productIdStr = this.getNodeParameter('productIdStock', i);
                    const queryParameters = this.getNodeParameter('queryParametersStock', i);
                    const stockFieldsSelected = getFieldSelection('stockFields');
                    // Convert to number for API call
                    const productId = parseInt(productIdStr, 10);
                    if (isNaN(productId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        product_id: productId,
                    };
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const stockFields = stockFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query productStocks ($product_id: Int!, $limit: Int, $offset: Int) {
							productStocks (product_id: $product_id, limit: $limit, offset: $offset) {
								productStocks {
									${stockFields}
								}
								totalProductStocks
								currentCount
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.productStocks) {
                        const stocks = responseData.data.productStocks.productStocks;
                        const totalStocks = responseData.data.productStocks.totalProductStocks;
                        const currentCount = responseData.data.productStocks.currentCount;
                        // Add each stock record to returnData
                        if (Array.isArray(stocks) && stocks.length > 0) {
                            stocks.forEach((stock) => {
                                returnData.push({
                                    ...stock,
                                    _totalStocks: totalStocks,
                                    _currentCount: currentCount,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                error: 'No stock records found for this product',
                                productId,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'updateStock') {
                    // Update product stock
                    const identifierType = this.getNodeParameter('stockIdentifierType', i);
                    const stockAction = this.getNodeParameter('stockAction', i);
                    const stockQuantity = this.getNodeParameter('stock_quantity', i);
                    const comment = this.getNodeParameter('comment', i, '');
                    // Build variables object
                    const variables = {
                        action: stockAction,
                        input: {},
                    };
                    // Set identifier (stock_id or product_sku)
                    if (identifierType === 'stock_id') {
                        const stockIdStr = this.getNodeParameter('stockId', i);
                        // Convert to number for API call
                        const stockId = parseInt(stockIdStr, 10);
                        if (isNaN(stockId)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Stock ID must be a valid number', { itemIndex: i });
                        }
                        variables.stock_id = stockId;
                    }
                    else {
                        const productSku = this.getNodeParameter('productSku', i);
                        variables.product_sku = productSku;
                    }
                    // Build input object
                    const input = {
                        stock_quantity: stockQuantity,
                        comment,
                    };
                    variables.input = input;
                    // Build the GraphQL mutation
                    const mutation = `
						mutation updateProductStock ($stock_id: Int, $product_sku: String, $action: UpdateProductStockActionEnum!, $input: UpdateProductStockInput!) {
							updateProductStock (stock_id: $stock_id, product_sku: $product_sku, action: $action, input: $input) {
								result
								message
								stock_id
								stock_quantity
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: mutation.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.updateProductStock) {
                        const result = responseData.data.updateProductStock;
                        returnData.push({
                            ...result,
                            _operation: 'updateStock',
                            _action: stockAction,
                            _identifierType: identifierType,
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                // ==================== PRODUCT: GET MASTER OPTIONS ====================
                if (resource === 'product' && operation === 'getMasterOptions') {
                    // Get product master options
                    const masterOptionIdStr = this.getNodeParameter('masterOptionId', i);
                    const selectedFields = getFieldSelection('masterOptionsFields', []);
                    // Validate Master Option ID is provided
                    if (!masterOptionIdStr || masterOptionIdStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Master Option ID is required for Get Master Options operation', { itemIndex: i });
                    }
                    // Convert to number for API call
                    const masterOptionId = parseInt(masterOptionIdStr, 10);
                    if (isNaN(masterOptionId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Master Option ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        master_option_id: masterOptionId,
                    };
                    // Build fields string from selected fields
                    const fieldsString = selectedFields.length > 0 ? selectedFields.join('\n\t\t\t\t\t\t') : 'master_option_id\ntitle\ndescription\noption_key\npricing_method\nstatus\nsort_order\noptions_type\nlinear_formula\nformula\nweight_setting\nprice_range_lookup\ncustom_lookup\nadditional_lookup_details\nhide_from_calc\nenable_assoc_qty\nallow_price_cal\nhire_designer_option\nexternal_ref\nattributes';
                    // Build the GraphQL query for product master options
                    const query = `
						query product_master_options ($master_option_id: Int!) {
							product_master_options (master_option_id: $master_option_id) {
								product_master_options {
									${fieldsString}
								}
								total_product_master_options
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_master_options) {
                        const response = responseData.data.product_master_options;
                        const masterOptions = response.product_master_options;
                        if (Array.isArray(masterOptions)) {
                            masterOptions.forEach((option) => {
                                returnData.push({
                                    ...option,
                                    _operation: 'getMasterOptions',
                                    _masterOptionId: masterOptionId,
                                    _total: response.total_product_master_options,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...masterOptions,
                                _operation: 'getMasterOptions',
                                _masterOptionId: masterOptionId,
                                _total: response.total_product_master_options,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyMasterOptions') {
                    // Get master options for many products
                    const queryParameters = this.getNodeParameter('queryParametersManyMasterOptions', i);
                    const selectedFields = getFieldSelection('masterOptionsFieldsMany', []);
                    // Build variables object
                    const variables = {};
                    if (queryParameters.master_option_id)
                        variables.master_option_id = parseInt(queryParameters.master_option_id, 10);
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Build fields string from selected fields
                    const fieldsString = selectedFields.length > 0 ? selectedFields.join('\n\t\t\t\t\t\t') : 'master_option_id\ntitle\ndescription\noption_key\npricing_method\nstatus\nsort_order\noptions_type\nlinear_formula\nformula\nweight_setting\nprice_range_lookup\ncustom_lookup\nadditional_lookup_details\nhide_from_calc\nenable_assoc_qty\nallow_price_cal\nhire_designer_option\nexternal_ref\nattributes';
                    // Build the GraphQL query for many product master options
                    const query = `
					query product_master_options ($master_option_id: Int, $limit: Int, $offset: Int) {
						product_master_options (master_option_id: $master_option_id, limit: $limit, offset: $offset) {
							product_master_options {
								${fieldsString}
							}
							total_product_master_options
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_master_options) {
                        const response = responseData.data.product_master_options;
                        const masterOptions = response.product_master_options;
                        if (Array.isArray(masterOptions)) {
                            masterOptions.forEach((option) => {
                                returnData.push({
                                    ...option,
                                    _operation: 'getManyMasterOptions',
                                    _total: response.total_product_master_options,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...masterOptions,
                                _operation: 'getManyMasterOptions',
                                _total: response.total_product_master_options,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                // ==================== PRODUCT: GET OPTIONS RULES ====================
                if (resource === 'product' && operation === 'getOptionsRules') {
                    // Get product options rules
                    const ruleIdStr = this.getNodeParameter('ruleId', i);
                    // Validate Rule ID is provided
                    if (!ruleIdStr || ruleIdStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Rule ID is required for Get Options Rules operation', { itemIndex: i });
                    }
                    // Convert to number for API call
                    const ruleId = parseInt(ruleIdStr, 10);
                    if (isNaN(ruleId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Rule ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        rule_id: ruleId,
                    };
                    // Build the GraphQL query for product options rules
                    const query = `
						query product_option_rules ($rule_id: Int!) {
							product_option_rules (rule_id: $rule_id) {
								product_option_rules {
									rule_id
									rule_name
									rule_type
									source_option_attribute_ids
									hide_option_ids
									hide_option_attribute_ids
									status
									sort_order
									comparison_value
									disabled_for_admin
								}
								total_product_option_rules
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_option_rules) {
                        const response = responseData.data.product_option_rules;
                        const optionsRules = response.product_option_rules;
                        if (Array.isArray(optionsRules)) {
                            optionsRules.forEach((rule) => {
                                returnData.push({
                                    ...rule,
                                    _operation: 'getOptionsRules',
                                    _ruleId: ruleId,
                                    _total: response.total_product_option_rules,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...optionsRules,
                                _operation: 'getOptionsRules',
                                _ruleId: ruleId,
                                _total: response.total_product_option_rules,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyOptionsRules') {
                    // Get options rules for many products
                    const queryParameters = this.getNodeParameter('queryParametersManyOptionsRules', i);
                    // Build variables object
                    const variables = {};
                    if (queryParameters.rule_id)
                        variables.rule_id = parseInt(queryParameters.rule_id, 10);
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Build the GraphQL query for many product options rules
                    const query = `
					query product_option_rules ($rule_id: Int, $limit: Int, $offset: Int) {
						product_option_rules (rule_id: $rule_id, limit: $limit, offset: $offset) {
							product_option_rules {
								rule_id
								rule_name
								rule_type
								source_option_attribute_ids
								hide_option_ids
								hide_option_attribute_ids
								status
								sort_order
								comparison_value
								disabled_for_admin
							}
							total_product_option_rules
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_option_rules) {
                        const response = responseData.data.product_option_rules;
                        const optionsRules = response.product_option_rules;
                        if (Array.isArray(optionsRules)) {
                            optionsRules.forEach((rule) => {
                                returnData.push({
                                    ...rule,
                                    _operation: 'getManyOptionsRules',
                                    _total: response.total_product_option_rules,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...optionsRules,
                                _operation: 'getManyOptionsRules',
                                _total: response.total_product_option_rules,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                // ==================== PRODUCT: GET PRICES ====================
                if (resource === 'product' && operation === 'getPrices') {
                    // Get product pricing information
                    const productUuidStr = this.getNodeParameter('productIdPrices', i);
                    // Validate Product UUID is provided
                    if (!productUuidStr || productUuidStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Product UUID is required for Get Product Prices operation', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        product_uuid: productUuidStr,
                    };
                    // Build the GraphQL query for product prices
                    const query = `
					query product_price ($product_uuid: String!) {
						product_price (product_uuid: $product_uuid) {
							product_price {
								size_id
								price
								vendor_price
								qty_from
								qty_to
								products_id
								user_type_id
								corporate_id
							}
							total_product_price
							currentCount
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_price) {
                        const response = responseData.data.product_price;
                        const productPrices = response.product_price;
                        if (Array.isArray(productPrices)) {
                            productPrices.forEach((price) => {
                                returnData.push({
                                    ...price,
                                    _operation: 'getPrices',
                                    _productUuid: productUuidStr,
                                    _total: response.total_product_price,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...productPrices,
                                _operation: 'getPrices',
                                _productUuid: productUuidStr,
                                _total: response.total_product_price,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyPrices') {
                    // Get prices for many products
                    const queryParameters = this.getNodeParameter('queryParametersManyPrices', i);
                    // Build variables object
                    const variables = {};
                    if (queryParameters.product_uuid)
                        variables.product_uuid = queryParameters.product_uuid;
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Build the GraphQL query for many product prices
                    const query = `
					query product_price ($product_uuid: String, $limit: Int, $offset: Int) {
						product_price (product_uuid: $product_uuid, limit: $limit, offset: $offset) {
							product_price {
								size_id
								price
								vendor_price
								qty_from
								qty_to
								products_id
								user_type_id
								corporate_id
							}
							total_product_price
							currentCount
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_price) {
                        const response = responseData.data.product_price;
                        const productPrices = response.product_price;
                        if (Array.isArray(productPrices)) {
                            productPrices.forEach((price) => {
                                returnData.push({
                                    ...price,
                                    _operation: 'getManyPrices',
                                    _total: response.total_product_price,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...productPrices,
                                _operation: 'getManyPrices',
                                _total: response.total_product_price,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                // ==================== PRODUCT: GET OPTION PRICES ====================
                if (resource === 'product' && operation === 'getOptionPrices') {
                    // Get product option pricing information
                    const attrIdStr = this.getNodeParameter('productIdOptionPrices', i);
                    // Validate Attribute ID is provided
                    if (!attrIdStr || attrIdStr.trim() === '') {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Attribute ID is required for Get Product Option Prices operation', { itemIndex: i });
                    }
                    // Convert to number for API call
                    const attrId = parseInt(attrIdStr, 10);
                    if (isNaN(attrId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Attribute ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        attr_id: attrId,
                    };
                    // Build the GraphQL query for product option prices
                    const query = `
						query product_options_price ($attr_id: Int!) {
							product_options_price (attr_id: $attr_id) {
									product_options_price {
										attr_id
										range_id
										price
										vendor_price
									from_range
									to_range
									site_admin_markup
								}
								total_product_option_price
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_options_price) {
                        const response = responseData.data.product_options_price;
                        const optionPrices = response.product_options_price;
                        if (Array.isArray(optionPrices)) {
                            optionPrices.forEach((price) => {
                                returnData.push({
                                    ...price,
                                    _operation: 'getOptionPrices',
                                    _attrId: attrId,
                                    _total: response.total_product_option_price,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...optionPrices,
                                _operation: 'getOptionPrices',
                                _attrId: attrId,
                                _total: response.total_product_option_price,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyOptionPrices') {
                    // Get option prices for many products
                    const queryParameters = this.getNodeParameter('queryParametersManyOptionPrices', i);
                    // Build variables object
                    const variables = {};
                    if (queryParameters.attr_id)
                        variables.attr_id = parseInt(queryParameters.attr_id, 10);
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Build the GraphQL query for many product option prices
                    const query = `
					query product_options_price ($attr_id: Int, $limit: Int, $offset: Int) {
						product_options_price (attr_id: $attr_id, limit: $limit, offset: $offset) {
								product_options_price {
									attr_id
									range_id
									price
									vendor_price
								from_range
								to_range
								site_admin_markup
							}
							total_product_option_price
						}
					}
				`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.product_options_price) {
                        const response = responseData.data.product_options_price;
                        const optionPrices = response.product_options_price;
                        if (Array.isArray(optionPrices)) {
                            optionPrices.forEach((price) => {
                                returnData.push({
                                    ...price,
                                    _operation: 'getManyOptionPrices',
                                    _total: response.total_product_option_price,
                                });
                            });
                        }
                        else {
                            returnData.push({
                                ...optionPrices,
                                _operation: 'getManyOptionPrices',
                                _total: response.total_product_option_price,
                            });
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                // ==================== PRODUCT: GET FAQS ====================
                if (resource === 'product' && operation === 'getFAQs') {
                    // Get frequently asked questions
                    const faqId = this.getNodeParameter('faqId', i);
                    const queryParameters = this.getNodeParameter('queryParametersFAQs', i);
                    const selectedFields = getFieldSelection('faqFields', []);
                    // Build variables object
                    const variables = {};
                    variables.faq_id = faqId; // Required field
                    if (queryParameters.faqcat_id)
                        variables.faqcat_id = queryParameters.faqcat_id;
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Build fields string from selected fields
                    const fieldsString = selectedFields.length > 0 ? selectedFields.join('\n\t\t\t\t\t\t') : 'faq_id\n\t\t\t\t\t\tfaqcat_id\n\t\t\t\t\t\tstatus\n\t\t\t\t\t\tsort_order\n\t\t\t\t\t\tfaq_type\n\t\t\t\t\t\tfaq_question\n\t\t\t\t\t\tfaq_answer\n\t\t\t\t\t\tfaq_category_name\n\t\t\t\t\t\tproduct_ids\n\t\t\t\t\t\tcategory_ids';
                    // Build the GraphQL query for FAQs
                    const query = `
						query faq ($faq_id: Int, $faqcat_id: Int, $limit: Int, $offset: Int) {
							faq (faq_id: $faq_id, faqcat_id: $faqcat_id, limit: $limit, offset: $offset) {
								faq {
									${fieldsString}
								}
								totalFaq
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.faq) {
                        const faqData = responseData.data.faq;
                        if (faqData && faqData.faq) {
                            const faqs = faqData.faq;
                            if (Array.isArray(faqs)) {
                                faqs.forEach((faq) => {
                                    returnData.push({
                                        ...faq,
                                        totalFaq: faqData.totalFaq,
                                        _operation: 'getFAQs',
                                    });
                                });
                            }
                            else {
                                returnData.push({
                                    ...faqs,
                                    totalFaq: faqData.totalFaq,
                                    _operation: 'getFAQs',
                                });
                            }
                        }
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'product' && operation === 'getManyFAQs') {
                    // Get many FAQs
                    const queryParameters = this.getNodeParameter('queryParametersManyFAQs', i);
                    const selectedFields = getFieldSelection('faqFieldsMany', []);
                    const fetchAllPages = this.getNodeParameter('fetchAllPagesFAQs', i, false);
                    // Build variables object
                    const variables = {};
                    if (queryParameters.faq_id)
                        variables.faq_id = queryParameters.faq_id;
                    if (queryParameters.faqcat_id)
                        variables.faqcat_id = queryParameters.faqcat_id;
                    // Set pagination parameters
                    let limit = typeof queryParameters.limit === 'number' ? queryParameters.limit : 50;
                    let offset = typeof queryParameters.offset === 'number' ? queryParameters.offset : 0;
                    if (fetchAllPages) {
                        // For fetch all pages, start with a reasonable limit and we'll loop
                        limit = 100; // Use a higher limit for efficiency
                        offset = 0;
                    }
                    else {
                        // Use user-specified limit/offset
                        if (queryParameters.limit)
                            variables.limit = queryParameters.limit;
                        if (queryParameters.offset)
                            variables.offset = queryParameters.offset;
                    }
                    // Build fields string from selected fields
                    const fieldsString = selectedFields.length > 0 ? selectedFields.join('\n\t\t\t\t\t\t') : 'faq_id\n\t\t\t\t\t\tfaqcat_id\n\t\t\t\t\t\tstatus\n\t\t\t\t\t\tsort_order\n\t\t\t\t\t\tfaq_type\n\t\t\t\t\t\tfaq_question\n\t\t\t\t\t\tfaq_answer\n\t\t\t\t\t\tfaq_category_name\n\t\t\t\t\t\tproduct_ids\n\t\t\t\t\t\tcategory_ids';
                    // Build the GraphQL query for many FAQs
                    const query = `
				query faq ($faq_id: Int, $faqcat_id: Int, $limit: Int, $offset: Int) {
					faq (faq_id: $faq_id, faqcat_id: $faqcat_id, limit: $limit, offset: $offset) {
						faq {
							${fieldsString}
						}
						totalFaq
					}
				}
			`;
                    // Handle pagination
                    let currentOffset = offset;
                    let hasMoreData = true;
                    let totalFetched = 0;
                    while (hasMoreData) {
                        // Set current pagination variables
                        const currentVariables = { ...variables };
                        if (!fetchAllPages) {
                            // For single page, use user-specified limit/offset
                            currentVariables.limit = queryParameters.limit || 50;
                            currentVariables.offset = queryParameters.offset || 0;
                        }
                        else {
                            // For fetch all pages, use our pagination variables
                            currentVariables.limit = limit;
                            currentVariables.offset = currentOffset;
                        }
                        // Make the GraphQL request
                        const responseData = await requestGraphql({
                            query: query.trim(),
                            variables: currentVariables,
                        });
                        // Handle GraphQL response
                        if (responseData && responseData.data && responseData.data.faq) {
                            const faqData = responseData.data.faq;
                            if (faqData && faqData.faq) {
                                const faqs = faqData.faq;
                                if (Array.isArray(faqs)) {
                                    faqs.forEach((faq) => {
                                        returnData.push({
                                            ...faq,
                                            totalFaq: faqData.totalFaq,
                                            _operation: 'getManyFAQs',
                                        });
                                    });
                                    totalFetched += faqs.length;
                                }
                                else {
                                    returnData.push({
                                        ...faqs,
                                        totalFaq: faqData.totalFaq,
                                        _operation: 'getManyFAQs',
                                    });
                                    totalFetched += 1;
                                }
                            }
                        }
                        else if (responseData && responseData.errors) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                        }
                        else {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                        }
                        // Check if we should continue pagination
                        if (fetchAllPages) {
                            // Continue if we got results and haven't reached the total
                            const totalFaq = typeof ((_b = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _a === void 0 ? void 0 : _a.faq) === null || _b === void 0 ? void 0 : _b.totalFaq) === 'number' ? responseData.data.faq.totalFaq : 0;
                            hasMoreData = totalFetched > 0 && totalFetched < totalFaq;
                            if (hasMoreData) {
                                currentOffset += limit;
                            }
                        }
                        else {
                            // Single page request, break after first iteration
                            hasMoreData = false;
                        }
                    }
                }
                if (resource === 'status' && operation === 'getStatus') {
                    // Get single status by ID
                    const processStatusIdStr = this.getNodeParameter('processStatusId', i);
                    const queryParameters = this.getNodeParameter('queryParametersStatus', i);
                    const statusFieldsSelected = getFieldSelection('statusFields');
                    // Convert to number for API call
                    const processStatusId = parseInt(processStatusIdStr, 10);
                    if (isNaN(processStatusId)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Process Status ID must be a valid number', { itemIndex: i });
                    }
                    // Build variables object
                    const variables = {
                        process_status_id: processStatusId,
                    };
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const statusFields = statusFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query orderStatus ($process_status_id: Int, $limit: Int, $offset: Int) {
							orderStatus (process_status_id: $process_status_id, limit: $limit, offset: $offset) {
								orderStatus {
									${statusFields}
								}
								totalOrderStatus
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response
                    if (responseData && responseData.data && responseData.data.orderStatus) {
                        const statuses = responseData.data.orderStatus.orderStatus;
                        statuses.forEach((status) => {
                            returnData.push({
                                ...status,
                                _totalStatuses: responseData.data.orderStatus.totalOrderStatus,
                                _operation: 'getStatus',
                            });
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
                if (resource === 'status' && operation === 'getManyStatus') {
                    // Get many statuses with optional filtering
                    const queryParameters = this.getNodeParameter('queryParametersManyStatus', i);
                    const statusTypeFilter = this.getNodeParameter('statusTypeFilter', i);
                    const statusFieldsSelected = getFieldSelection('statusFieldsMany');
                    // Build variables object
                    const variables = {};
                    if (queryParameters.limit)
                        variables.limit = queryParameters.limit;
                    if (queryParameters.offset)
                        variables.offset = queryParameters.offset;
                    // Filter out special options and separators
                    const statusFields = statusFieldsSelected
                        .filter(field => !field.startsWith('SELECT_ALL') && !field.startsWith('DESELECT_ALL') && field !== 'SEPARATOR')
                        .join('\n\t\t\t\t\t\t\t');
                    // Build the GraphQL query
                    const query = `
						query orderStatus ($limit: Int, $offset: Int) {
							orderStatus (limit: $limit, offset: $offset) {
								orderStatus {
									${statusFields}
								}
								totalOrderStatus
							}
						}
					`;
                    // Make the GraphQL request
                    const responseData = await requestGraphql({
                        query: query.trim(),
                        variables,
                    });
                    // Handle GraphQL response and apply post-filtering
                    if (responseData && responseData.data && responseData.data.orderStatus) {
                        let statuses = responseData.data.orderStatus.orderStatus;
                        // Apply status type filter (post-filtering)
                        if (statusTypeFilter !== 'both') {
                            const filterType = statusTypeFilter === 'order' ? 'Order' : 'Product';
                            statuses = statuses.filter((status) => {
                                return status.status_type === filterType;
                            });
                        }
                        statuses.forEach((status) => {
                            returnData.push({
                                ...status,
                                _totalStatuses: responseData.data.orderStatus.totalOrderStatus,
                                _filteredBy: statusTypeFilter,
                                _operation: 'getManyStatus',
                            });
                        });
                    }
                    else if (responseData && responseData.errors) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `GraphQL Error: ${JSON.stringify(responseData.errors)}`, { itemIndex: i });
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unexpected response format from API', { itemIndex: i });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ error: getErrorMessage(error) });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), getErrorMessage(error), { itemIndex: i });
            }
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.OnPrintShop = OnPrintShop;
