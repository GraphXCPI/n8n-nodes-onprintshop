import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';
import catalog from './OnPrintShopCompleteApi.json';
import inputTypes from './OnPrintShopInputTypes.json';
import enumTypes from './OnPrintShopEnumTypes.json';
import { createOnPrintShopGraphqlClient } from './OnPrintShopGraphqlRequest';

const inputs: Record<string, Record<string, string>> = inputTypes;
const enums: Record<string, string[]> = enumTypes;
const RESOURCE = 'apiContract';
const label = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').split(' ').map(s => /^(id|url|sku|json|api)$/i.test(s) ? s.toUpperCase() : s[0]?.toUpperCase() + s.slice(1)).join(' ');
const nullable = (type: string) => type.replace(/!$/, '');

function objectControls(fields: Record<string, string>): INodeProperties[] {
  const required = Object.entries(fields).filter(([, type]) => type.endsWith('!')).map(([name, type]) => control(name, type));
  const optional = Object.entries(fields).filter(([, type]) => !type.endsWith('!')).map(([name, type]) => control(name, type));
  return [...required, ...(optional.length ? [{ displayName: 'Additional Fields', name: '_optional', type: 'collection' as const, default: {}, placeholder: 'Add Field', options: optional }] : [])];
}

function control(name: string, rawType: string): INodeProperties {
  const type = nullable(rawType);
  const base = { displayName: label(name), name, required: rawType.endsWith('!'), description: `API field: ${name} (${rawType})` };
  if (type.startsWith('[')) {
    const member = type.slice(1, -1);
    const object = inputs[nullable(member)];
    return { ...base, type: 'fixedCollection', default: {}, placeholder: 'Add Item', typeOptions: { multipleValues: true }, options: [{ displayName: 'Item', name: 'item', values: object ? objectControls(object) : [control('value', member)] }] };
  }
  if (inputs[type]) return { ...base, type: 'fixedCollection', default: {}, options: [{ displayName: label(name), name: 'value', values: objectControls(inputs[type]) }] };
  if (enums[type]) return { ...base, type: 'options', default: enums[type][0], options: enums[type].map(value => ({ name: label(value), value })) };
  if (type === 'Int' || type === 'Float') return { ...base, type: 'number', default: 0, ...(type === 'Int' ? { typeOptions: { numberPrecision: 0 } } : {}) };
  if (type === 'Boolean') return { ...base, type: 'boolean', default: false };
  if (type === 'JSON') return { ...base, type: 'json', default: '{}', description: 'This field is a JSON scalar in the OPS API. Supply a JSON object, array, or an expression matching the documented payload.' };
  return { ...base, type: 'string', default: '', ...(/password|token|secret/i.test(name) ? { typeOptions: { password: true } } : {}) };
}

export function addCompleteApi(description: INodeTypeDescription, domain?: string): INodeTypeDescription {
  if (domain === 'onPrintShopGraphql') return description;
  const operations = catalog.filter(o => !domain || o.domain === domain || (domain === 'onPrintShopMasterOptions' && /MasterOption|setMasterOption|setAssignOptions|CustomFormula|OptionGroup/.test(o.name)));
  if (!operations.length) return description;
  const resource = description.properties.find(p => p.name === 'resource');
  if (!resource) return description;
  const safeMode = description.properties.find(p => p.name === 'safeMode');
  if (safeMode) {
    safeMode.description = 'Whether to block mutations in Complete API. In legacy actions, this retains the existing reduced-response behavior.';
    safeMode.hint = 'Complete API: blocks mutations. Legacy actions: reduces nested response fields.';
  }
  if (!description.properties.some(p => p.name === 'safeMode')) description.properties.unshift({ displayName: 'Safe Mode', name: 'safeMode', type: 'boolean', default: false, description: 'Whether to block mutations in Complete API operations', displayOptions: { show: { resource: [RESOURCE] } } });
  if (resource.type === 'hidden') {
    resource.type = 'options';
    resource.options = [{ name: label(String(resource.default)), value: resource.default as string }];
  }
  resource.options = [...(resource.options || []).filter(o => !('value' in o) || o.value !== RESOURCE), { name: 'Complete API', value: RESOURCE }];
  const selector: INodeProperties = { displayName: 'Operation', name: 'operation', type: 'options', default: '', noDataExpression: true, displayOptions: { show: { resource: [RESOURCE] } }, options: operations.map(o => ({ name: label(o.name), value: o.name, action: label(o.name), description: `${o.kind === 'mutation' ? 'Writes to' : 'Reads from'} OnPrintShop using ${o.name}` })) };
  selector.default = operations[0].name;
  description.properties.push(selector);
  for (const op of operations) {
    const show = { resource: [RESOURCE], operation: [op.name] };
    const fieldShow = { ...show, apiInputMode: ['fields'] };
    const required = Object.entries(op.args).filter(([, type]) => type.endsWith('!'));
    const optional = Object.fromEntries(Object.entries(op.args).filter(([, type]) => !type.endsWith('!')));
    description.properties.push(
      { displayName: op.kind === 'mutation' ? 'This operation writes to OnPrintShop. Verify IDs and inputs before executing.' : 'Reads API data without intentionally changing records.', name: 'apiNotice', type: 'notice', default: '', displayOptions: { show } },
      { displayName: 'Input Mode', name: 'apiInputMode', type: 'options', default: 'fields', options: [{ name: 'Fields', value: 'fields' }, { name: 'JSON Object', value: 'json' }], displayOptions: { show } },
      ...required.map(([name, type]) => ({ ...control(name, type), name: `api_${name}`, displayOptions: { show: fieldShow } })),
      ...(Object.keys(optional).length ? [{ displayName: 'Parameters', name: 'apiOptional', type: 'collection' as const, default: {}, placeholder: 'Add Parameter', options: Object.entries(optional).map(([name, type]) => control(name, type)), displayOptions: { show: fieldShow } }] : []),
      { displayName: 'Arguments JSON', name: 'apiArgumentsJson', type: 'json', default: '{}', displayOptions: { show: { ...show, apiInputMode: ['json'] } } },
    );
    for (const [path, fields] of Object.entries(op.nestedArgs)) description.properties.push({ displayName: `${label(path)} Parameters`, name: `apiNested_${path.replace(/\./g, '_')}`, type: 'collection', default: {}, options: Object.entries(fields).map(([name, type]) => control(name, type)), displayOptions: { show } });
    if (!op.scalar) description.properties.push(
      { displayName: 'Return Fields Mode', name: 'apiReturnMode', type: 'options', default: 'all', options: [{ name: 'All Fields', value: 'all' }, { name: 'Custom Selection', value: 'custom' }], displayOptions: { show } },
      { displayName: 'Return Fields', name: 'apiReturnFields', type: 'multiOptions', default: [], options: op.returns.map(path => ({ name: path.split('.').map(label).join(' / '), value: path })), displayOptions: { show: { ...show, apiReturnMode: ['custom'] } } },
    );
  }
  return description;
}

function fail(path: string, reason: string): never { throw new Error(`${path}: ${reason}`); }
function fromObject(raw: unknown, fields: Record<string, string>, path: string, form: boolean): IDataObject {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(path, 'provide an object');
  const source = raw as IDataObject;
  const value = form ? { ...(source._optional as IDataObject || {}), ...Object.fromEntries(Object.entries(source).filter(([key]) => key !== '_optional')) } : source;
  for (const key of Object.keys(value)) if (!(key in fields)) fail(`${path}.${key}`, 'unknown API field');
  const result: IDataObject = {};
  for (const [key, type] of Object.entries(fields)) {
    if (value[key] === undefined) { if (type.endsWith('!')) fail(`${path}.${key}`, 'required field is missing'); continue; }
    result[key] = fromValue(value[key], type, `${path}.${key}`, form) as IDataObject;
  }
  return result;
}
function fromValue(raw: unknown, rawType: string, path: string, form: boolean): unknown {
  if (raw === null) return rawType.endsWith('!') ? fail(path, 'cannot be null') : null;
  const type = nullable(rawType);
  if (type.startsWith('[')) {
    const member = type.slice(1, -1);
    if (form && (!raw || typeof raw !== 'object' || Array.isArray(raw))) return fail(path, 'provide a list control object');
    const rows = form ? ((raw as IDataObject).item ?? []) : raw;
    if (!Array.isArray(rows)) return fail(path, 'provide an array');
    return rows.map((row, i) => row === null ? fromValue(null, member, `${path}[${i}]`, form) : inputs[nullable(member)] && form ? fromObject(row, inputs[nullable(member)], `${path}[${i}]`, true) : fromValue(form ? row.value : row, member, `${path}[${i}]`, form));
  }
  if (inputs[type]) return fromObject(form ? ((raw as IDataObject)?.value ?? {}) : raw, inputs[type], path, form);
  if (enums[type]) return enums[type].includes(raw as string) ? raw : fail(path, 'select a valid enum value');
  if (type === 'JSON' && form && typeof raw === 'string') { try { return JSON.parse(raw); } catch { return fail(path, 'invalid JSON'); } }
  if (type === 'Int' && (!Number.isInteger(raw) || Number(raw) < -2147483648 || Number(raw) > 2147483647)) return fail(path, 'provide a 32-bit integer');
  if (type === 'Float' && (typeof raw !== 'number' || !Number.isFinite(raw))) return fail(path, 'provide a finite number');
  if (type === 'Boolean' && typeof raw !== 'boolean') return fail(path, 'provide a boolean');
  if ((type === 'String' || type === 'ID') && typeof raw !== 'string') return fail(path, 'provide a string');
  return raw;
}

export function buildCompleteRequest(context: IExecuteFunctions, index: number): { query: string; variables: IDataObject; name: string } {
  const name = String(context.getNodeParameter('operation', index));
  const op = catalog.find(o => o.name === name);
  if (!op) throw new Error('Unknown API operation');
  const form = context.getNodeParameter('apiInputMode', index, 'fields') === 'fields';
  let source: unknown;
  if (form) {
    source = { ...(context.getNodeParameter('apiOptional', index, {}) as IDataObject) };
    for (const [key, type] of Object.entries(op.args)) if (type.endsWith('!')) (source as IDataObject)[key] = context.getNodeParameter(`api_${key}`, index);
  } else {
    const raw = context.getNodeParameter('apiArgumentsJson', index, '{}');
    try { source = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new NodeOperationError(context.getNode(), 'Arguments JSON must be a valid object', { itemIndex: index }); }
  }
  const variables = fromObject(source, op.args, name, form);
  const definitions = Object.keys(variables).map(key => `$${key}: ${op.args[key]}`);
  const args = Object.keys(variables).map(key => `${key}: $${key}`);
  const fields = context.getNodeParameter('apiReturnMode', index, 'all') === 'all' ? op.returns : context.getNodeParameter('apiReturnFields', index, []) as string[];
  if (!op.scalar && (!Array.isArray(fields) || !fields.length || fields.some(f => !op.returns.includes(f)))) throw new Error('Select at least one valid return field');
  type Tree = { [key: string]: Tree };
  const tree: Tree = {};
  if (!op.scalar) for (const path of fields) { let branch = tree; for (const part of path.split('.')) branch = branch[part] ||= {}; }
  const nestedCalls: Record<string, string> = {};
  for (const [path, types] of Object.entries(op.nestedArgs)) {
    if (!fields.some(f => f.startsWith(`${path}.`))) continue;
    const values = fromObject(context.getNodeParameter(`apiNested_${path.replace(/\./g, '_')}`, index, {}), types, path, true);
    const call = Object.keys(values).map(key => {
      const variable = `nested_${path.replace(/\./g, '_')}_${key}`;
      variables[variable] = values[key]; definitions.push(`$${variable}: ${types[key]}`);
      return `${key}: $${variable}`;
    });
    nestedCalls[path] = call.length ? `(${call.join(', ')})` : '';
  }
  function render(branch: Tree, prefix = ''): string {
    return Object.entries(branch).map(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return `${key}${nestedCalls[path] || ''}${Object.keys(child).length ? ` { ${render(child, path)} }` : ''}`;
    }).join(' ');
  }
  return { name, variables, query: `${op.kind} ${name}${definitions.length ? `(${definitions.join(', ')})` : ''} { ${name}${args.length ? `(${args.join(', ')})` : ''}${op.scalar ? '' : ` { ${render(tree)} }`} }` };
}

export async function executeCompleteApi(context: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
  if (context.getNodeParameter('resource', 0) !== RESOURCE) return null;
  const output: INodeExecutionData[] = [];
  let client: Awaited<ReturnType<typeof createOnPrintShopGraphqlClient>>;
  for (let index = 0; index < context.getInputData().length; index++) {
    let sending = false;
    try {
      const op = catalog.find(o => o.name === context.getNodeParameter('operation', index));
      if (op?.kind === 'mutation' && context.getNodeParameter('safeMode', index, false)) throw new Error('Safe Mode blocks mutations');
      const request = buildCompleteRequest(context, index);
      sending = true;
      client ||= await createOnPrintShopGraphqlClient(context);
      const data = await client(request.query, request.variables, index);
      // Preserve the complete API envelope, including counts, nested lists and nulls.
      output.push({ json: { [request.name]: data[request.name] ?? null }, pairedItem: { item: index } });
    } catch (error) {
      const message = sending ? 'OnPrintShop rejected the API request. Check the endpoint schema, permissions and input values.' : (error as Error).message;
      if (!context.continueOnFail()) throw new NodeOperationError(context.getNode(), message, { itemIndex: index });
      output.push({ json: { error: message }, pairedItem: { item: index } });
    }
  }
  return [output];
}
