#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const g = require('graphql');
const root = path.resolve(__dirname, '..');
const schema = g.buildSchema(fs.readFileSync(path.join(root, 'contracts/ops-schema.graphql'), 'utf8'));

// Explicit ownership is audited: a new root cannot silently fall into raw GraphQL.
const domains = {
  onPrintShopProducts: 'attributes productAdditionalOptions productCategory productMasterOptions productOptionRules productOptionsPrice productPrice productSize products productsDetails productsImageGallery getProductSkuMatrix productsAttributePrice quantityBasedAttributePrice',
  onPrintShopProductBuilder: 'setAdditionalOption setAdditionalOptionAttributes setAssignOptions setCustomFormula setMasterOption setMasterOptionAttributePrice setMasterOptionAttributes setMasterOptionRange setMasterOptionTag setOptionGroup setProduct setProductCategory setProductOptionRules setProductPages setProductPrice setProductSize setProductSku setProductsAttributePrice setProductsImageGallery setQuantityBasedAttributePrice getCustomFormula getMasterOptionRange getMasterOptionTag getOptionGroup',
  onPrintShopInventory: 'productStocks addMasterOptionStockConfig deleteMasterOptionStockConfig getMasterOptionCombinationMatrix getMasterOptionStockConfigs getMasterOptionStockHistory setMasterOptionStockSettings updateMasterOptionStock updateProductStock',
  onPrintShopOrders: 'getBatch getQuote orderBillingDetails orderBlindDetails orderDeliveryDetails orderProducts orderShipmentDetails orderStatus orderSummary orders quoteproduct shipToMultipleAddress modifyOrderProduct setBatch setBatchJob setOrder setOrderProduct setOrderProductImage setOrderProductImageFromUrl setProductDesign setQuote setShipment updateOrderStatus',
  onPrintShopCustomers: 'authenticateCustomer customerAddressDetails customers getUserBasket validateCustomerToken notifyUser setCustomer setCustomerAddressDetail setUserBasket',
  onPrintShopStoreAdmin: 'accountSummary adminExtraFieldValues adminExtraFields faq getCountries getDepartments getFaqCategory getPaymentTermMaster getStore getStoreLocations getStoreMarkup storeCreditSummary storeaddress setAdminExtraField setAdminExtraFieldValues setDepartment setFaq setFaqCategory setStore setStoreAddress setStoreLocation setStoreMarkup',
};
const owners = {};
for (const [domain, names] of Object.entries(domains)) for (const name of names.split(' ')) {
  if (owners[name]) throw new Error(`Duplicate owner: ${name}`);
  owners[name] = domain;
}
function selection(type, prefix = '', ancestry = [], nestedArgs = {}) {
  const named = g.getNamedType(type);
  if (g.isLeafType(named)) return [prefix];
  if (!g.isObjectType(named) || ancestry.includes(named.name)) throw new Error(`Unmodeled output type: ${named.name}`);
  return Object.values(named.getFields()).flatMap(field => {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    if (field.args.length) nestedArgs[fieldPath] = Object.fromEntries(field.args.map(a => [a.name, String(a.type)]));
    return selection(field.type, fieldPath, [...ancestry, named.name], nestedArgs);
  });
}
const operations = [];
for (const [kind, type] of [['query', schema.getQueryType()], ['mutation', schema.getMutationType()]]) {
  for (const field of Object.values(type.getFields())) {
    if (!owners[field.name]) throw new Error(`Missing UI owner: ${field.name}`);
    const nestedArgs = {};
    const returns = selection(field.type, '', [], nestedArgs);
    operations.push({ name: field.name, kind, domain: owners[field.name], args: Object.fromEntries(field.args.map(a => [a.name, String(a.type)])), nestedArgs, returns, scalar: g.isLeafType(g.getNamedType(field.type)) });
  }
}
for (const name of Object.keys(owners)) if (!operations.some(o => o.name === name)) throw new Error(`Stale ownership: ${name}`);
fs.writeFileSync(path.join(root, 'nodes/OnPrintShopCompleteApi.json'), JSON.stringify(operations, null, 2) + '\n');
const doc = [
  '# Complete API Controls', '',
  'Generated from the checked-in GraphQL schema. Regenerate with `node scripts/generate-complete-api.js`.', '',
  '## Usage and compatibility', '',
  'In an OnPrintShop domain node, choose **Complete API**, then the named operation. These are native, typed n8n controls, not a raw GraphQL editor. The all-in-one node also exposes the full catalog. Existing resource values, operation values, parameter names, and output behavior are retained for saved workflows.', '',
  '**Fields** mode supplies named arguments, enums, numbers, booleans and repeatable nested records. Optional parameters are added explicitly so omitted values remain omitted; zero, false and empty strings are not silently discarded. **JSON Object** mode accepts an arguments object for expressions and bulk input, including explicit nulls. Every typed input is validated before authentication or sending.', '',
  'The API defines some payloads as opaque JSON scalars. Those fields retain a JSON control because GraphQL provides no subfield contract; this does not imply their business rules or every JSON shape has been validated. Existing specialized controls remain available for documented JSON payloads such as URL-upload files.', '',
  'Return Fields Mode supports All Fields or Custom Selection. Nested selections use their complete field path. Nested return-field arguments have separate parameter controls. Outputs preserve the API root envelope, counts, arrays and nulls, with one output item per input item. This differs from some older convenience actions that flatten rows; adjust downstream expressions only when deliberately moving to Complete API.', '',
  'Safe Mode blocks every mutation. Operations using customer passwords or tokens have masked input controls. Remote errors never copy the request or response payload into execution errors.', '',
  'Mutation Partial Response Handling defaults to Fail. Return Available Results is an explicit compatibility option for workflows that previously consumed a non-null mutation result alongside GraphQL errors. It does not turn failed result rows into successes: inspect every result and reconcile partial writes. Missing mutation data still fails, and queries never use this option.', '',
  'Pagination is opt-in for customers, productsDetails, orders and getStore. Off preserves a single request. All retrieves the available records from the configured offset; Limit stops at the configured maximum record count. Page size, delay and maximum pages are bounded controls. Pagination rejects repeated pages and inconsistent counts instead of silently returning an incomplete result. Paginated output includes `_pagination` with pages, pageSize and totalRecords.', '',
  'Continue-on-fail remote errors include a safe errorCode and retryable classification. DATA_NOT_FOUND, OPS_AUTH, OPS_PERMISSION, OPS_SCHEMA, OPS_VALIDATION, OPS_TRANSPORT and OPS_UNKNOWN are distinguished without copying upstream payloads. Mutation errors never advertise retryable: true because the write outcome may be unknown; reconcile remote state before retrying.', '',
  '## Verification boundary', '',
  'The verification suite compares the complete root inventory with the schema, checks every argument control and nested typed input, compares Fields and JSON request payloads, validates every individual return-field selection, and tests multi-item output, required-field errors, Safe Mode, and continue-on-fail. It is a contract and mocked execution test, not permission to claim successful live writes.', '',
  'Read-only introspection on 2026-09-12 observed 52 queries and 49 mutations on live, and 52 queries and 48 mutations on staging. Staging lacked `setBatchJob`. URL upload mutations were present on both. Environment availability must be rechecked before use; no fallback to another credential or host occurs.', '',
  '## Inventory', '',
  `The contract contains ${operations.length} roots (${operations.filter(o=>o.kind==='query').length} queries and ${operations.filter(o=>o.kind==='mutation').length} mutations).`, '',
  '| Domain node | Kind | Operation | Arguments | Return leaf paths |',
  '| --- | --- | --- | --- | --- |',
  ...operations.map(o => `| ${o.domain} | ${o.kind} | \`${o.name}\` | ${Object.entries(o.args).map(([name,type])=>`\`${name}: ${type}\``).join(', ') || 'None'} | ${o.returns.length} |`), '',
  '## Previously uncovered roots', '',
  '`adminExtraFieldValues`, `attributes`, `authenticateCustomer`, `orderBillingDetails`, `orderBlindDetails`, `orderDeliveryDetails`, `orderProducts`, `orderSummary`, `productSize`, `validateCustomerToken`, `setAdminExtraFieldValues`, and `setBatchJob` now have structured controls in their owning domain nodes.', '',
];
fs.writeFileSync(path.join(root, 'docs/COMPLETE_API_CONTROLS.md'), doc.join('\n'));
console.log(`Generated typed controls contract for ${operations.length} API operations`);
