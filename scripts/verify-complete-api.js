#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('fs');
const g = require('graphql');
const catalog = require('../nodes/OnPrintShopCompleteApi.json');
const { buildCompleteRequest, executeCompleteApi } = require('../dist/nodes/OnPrintShopCompleteApi');
const { OnPrintShop } = require('../dist/nodes/OnPrintShop/OnPrintShop.node');
const schema = g.buildSchema(fs.readFileSync(require.resolve('../contracts/ops-schema.graphql'), 'utf8'));
const types = require('../nodes/OnPrintShopInputTypes.json');
const enums = require('../nodes/OnPrintShopEnumTypes.json');
const base = t => t.replace(/!$/, '');
function sample(type, form, key = '') {
  type = base(type);
  if (type.startsWith('[')) {
    const member = type.slice(1, -1);
    const rows = [0, 1].map(() => types[base(member)] ? objectSample(types[base(member)], form) : form ? { value: sample(member, true, key) } : sample(member, false, key));
    return form ? { item: rows } : rows;
  }
  if (types[type]) return form ? { value: objectSample(types[type], true) } : objectSample(types[type], false);
  if (enums[type]) return enums[type][0];
  if (type === 'Int' || type === 'Float') return 0;
  if (type === 'Boolean') return false;
  if (type === 'JSON') return form ? '[{"example":true}]' : [{ example: true }];
  return /password|token/.test(key) ? 'test-secret-do-not-echo' : '';
}
function objectSample(fields, form) {
  if (!form) return Object.fromEntries(Object.entries(fields).map(([k, t]) => [k, sample(t, false, k)]));
  const obj = { _optional: {} };
  for (const [k, t] of Object.entries(fields)) (t.endsWith('!') ? obj : obj._optional)[k] = sample(t, true, k);
  return obj;
}
function controls(fields, properties, path = '') {
  for (const [name, type] of Object.entries(fields)) {
    const p = properties.find(p => p.name === name);
    assert(p, `Missing UI ${path}.${name}`);
    const t = base(type);
    if (enums[t]) assert.deepEqual(p.options.map(o => o.value), enums[t]);
    const member = t.startsWith('[') ? base(t.slice(1, -1)) : t;
    if (types[member]) {
      assert.equal(p.type, 'fixedCollection');
      const values = p.options[0].values;
      controls(types[member], [...values.filter(v => v.name !== '_optional'), ...(values.find(v => v.name === '_optional')?.options || [])], `${path}.${name}`);
    }
  }
}
function context(params, requests = [], failRequest = false) {
  return {
    getNodeParameter(name, index, fallback) { assert(name in params || fallback !== undefined, `Missing parameter ${name}`); return name in params ? params[name] : fallback; },
    getInputData: () => [{ json: {} }, { json: {} }],
    getNode: () => ({ name: 'Test', type: 'n8n-nodes-onprintshop.onPrintShop', parameters: params }),
    continueOnFail: () => false,
    getCredentials: async () => ({ baseUrl: 'https://example.invalid', tokenUrl: 'https://example.invalid/token', clientId: 'test', clientSecret: 'test' }),
    helpers: { httpRequest: async options => {
      if (options.url.endsWith('/token')) return { access_token: 'fixture-token', expires_in: 3600 };
      assert.equal(options.url, 'https://example.invalid/api/');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer fixture-token');
      requests.push(options.body);
      if (failRequest) throw new Error('test-secret-do-not-echo');
      const name = g.parse(options.body.query).definitions[0].selectionSet.selections[0].name.value;
      return { data: { [name]: catalog.find(o => o.name === name).scalar ? 'fixture-scalar' : { records: [{ id: 1 }, { id: 2 }], total: 2, nullable: null } } };
    } },
  };
}
async function main() {
  const description = new OnPrintShop().description;
  const roots = ['query', 'mutation'].flatMap(kind => Object.values((kind === 'query' ? schema.getQueryType() : schema.getMutationType()).getFields()).map(field => `${kind}:${field.name}`));
  assert.deepEqual(catalog.map(o => `${o.kind}:${o.name}`).sort(), roots.sort());
  for (const type of Object.values(schema.getTypeMap())) {
    if (g.isInputObjectType(type)) assert.deepEqual(types[type.name], Object.fromEntries(Object.values(type.getFields()).map(f => [f.name, String(f.type)])), `Stale input contract: ${type.name}`);
    if (g.isEnumType(type) && !type.name.startsWith('__')) assert.deepEqual([...enums[type.name]].sort(), type.getValues().map(v => v.name).sort(), `Stale enum: ${type.name}`);
  }
  let fieldsCount = 0, pathsCount = 0;
  for (const op of catalog) {
    const ownerClass = Object.values(require(`../dist/nodes/${op.domain.replace(/^on/, 'On')}/${op.domain.replace(/^on/, 'On')}.node.js`))[0];
    const owner = new ownerClass().description;
    assert(owner.properties.find(p => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('apiContract')).options.some(o => o.value === op.name), `Missing domain action ${op.name}`);
    const properties = description.properties.filter(p => p.displayOptions?.show?.resource?.includes('apiContract') && p.displayOptions.show.operation?.includes(op.name));
    const ui = [...properties.filter(p => p.name.startsWith('api_')).map(p => ({ ...p, name: p.name.slice(4) })), ...(properties.find(p => p.name === 'apiOptional')?.options || [])];
    controls(op.args, ui, op.name);
    const jsonArgs = objectSample(op.args, false);
    const params = { resource: 'apiContract', operation: op.name, apiInputMode: 'fields', apiOptional: {}, apiReturnMode: 'all' };
    for (const [key, type] of Object.entries(op.args)) {
      if (type.endsWith('!')) params[`api_${key}`] = sample(type, true, key);
      else params.apiOptional[key] = sample(type, true, key);
      fieldsCount++;
    }
    for (const [path, args] of Object.entries(op.nestedArgs)) params[`apiNested_${path.replace(/\./g, '_')}`] = Object.fromEntries(Object.entries(args).map(([k,t]) => [k, sample(t, true, k)]));
    const request = buildCompleteRequest(context(params), 0);
    const doc = g.parse(request.query);
    assert.deepEqual(g.validate(schema, doc), [], op.name);
    assert(!g.getVariableValues(schema, doc.definitions[0].variableDefinitions, request.variables).errors, op.name);
    const jsonRequest = buildCompleteRequest(context({ ...params, apiInputMode: 'json', apiArgumentsJson: JSON.stringify(jsonArgs) }), 0);
    assert.deepEqual(jsonRequest, request, `${op.name} JSON/Fields mismatch`);
    if (!op.scalar) {
      const selections = properties.find(p => p.name === 'apiReturnFields').options.map(o => o.value);
      assert.deepEqual(selections, op.returns);
      for (const field of op.returns) {
        const req = buildCompleteRequest(context({ ...params, apiReturnMode: 'custom', apiReturnFields: [field] }), 0);
        assert.deepEqual(g.validate(schema, g.parse(req.query)), [], `${op.name}:${field}`);
        pathsCount++;
      }
      assert.throws(() => buildCompleteRequest(context({ ...params, apiReturnMode: 'custom', apiReturnFields: [] }), 0), /Select at least/);
    }
    const requests = [];
    const result = await new ownerClass().execute.call(context(params, requests));
    assert.equal(requests.length, 2);
    assert.equal(result[0].length, 2);
    assert.deepEqual(result[0][1].pairedItem, { item: 1 });
    if (op.scalar) assert.equal(result[0][0].json[op.name], 'fixture-scalar');
    else {
      assert.equal(result[0][0].json[op.name].records.length, 2);
      assert.equal(result[0][0].json[op.name].total, 2);
      assert.equal(result[0][0].json[op.name].nullable, null);
    }
    if (op.kind === 'mutation') await assert.rejects(() => executeCompleteApi(context({ ...params, safeMode: true })), /Safe Mode/);
    const errorContext = context(params, [], true);
    errorContext.continueOnFail = () => true;
    const errors = await executeCompleteApi(errorContext);
    assert.equal(errors[0].length, 2);
    assert(!JSON.stringify(errors).includes('test-secret'));
    for (const [key,type] of Object.entries(op.args)) if (type.endsWith('!')) {
      const invalid = { ...jsonArgs }; delete invalid[key];
      assert.throws(() => buildCompleteRequest(context({ ...params, apiInputMode: 'json', apiArgumentsJson: invalid }), 0), /required field/);
    }
  }
  const emptyList = { resource: 'apiContract', operation: 'getMasterOptionCombinationMatrix', apiInputMode: 'fields', api_option_ids: {} };
  assert.deepEqual(buildCompleteRequest(context(emptyList), 0).variables.option_ids, []);
  const nullableList = { resource: 'apiContract', operation: 'addMasterOptionStockConfig', apiInputMode: 'fields', api_input: { value: { _optional: { attributes: { item: [null] } } } } };
  // The schema-derived fixture exercises nullable members using the actual root's type.
  const rootInput = base(catalog.find(o=>o.name==='addMasterOptionStockConfig').args.input);
  nullableList.api_input.value = objectSample(types[rootInput], true);
  nullableList.api_input.value._optional.attributes = { item: [null] };
  assert.deepEqual(buildCompleteRequest(context(nullableList), 0).variables.input.attributes, [null]);
  console.log(JSON.stringify({ operations: catalog.length, rootArguments: fieldsCount, individuallyValidatedReturnPaths: pathsCount, modes: ['fields', 'json'], passed: true }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
