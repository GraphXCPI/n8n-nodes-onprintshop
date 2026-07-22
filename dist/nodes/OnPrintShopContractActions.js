"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendOnPrintShopDomainDescription = extendOnPrintShopDomainDescription;
exports.executeOnPrintShopContractAction = executeOnPrintShopContractAction;
const n8n_workflow_1 = require("n8n-workflow");
const OnPrintShopGraphqlRequest_1 = require("./OnPrintShopGraphqlRequest");
const intField = (displayName, name, resources, operations, required = false) => ({
    displayName,
    name,
    type: 'number',
    default: 0,
    required,
    displayOptions: { show: { resource: resources, operation: operations } },
    typeOptions: { minValue: 0, numberStepSize: 1 },
});
const stringField = (displayName, name, resources, operations, required = false, rows = 1) => ({
    displayName,
    name,
    type: 'string',
    default: '',
    required,
    displayOptions: { show: { resource: resources, operation: operations } },
    ...(rows > 1 ? { typeOptions: { rows } } : {}),
});
const paginationFields = (resource) => [
    {
        displayName: 'Limit', name: `${resource}_limit`, type: 'number', default: 50,
        displayOptions: { show: { resource: [resource], operation: ['getMany'] } },
        typeOptions: { minValue: 1, maxValue: 250, numberStepSize: 1 },
    },
    {
        displayName: 'Offset', name: `${resource}_offset`, type: 'number', default: 0,
        displayOptions: { show: { resource: [resource], operation: ['getMany'] } },
        typeOptions: { minValue: 0, numberStepSize: 1 },
    },
];
const NEW_RESOURCES = {
    onPrintShopProducts: [{ name: 'Product Image Gallery', value: 'productImage' }],
    onPrintShopProductBuilder: [
        { name: 'Product Additional Option', value: 'productAdditionalOption' },
        { name: 'Product Additional Attribute Price', value: 'productAttributePrice' },
        { name: 'Quantity Based Attribute Price', value: 'quantityAttributePrice' },
    ],
    onPrintShopCustomers: [
        { name: 'Basket', value: 'basket' },
        { name: 'Notification', value: 'notification' },
    ],
    onPrintShopStoreAdmin: [
        { name: 'Account Summary', value: 'accountSummary' },
        { name: 'Store Credit', value: 'storeCredit' },
    ],
};
const NEW_OPERATIONS = {
    productImage: [{ name: 'Get Many', value: 'getMany', action: 'Get many product gallery images' }],
    productAdditionalOption: [{ name: 'Get Many', value: 'getMany', action: 'Get many product additional options' }],
    productAttributePrice: [{ name: 'Get Many', value: 'getMany', action: 'Get many product additional attribute prices' }],
    quantityAttributePrice: [{ name: 'Get Many', value: 'getMany', action: 'Get many quantity based attribute prices' }],
    basket: [
        { name: 'Get', value: 'get', action: 'Get a user basket' },
        { name: 'Add, Update, or Remove Items', value: 'set', action: 'Add update or remove user basket items' },
    ],
    notification: [{ name: 'Send', value: 'send', action: 'Send an email or sms notification' }],
    accountSummary: [{ name: 'Get Many', value: 'getMany', action: 'Get account summary entries' }],
    storeCredit: [{ name: 'Get Many', value: 'getMany', action: 'Get store credit entries' }],
};
const queryProperties = [
    intField('Product ID', 'productAdditionalOption_productsId', ['productAdditionalOption'], ['getMany']),
    ...paginationFields('productAdditionalOption'),
    intField('Attribute ID', 'productAttributePrice_attributeId', ['productAttributePrice'], ['getMany']),
    intField('Size ID', 'productAttributePrice_sizeId', ['productAttributePrice'], ['getMany']),
    ...paginationFields('productAttributePrice'),
    intField('Attribute ID', 'quantityAttributePrice_attributeId', ['quantityAttributePrice'], ['getMany']),
    intField('Size ID', 'quantityAttributePrice_sizeId', ['quantityAttributePrice'], ['getMany']),
    ...paginationFields('quantityAttributePrice'),
    intField('Gallery Image ID', 'productImage_galleryId', ['productImage'], ['getMany']),
    intField('Product ID', 'productImage_productsId', ['productImage'], ['getMany']),
    intField('Store ID', 'productImage_corporateId', ['productImage'], ['getMany']),
    ...paginationFields('productImage'),
    intField('User ID', 'basket_userId', ['basket'], ['get', 'set'], true),
    intField('Store ID', 'accountSummary_storeId', ['accountSummary'], ['getMany']),
    ...paginationFields('accountSummary'),
    intField('Store ID', 'storeCredit_storeId', ['storeCredit'], ['getMany']),
    intField('User ID', 'storeCredit_userId', ['storeCredit'], ['getMany']),
    ...paginationFields('storeCredit'),
];
const mutationProperties = [
    {
        displayName: 'Action', name: 'basket_action', type: 'options', default: 'add', required: true,
        displayOptions: { show: { resource: ['basket'], operation: ['set'] } },
        options: [{ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }, { name: 'Update', value: 'update' }],
    },
    intField('Item Index', 'basket_itemIndex', ['basket'], ['set'], true),
    {
        displayName: 'Items', name: 'basket_items', type: 'fixedCollection', default: {},
        displayOptions: { show: { resource: ['basket'], operation: ['set'], basket_action: ['add', 'update'] } },
        typeOptions: { multipleValues: true },
        options: [{
                displayName: 'Item', name: 'item', values: [
                    { displayName: 'Cost', name: 'cost', type: 'number', default: 0 },
                    { displayName: 'Custom Product', name: 'is_custom_product', type: 'boolean', default: false },
                    { displayName: 'Customer Price', name: 'customer_price', type: 'number', default: 0 },
                    { displayName: 'Height', name: 'height', type: 'number', default: 0 },
                    { displayName: 'Job Name', name: 'job_name', type: 'string', default: '', required: true },
                    {
                        displayName: 'Options', name: 'options', type: 'fixedCollection', default: {}, typeOptions: { multipleValues: true },
                        options: [{ displayName: 'Option', name: 'option', values: [
                                    { displayName: 'Option ID or Name', name: 'key', type: 'string', default: '', required: true },
                                    { displayName: 'Attribute ID or Value', name: 'value', type: 'string', default: '', required: true },
                                ] }],
                    },
                    { displayName: 'Per Unit Weight', name: 'per_unit_weight', type: 'number', default: 0 },
                    { displayName: 'Product ID', name: 'product_id', type: 'number', default: 0, typeOptions: { minValue: 0, numberStepSize: 1 } },
                    { displayName: 'Product Name', name: 'product_name', type: 'string', default: '' },
                    { displayName: 'Product SKU', name: 'prd_sku', type: 'string', default: '' },
                    { displayName: 'Production Days', name: 'prd_days', type: 'number', default: 0, typeOptions: { minValue: 0, numberStepSize: 1 } },
                    { displayName: 'Quantity', name: 'quantity', type: 'number', default: 1, required: true, typeOptions: { minValue: 1, numberStepSize: 1 } },
                    { displayName: 'Size ID', name: 'size_id', type: 'number', default: 0, typeOptions: { minValue: 0, numberStepSize: 1 } },
                    { displayName: 'Size Title', name: 'size_title', type: 'string', default: '' },
                    { displayName: 'Template ID', name: 'template_id', type: 'number', default: 0, typeOptions: { minValue: 0, numberStepSize: 1 } },
                    { displayName: 'Width', name: 'width', type: 'number', default: 0 },
                ],
            }],
    },
    {
        displayName: 'Recipient Type', name: 'notification_userType', type: 'options', default: 'user', required: true,
        displayOptions: { show: { resource: ['notification'], operation: ['send'] } },
        options: [{ name: 'Admin', value: 'admin' }, { name: 'User', value: 'user' }, { name: 'Workflow', value: 'workflow' }],
    },
    intField('Customer ID', 'notification_customerId', ['notification'], ['send']),
    {
        displayName: 'Message Type', name: 'notification_messageType', type: 'options', default: 'email',
        displayOptions: { show: { resource: ['notification'], operation: ['send'] } },
        options: [{ name: 'Email', value: 'email' }, { name: 'SMS', value: 'sms' }],
    },
    stringField('CC', 'notification_cc', ['notification'], ['send']),
    stringField('BCC', 'notification_bcc', ['notification'], ['send']),
    stringField('Subject', 'notification_subject', ['notification'], ['send']),
    stringField('Body', 'notification_body', ['notification'], ['send'], true, 6),
    stringField('Attachments', 'notification_attachments', ['notification'], ['send']),
    intField('User ID', 'customerAddress_userId', ['customerAddress'], ['set']),
    intField('Address Book ID', 'customerAddress_addressBookId', ['customerAddress'], ['set']),
    stringField('First Name', 'customerAddress_firstName', ['customerAddress'], ['set']),
    stringField('Last Name', 'customerAddress_lastName', ['customerAddress'], ['set']),
    stringField('Company Name', 'customerAddress_companyName', ['customerAddress'], ['set']),
    stringField('Street Address', 'customerAddress_streetAddress', ['customerAddress'], ['set']),
    stringField('Address Line 2', 'customerAddress_suburb', ['customerAddress'], ['set']),
    stringField('Postcode', 'customerAddress_postcode', ['customerAddress'], ['set']),
    stringField('City', 'customerAddress_city', ['customerAddress'], ['set']),
    stringField('State', 'customerAddress_state', ['customerAddress'], ['set']),
    stringField('Country ID', 'customerAddress_country', ['customerAddress'], ['set']),
    stringField('Phone Number', 'customerAddress_phoneNumber', ['customerAddress'], ['set']),
    { displayName: 'Delete', name: 'customerAddress_delete', type: 'boolean', default: false, displayOptions: { show: { resource: ['customerAddress'], operation: ['set'] } } },
    intField('FAQ ID', 'faq_faqId', ['faq'], ['set']),
    intField('FAQ Category ID', 'faq_categoryId', ['faq'], ['set'], true),
    intField('Store ID', 'faq_corporateId', ['faq'], ['set']),
    { displayName: 'Status', name: 'faq_status', type: 'options', default: '1', displayOptions: { show: { resource: ['faq'], operation: ['set'] } }, options: [{ name: 'Active', value: '1' }, { name: 'Inactive', value: '0' }] },
    intField('Sort Order', 'faq_sortOrder', ['faq'], ['set']),
    { displayName: 'FAQ Type', name: 'faq_type', type: 'options', default: 'G', displayOptions: { show: { resource: ['faq'], operation: ['set'] } }, options: [{ name: 'General', value: 'G' }, { name: 'Product', value: 'P' }] },
    stringField('Product Category IDs', 'faq_productCategoryIds', ['faq'], ['set']),
    stringField('Question', 'faq_question', ['faq'], ['set'], true),
    stringField('Answer', 'faq_answer', ['faq'], ['set'], true, 6),
];
function operationProperty(resource, options) {
    const property = {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        default: 'getMany',
        displayOptions: { show: { resource: [resource] } },
        options,
    };
    if (resource === 'basket')
        property.default = 'get';
    if (resource === 'notification')
        property.default = 'send';
    return property;
}
function operationAppliesTo(property, resource) {
    var _a;
    const show = (_a = property.displayOptions) === null || _a === void 0 ? void 0 : _a.show;
    return Array.isArray(show === null || show === void 0 ? void 0 : show.resource) && show.resource.includes(resource);
}
function extendOnPrintShopDomainDescription(description, domainName) {
    const domain = domainName;
    const resources = NEW_RESOURCES[domain] || [];
    if (!resources.length && domain !== 'onPrintShopCustomers' && domain !== 'onPrintShopStoreAdmin')
        return description;
    const resourceProperty = description.properties.find((property) => property.name === 'resource');
    if (resourceProperty && Array.isArray(resourceProperty.options)) {
        resourceProperty.options.push(...resources);
    }
    for (const resource of resources)
        description.properties.push(operationProperty(resource.value, NEW_OPERATIONS[resource.value]));
    if (domain === 'onPrintShopCustomers') {
        const addressOperation = description.properties.find((property) => property.name === 'operation' && operationAppliesTo(property, 'customerAddress'));
        if (addressOperation && Array.isArray(addressOperation.options))
            addressOperation.options.push({ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete a customer address' });
    }
    if (domain === 'onPrintShopStoreAdmin') {
        const faqOperation = description.properties.find((property) => property.name === 'operation' && operationAppliesTo(property, 'faq'));
        if (faqOperation && Array.isArray(faqOperation.options))
            faqOperation.options.push({ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete an faq' });
    }
    description.properties.push(...queryProperties, ...mutationProperties);
    return description;
}
function optionalInt(context, name, itemIndex) {
    const value = context.getNodeParameter(name, itemIndex, 0);
    return value || undefined;
}
function pageVariables(context, resource, itemIndex) {
    return { limit: context.getNodeParameter(`${resource}_limit`, itemIndex), offset: context.getNodeParameter(`${resource}_offset`, itemIndex) };
}
async function executeOnPrintShopContractAction(context) {
    const resource = context.getNodeParameter('resource', 0);
    const operation = context.getNodeParameter('operation', 0);
    const supported = new Set([
        'productImage.getMany', 'productAdditionalOption.getMany', 'productAttributePrice.getMany', 'quantityAttributePrice.getMany',
        'basket.get', 'basket.set', 'notification.send', 'customerAddress.set', 'accountSummary.getMany', 'storeCredit.getMany', 'faq.set',
    ]);
    if (!supported.has(`${resource}.${operation}`))
        return null;
    const request = await (0, OnPrintShopGraphqlRequest_1.createOnPrintShopGraphqlClient)(context);
    const output = [];
    for (let itemIndex = 0; itemIndex < context.getInputData().length; itemIndex++) {
        try {
            let data;
            let result;
            if (resource === 'productAdditionalOption') {
                const variables = (0, OnPrintShopGraphqlRequest_1.compactObject)({ products_id: optionalInt(context, 'productAdditionalOption_productsId', itemIndex), ...pageVariables(context, resource, itemIndex) });
                data = await request('query productAdditionalOptions($products_id: Int, $limit: Int, $offset: Int) { productAdditionalOptions(products_id: $products_id, limit: $limit, offset: $offset) { productAdditionalOptions { prod_add_opt_id title description options_type sort_order status apply_multiplication applicable_for required price_calculate_type hire_designer_option option_key master_option_id attributes } totalProductAdditionalOptions currentCount } }', variables, itemIndex);
                result = data.productAdditionalOptions;
            }
            else if (resource === 'productAttributePrice' || resource === 'quantityAttributePrice') {
                const prefix = resource;
                const variables = (0, OnPrintShopGraphqlRequest_1.compactObject)({ attribute_id: optionalInt(context, `${prefix}_attributeId`, itemIndex), size_id: optionalInt(context, `${prefix}_sizeId`, itemIndex), ...pageVariables(context, resource, itemIndex) });
                if (resource === 'productAttributePrice') {
                    data = await request('query productsAttributePrice($attribute_id: Int, $size_id: Int, $limit: Int, $offset: Int) { productsAttributePrice(attribute_id: $attribute_id, size_id: $size_id, limit: $limit, offset: $offset) { productsAttributePrice { attribute_price_id attribute_id size_id quantity quantity_to attributes_price extra_page_price } totalProductsAttributePrice currentCount } }', variables, itemIndex);
                    result = data.productsAttributePrice;
                }
                else {
                    data = await request('query products_attribute_price($attribute_id: Int, $size_id: Int, $limit: Int, $offset: Int) { products_attribute_price(attribute_id: $attribute_id, size_id: $size_id, limit: $limit, offset: $offset) { products_attribute_price { attribute_price_id attribute_id size_id quantity quantity_to attributes_price extra_page_price } total_products_attribute_price currentCount } }', variables, itemIndex);
                    result = data.products_attribute_price;
                }
            }
            else if (resource === 'productImage') {
                const variables = (0, OnPrintShopGraphqlRequest_1.compactObject)({ products_image_gallery_id: optionalInt(context, 'productImage_galleryId', itemIndex), products_id: optionalInt(context, 'productImage_productsId', itemIndex), corporate_id: optionalInt(context, 'productImage_corporateId', itemIndex), ...pageVariables(context, resource, itemIndex) });
                data = await request('query productsImageGallery($products_image_gallery_id: Int, $products_id: Int, $corporate_id: Int, $limit: Int, $offset: Int) { productsImageGallery(products_image_gallery_id: $products_image_gallery_id, products_id: $products_id, corporate_id: $corporate_id, limit: $limit, offset: $offset) { productsImageGallery { products_image_gallery_id products_id corporate_id title products_thumb_image_name products_large_image_name option_id attribute_id option_ids attribute_ids sort_order status } totalProductsImageGallery currentCount } }', variables, itemIndex);
                result = data.productsImageGallery;
            }
            else if (resource === 'basket' && operation === 'get') {
                data = await request('query getUserBasket($user_id: Int!) { getUserBasket(user_id: $user_id) { baskets { basket_id user_id cart_detail cart_count date } totalBaskets } }', { user_id: context.getNodeParameter('basket_userId', itemIndex) }, itemIndex);
                result = data.getUserBasket;
            }
            else if (resource === 'basket') {
                const action = context.getNodeParameter('basket_action', itemIndex);
                const items = (0, OnPrintShopGraphqlRequest_1.rowsFromFixedCollection)(context.getNodeParameter('basket_items', itemIndex, {}), 'item').map((item) => {
                    const options = (0, OnPrintShopGraphqlRequest_1.rowsFromFixedCollection)(item.options, 'option');
                    return (0, OnPrintShopGraphqlRequest_1.compactObject)({ ...item, options: options.length ? options.map((entry) => ({ [String(entry.key)]: entry.value })) : undefined });
                });
                data = await request('mutation setUserBasket($user_id: Int!, $action: String!, $item_index: Int!, $input: SetUserBasketInput!) { setUserBasket(user_id: $user_id, action: $action, item_index: $item_index, input: $input) { result message id } }', { user_id: context.getNodeParameter('basket_userId', itemIndex), action, item_index: context.getNodeParameter('basket_itemIndex', itemIndex), input: { items } }, itemIndex);
                result = data.setUserBasket;
            }
            else if (resource === 'notification') {
                const input = (0, OnPrintShopGraphqlRequest_1.compactObject)({ cc: context.getNodeParameter('notification_cc', itemIndex), bcc: context.getNodeParameter('notification_bcc', itemIndex), subject: context.getNodeParameter('notification_subject', itemIndex), body: context.getNodeParameter('notification_body', itemIndex), attachments: context.getNodeParameter('notification_attachments', itemIndex), msg_type: context.getNodeParameter('notification_messageType', itemIndex) });
                data = await request('mutation notifyUser($usertype: UserNotifyTypeEnum!, $cust_id: Int, $input: UserNotifyInput!) { notifyUser(cust_id: $cust_id, usertype: $usertype, input: $input) { result message id } }', { usertype: context.getNodeParameter('notification_userType', itemIndex), cust_id: optionalInt(context, 'notification_customerId', itemIndex), input }, itemIndex);
                result = data.notifyUser;
            }
            else if (resource === 'customerAddress') {
                const input = (0, OnPrintShopGraphqlRequest_1.compactObject)({ user_id: optionalInt(context, 'customerAddress_userId', itemIndex), address_book_id: optionalInt(context, 'customerAddress_addressBookId', itemIndex), firstname: context.getNodeParameter('customerAddress_firstName', itemIndex), lastname: context.getNodeParameter('customerAddress_lastName', itemIndex), companyname: context.getNodeParameter('customerAddress_companyName', itemIndex), street_address: context.getNodeParameter('customerAddress_streetAddress', itemIndex), suburb: context.getNodeParameter('customerAddress_suburb', itemIndex), postcode: context.getNodeParameter('customerAddress_postcode', itemIndex), city: context.getNodeParameter('customerAddress_city', itemIndex), state: context.getNodeParameter('customerAddress_state', itemIndex), country: context.getNodeParameter('customerAddress_country', itemIndex), phone_number: context.getNodeParameter('customerAddress_phoneNumber', itemIndex), delete: context.getNodeParameter('customerAddress_delete', itemIndex) ? 1 : undefined });
                data = await request('mutation setCustomerAddressDetail($input: CustomerAddressInput!) { setCustomerAddressDetail(input: $input) { result message id } }', { input }, itemIndex);
                result = data.setCustomerAddressDetail;
            }
            else if (resource === 'accountSummary') {
                const variables = (0, OnPrintShopGraphqlRequest_1.compactObject)({ storeid: optionalInt(context, 'accountSummary_storeId', itemIndex), ...pageVariables(context, resource, itemIndex) });
                data = await request('query accountSummary($storeid: Int, $limit: Int, $offset: Int) { accountSummary(storeid: $storeid, limit: $limit, offset: $offset) { accountSummary { storeid department_id amount type comments paymethod duedate term_title date_added } totalAccountSummary remainingInvoiceAmount remainingPaidLimit currentCount } }', variables, itemIndex);
                result = data.accountSummary;
            }
            else if (resource === 'storeCredit') {
                const variables = (0, OnPrintShopGraphqlRequest_1.compactObject)({ storeid: optionalInt(context, 'storeCredit_storeId', itemIndex), user_id: optionalInt(context, 'storeCredit_userId', itemIndex), ...pageVariables(context, resource, itemIndex) });
                data = await request('query storeCreditSummary($storeid: Int, $user_id: Int, $limit: Int, $offset: Int) { storeCreditSummary(storeid: $storeid, user_id: $user_id, limit: $limit, offset: $offset) { storeCreditSummary { user_id storeid customer_name store_name tran_type transaction_msg order_id transaction_date_time maintain_by comments } totalStoreCreditSummary remainingCredit currentCount } }', variables, itemIndex);
                result = data.storeCreditSummary;
            }
            else {
                const input = (0, OnPrintShopGraphqlRequest_1.compactObject)({ faq_id: optionalInt(context, 'faq_faqId', itemIndex), faqcat_id: context.getNodeParameter('faq_categoryId', itemIndex), corporate_id: optionalInt(context, 'faq_corporateId', itemIndex), status: context.getNodeParameter('faq_status', itemIndex), sort_order: context.getNodeParameter('faq_sortOrder', itemIndex), faq_type: context.getNodeParameter('faq_type', itemIndex), product_category_ids: context.getNodeParameter('faq_productCategoryIds', itemIndex), faq_question: context.getNodeParameter('faq_question', itemIndex), faq_answer: context.getNodeParameter('faq_answer', itemIndex) });
                data = await request('mutation setFaq($input: FaqInput!) { setFaq(input: $input) { result message id } }', { input }, itemIndex);
                result = data.setFaq;
            }
            if (result === undefined)
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), `OnPrintShop response did not include ${resource}`, { itemIndex });
            output.push(...(0, OnPrintShopGraphqlRequest_1.resultItems)(result).map((entry) => ({ ...entry, pairedItem: { item: itemIndex } })));
        }
        catch (error) {
            if (context.continueOnFail())
                output.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
            else
                throw new n8n_workflow_1.NodeOperationError(context.getNode(), error, { itemIndex });
        }
    }
    return [output];
}
