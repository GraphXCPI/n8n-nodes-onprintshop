#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parse, buildSchema, buildClientSchema, validate, getVariableValues, isNonNullType, isListType, getNamedType } = require('graphql');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const schema = process.env.OPS_SCHEMA_PATH ? buildClientSchema(JSON.parse(fs.readFileSync(process.env.OPS_SCHEMA_PATH, 'utf8'))) : buildSchema(fs.readFileSync(path.join(root, 'contracts/ops-schema.graphql'), 'utf8'));
function responseFor(query) {
  const op = parse(query).definitions.find(d => d.kind === 'OperationDefinition');
  function value(type, selection) {
    if (isNonNullType(type)) return value(type.ofType, selection);
    if (isListType(type)) return [value(type.ofType, selection), value(type.ofType, selection)];
    if (selection) {
      const object = {};
      for (const field of selection.selections) {
        const definition = type.getFields()[field.name.value];
        object[field.alias?.value || field.name.value] = value(definition.type, field.selectionSet);
      }
      return object;
    }
    const name = getNamedType(type).name;
    return name === 'Int' || name === 'Float' ? 2 : name === 'Boolean' ? true : name === 'JSON' ? {} : 'fixture';
  }
  return {data:value(op.operation === 'mutation' ? schema.getMutationType() : schema.getQueryType(), op.selectionSet)};
}
function visible(p, params) {
  return Object.entries(p.displayOptions?.show || {}).every(([k, vals]) => !['resource', 'operation'].includes(k) || vals.includes(params[k]));
}
function sample(p) {
  if (p.type === 'fixedCollection') return Object.fromEntries((p.options || []).map(g => [g.name, [Object.fromEntries(g.values.map(v => [v.name, sample(v)]))]]));
  if (p.type === 'collection') return Object.fromEntries((p.options || []).map(v => [v.name, sample(v)]));
  if (p.type === 'number') return /offset/i.test(p.name) ? 0 : 1;
  if (p.type === 'boolean') return false;
  if (p.type === 'json') return /optionFilter|optionIds/i.test(p.name) ? '[1,2]' : p.default && !['{}','[]',''].includes(p.default) ? p.default : /inputs|Json/.test(p.name) ? '[{"id":1}]' : '{}';
  if (p.type === 'multiOptions') return process.env.OPS_AUDIT_ALL_FIELDS ? (p.options || []).map(o => o.value).filter(v => typeof v === 'string') : p.default || [];
  if (p.type === 'options') return p.default ?? p.options?.[0]?.value;
  if (p.type === 'dateTime' || /(^|_)date$|Date$|from_date|to_date/.test(p.name)) return '2026-01-01T00:00:00Z';
  if (p.default !== undefined && p.default !== '') return p.default;
  return /url$/i.test(p.name) ? 'https://example.invalid/file.pdf' : /email/i.test(p.name) ? 'audit@example.invalid' : /id|number/i.test(p.name) ? '1' : 'audit';
}
async function main() {
  const results = [];
  for (const file of pkg.n8n.nodes) {
    const Class = Object.values(require(path.join(root, file)))[0];
    const node = new Class();
    const props = node.description.properties;
    const resourceProp = props.find(p => p.name === 'resource');
    const resources = resourceProp?.options?.map(o => o.value) || [resourceProp?.default];
    for (const resource of resources) {
      const opProps = props.filter(p => p.name === 'operation' && visible(p, { resource }));
      for (const operation of [...new Set(opProps.flatMap(p => p.options.map(o => o.value)))]) {
        // Full typed API controls have a separate exhaustive Fields/JSON test matrix.
        if (resource === 'graphql' || resource === 'apiContract') continue;
        const params = { resource, operation, safeMode: false };
        const effectiveParams = {...params,operation: operation === 'getMany' && ['customer','customerAddress','order','orderDetails','orderShipment'].includes(resource) ? 'getAll' : operation};
        for (const p of props.filter(p => !['resource','operation','safeMode'].includes(p.name) && visible(p, effectiveParams))) params[p.name] = sample(p);
        if (resource === 'stock' && operation === 'deleteConfig') params.stockDeleteOptionIds = '';
        if (resource === 'stock' && operation === 'getCombinationMatrix') params.stockMatrixOptionIds = '1,2';
        if (operation === 'modifyOrderProduct') params.modifyOrderProduct_input = '{"product_arr":[{"order_product_id":1}]}';
        const requests = [];
        const missingParameters = new Set();
        let error, output;
        const context = {
          getInputData: () => [{ json: {} }],
          getCredentials: async () => ({ baseUrl:'https://example.invalid', tokenUrl:'https://example.invalid/token',clientId:'audit',clientSecret:'audit' }),
          getNode: () => ({name:'Audit',type:`n8n-nodes-onprintshop.${node.description.name}`,parameters:params,typeVersion:1,position:[0,0]}),
          getNodeParameter: (name, index, fallback) => {
            if (!(name in params) && fallback === undefined) missingParameters.add(name);
            return params[name] ?? fallback;
          },
          continueOnFail: () => false,
          helpers: {httpRequest: async options => {
            if (options.url.endsWith('/token')) return {access_token:'audit-token',expires_in:3600};
            requests.push(options.body);
            if (process.env.OPS_AUDIT_RESPONSES) return responseFor(options.body.query);
            throw new Error('AUDIT_CAPTURE_COMPLETE');
          }, returnJsonArray: a => a.map(json => ({json}))},
        };
        try { output = await node.execute.call(context); } catch (e) { error = e.message; }
        const issues = [];
        if (!requests.length) issues.push(`No request: ${error || 'empty execution'}`);
        if (process.env.OPS_AUDIT_RESPONSES) {
          if (error) issues.push(`Response handling: ${error}`);
          if (!output?.[0]?.length) issues.push('Response handling: records were lost');
          for (const item of output?.[0] || []) if (!item.json || typeof item.json !== 'object' || Array.isArray(item.json) || item.json.error) issues.push('Response handling: invalid n8n item');
        }
        for (const request of requests) {
          try {
            const document = parse(request.query);
            issues.push(...validate(schema, document).map(e => e.message));
            const definitions = document.definitions.find(x => x.kind === 'OperationDefinition').variableDefinitions || [];
            issues.push(...(getVariableValues(schema, definitions, request.variables || {}).errors || []).map(e => e.message));
          } catch(e) { issues.push(`Parse: ${e.message}`); }
        }
        results.push({node:node.description.name,resource,operation,issues,requests,params,missingParameters:[...missingParameters]});
        if (process.env.OPS_AUDIT_UI && missingParameters.size) issues.push(`Missing UI parameters: ${[...missingParameters].join(', ')}`);
      }
    }
  }
  const report = {actions:results.length,captured:results.filter(r=>r.requests.length).length,failed:results.filter(r=>r.issues.length).length,results};
  if (process.env.OPS_AUDIT_REPORT) fs.writeFileSync(process.env.OPS_AUDIT_REPORT, JSON.stringify(report,null,2));
  console.log(JSON.stringify({actions:report.actions,captured:report.captured,failed:report.failed}));
  for (const r of results.filter(r=>r.issues.length)) console.log(`${r.node} ${r.resource}/${r.operation}: ${r.issues.join('; ')}`);
  process.exitCode = report.failed ? 1 : 0;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
