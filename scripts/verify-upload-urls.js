const assert = require('node:assert/strict');
const { OnPrintShop } = require('../dist/nodes/OnPrintShop/OnPrintShop.node');
const { OnPrintShopOrders } = require('../dist/nodes/OnPrintShopOrders/OnPrintShopOrders.node');
const { OnPrintShopMasterOptions } = require('../dist/nodes/OnPrintShopMasterOptions/OnPrintShopMasterOptions.node');
const { OnPrintShopStoreAdmin } = require('../dist/nodes/OnPrintShopStoreAdmin/OnPrintShopStoreAdmin.node');
const { readUploadInput, readOrderUrlInput } = require('../dist/nodes/OnPrintShopUploadInputs');
const schema = require('../nodes/OnPrintShopInputTypes.json');
const g = require('graphql');
const fs = require('fs');
const liveSchema = g.buildSchema(fs.readFileSync('contracts/ops-schema.graphql', 'utf8'));
const url = 'https://example.invalid/image.png';
const cases = [
  ['setProduct', 'setProduct', { products_id: 1, image_url: url, product_desc_image_url: url }],
  ['setProductCategory', 'setProductCategory', { category_id: 1, category_image_url: url, category_icon_url: url }],
  ['setProductSize', 'setProductSize', { size_id: 1, size_image_url: url }],
  ['setMasterOptionAttributes', 'setMasterOptionAttributes', { master_attribute_id: 1, attributes_image_url: url }],
  ['setAdditionalOptionAttributes', 'setAdditionalOptionAttributes', { attribute_id: 1, attributes_image_url: url }],
  ['setProductImage', 'setProductsImageGallery', { products_image_gallery_id: 1, image_url: url, product_desc_image_type: '3' }],
];
function context(params, root, requests) {
  return {
    getInputData: () => [{ json: {} }],
    getNodeParameter: (name, i, fallback) => params[name] ?? fallback,
    getCredentials: async () => ({ baseUrl: 'https://example.invalid', tokenUrl: 'https://example.invalid/token', clientId: 'test', clientSecret: 'test' }),
    getNode: () => ({ name: 'URL test', type: 'n8n-nodes-onprintshop.onPrintShop', typeVersion: 1, parameters: {}, position: [0,0] }),
    continueOnFail: () => false,
    helpers: { returnJsonArray: rows => rows.map(json => ({ json })), httpRequest: async options => {
      if (options.url.endsWith('/token')) return { access_token: 'test', expires_in: 3600 };
      const body = options.body;
      assert.deepEqual(g.validate(liveSchema, g.parse(body.query)), []);
      assert.equal(g.getVariableValues(liveSchema, g.parse(body.query).definitions[0].variableDefinitions, body.variables).errors, undefined);
      requests.push(body);
      return { data: { [root]: { result: true, message: 'ok', id: 1 } } };
    } },
  };
}
(async () => {
  const properties = new OnPrintShop().description.properties;
  const nested = { sizes: '[{"size_title":"A"}]', pages: '[]', admin_extra_fields: '[{"field_key":"test","field_value":"test"}]' };
  const nestedParams = { setProduct_inputMode: 'fields', setProduct_entries: { entry: [{ fields: nested }] } };
  assert.deepEqual(JSON.parse(readUploadInput(context(nestedParams, '', []), 'setProduct', 0))[0].sizes, [{ size_title: 'A' }]);
  assert.equal(nested.sizes, '[{"size_title":"A"}]');
  for (const [op, root, fields] of cases) {
    const entries = [{ fields }, { fields: { ...fields } }];
    const params = { resource: 'mutation', operation: op, [`${op}_inputMode`]: 'fields', [`${op}_entries`]: { entry: entries }, setProductImage_products_id: 1, setProductImage_optimizeimg: 0 };
    const requests = [];
    await new OnPrintShop().execute.call(context(params, root, requests));
    assert.equal(requests.length, 1);
    const rows = requests[0].variables.inputs || requests[0].variables.input.image_arr;
    assert.deepEqual(rows, [fields, fields]);
    const ui = properties.find(p => p.name === `${op}_entries`).options[0].values[0].options;
    for (const key of Object.keys(fields)) assert.ok(ui.some(p => p.name === key), `${op}.${key} UI missing`);
    params[`${op}_inputMode`] = 'json';
    const old = op === 'setProductImage' ? { image_arr: [{ products_large_image_name: 'existing.png' }] } : [{ attributes_image: 'existing.png' }];
    params[`${op}_input`] = old;
    assert.deepEqual(JSON.parse(readUploadInput(context(params, root, []), op, 0)), old);
  }
  const files = [{ pagename: 'Front', file_url: url }, { pagename: 'Back', file_url: url, ziflow_link: 'https://example.invalid/proof' }];
  for (const mode of ['fields', 'json']) {
    const params = { resource: 'mutation', operation: 'setOrderProductImageFromUrl', urlUploadOrderProductId: 1, urlUploadInputMode: mode, urlUploadFiles: { file: files }, urlUploadJson: { imagefiles: files }, urlUploadOptions: { ask_for_approval: 0 } };
    const requests = [];
    await new OnPrintShopOrders().execute.call(context(params, 'setOrderProductImageFromUrl', requests));
    assert.deepEqual(requests[0].variables.input.imagefiles, files);
    assert.equal(requests[0].variables.ask_for_approval, 0);
  }
  for (const value of ['not json', { imagefiles: [] }, { imagefiles: [{ file_url: 'private-value' }] }]) {
    assert.throws(() => readOrderUrlInput(context({ urlUploadInputMode: 'json', urlUploadJson: value }, '', []), 0), error => !String(error).includes('private-value'));
  }
  assert.equal(schema.StoreLocationInput.site_logo_url, 'String');
  for (const [Node, resource, collection, modeKey, root, row] of [
    [OnPrintShopMasterOptions, 'attribute', 'attributes', 'attributeInputMode', 'setMasterOptionAttributes', { master_option_id: 1, label: 'A', attributes_image_url: url }],
    [OnPrintShopStoreAdmin, 'storeLocation', 'storeLocation_inputs', 'storeLocation_inputMode', 'setStoreLocation', { store_location_id: 1, site_logo_url: url }],
  ]) {
    const requests = [];
    const params = { resource, operation: 'set', [modeKey]: 'form', [collection]: { item: [row, row] } };
    await new Node().execute.call(context(params, root, requests));
    assert.deepEqual(requests[0].variables.inputs, [row, row]);
    const ui = new Node().description.properties.find(p => p.name === collection).options[0].values;
    assert.ok(ui.some(p => p.name.endsWith('_url')));
  }
  console.log('URL upload tests passed: six legacy form/JSON pairs, URL order forms/JSON, two-file batches, schema validation, safe invalid-input errors.');
})().catch(error => { console.error(error); process.exitCode = 1; });
