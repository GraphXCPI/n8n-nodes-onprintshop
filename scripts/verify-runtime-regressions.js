#!/usr/bin/env node
const assert = require('assert/strict');
const Module = require('module');
const fs = require('fs');
const path = require('path');
const graphql = require('graphql');
const schema = graphql.buildSchema(fs.readFileSync(path.join(__dirname, '../contracts/ops-schema.graphql'), 'utf8'));
const inputTypes = {}, enumTypes = {};
for (const type of Object.values(schema.getTypeMap())) {
  if (graphql.isInputObjectType(type)) inputTypes[type.name] = Object.fromEntries(Object.entries(type.getFields()).map(([name, field])=>[name,String(field.type)]));
  if (graphql.isEnumType(type) && !type.name.startsWith('__')) enumTypes[type.name] = type.getValues().map(v=>v.name).sort();
}
assert.deepEqual(require('../nodes/OnPrintShopInputTypes.json'),inputTypes,'Input normalization types must match the checked-in schema');
assert.deepEqual(Object.fromEntries(Object.entries(require('../nodes/OnPrintShopEnumTypes.json')).map(([name, values])=>[name,[...values].sort()])),enumTypes,'Enum normalization must match the checked-in schema');
// Loading the packed code must not require an external GraphQL installation.
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) {
  if (name === 'graphql' || name.startsWith('graphql/')) throw new Error('Unexpected runtime GraphQL dependency');
  return resolve.call(this, name, ...args);
};
const { normalizeOnPrintShopInputs } = require('../dist/nodes/OnPrintShopInputNormalization');
const { OnPrintShop } = require('../dist/nodes/OnPrintShop/OnPrintShop.node');
Module._resolveFilename = resolve;

const payload = {customCamelCase: {anotherKey: false}, stock_change: 0, location: null};
const variables = { inputs: [{status:1, pricing_method:0, admin_extra_fields:payload}], date_type:'REGISTRATION' };
const normalized = normalizeOnPrintShopInputs('mutation M($inputs: [MasterOptionInput!]!, $date_type: CustomerDateTypeEnum) { unused }', variables);
assert.equal(normalized.inputs[0].status, '1');
assert.equal(normalized.inputs[0].pricing_method, '0');
assert.equal(normalized.date_type, 'registration');
assert.deepEqual(normalized.inputs[0].admin_extra_fields, payload);
assert.equal(variables.inputs[0].status, 1, 'Do not mutate caller variables');

async function main() {
  const query = 'query Raw($input: JSON) { echo(input: $input, text: "get_store product_additional_options userId") }';
  const rawVariables = {input:{userId:123, customCamelCase:payload}};
  const params = {resource:'graphql',operation:'execute',safeMode:false,graphqlQuery:query,graphqlVariables:JSON.stringify(rawVariables)};
  let body;
  const context = {
    getInputData:()=>[{json:{}}],
    getCredentials:async()=>({baseUrl:'https://example.invalid',tokenUrl:'https://example.invalid/token',clientId:'raw-audit',clientSecret:'test-only'}),
    getNode:()=>({name:'Raw regression',type:'n8n-nodes-onprintshop.onPrintShop',parameters:params,typeVersion:10,position:[0,0]}),
    getNodeParameter:(name,index,fallback)=>params[name] ?? fallback,
    continueOnFail:()=>false,
    helpers:{httpRequest:async request=>{
      if(request.url.endsWith('/token')) return {access_token:'test-only',expires_in:3600};
      body=request.body;return {data:{echo:{ok:true}}};
    },returnJsonArray:items=>items.map(json=>({json}))},
  };
  await new OnPrintShop().execute.call(context);
  assert.equal(body.query,query,'Raw documents and string literals must be unchanged');
  assert.deepEqual(body.variables,rawVariables,'Raw variables must be unchanged');
  for (const operation of ['getAll','shipToMultipleAddress']) {
    Object.assign(params,{resource:'shipToMultipleAddress',operation,queryParameters:{},shipToMultipleAddress_order_id:0});
    body=undefined;
    await assert.rejects(()=>new OnPrintShop().execute.call(context),/positive Order/);
    assert.equal(body,undefined,'Invalid ship-to-multiple input must not issue a data request');
  }
  console.log('Verified raw request preservation, typed flags, enum compatibility, JSON isolation, and bundled parser independence');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
