import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';
import catalog from './OnPrintShopCompleteApi.json';
import inputTypes from './OnPrintShopInputTypes.json';
import enumTypes from './OnPrintShopEnumTypes.json';
import { createOnPrintShopGraphqlClient } from './OnPrintShopGraphqlRequest';
import { completeApiError } from './OnPrintShopSafeError';
import { COMPLETE_PAGINATION_LIMITS, CompletePaginationRequestError, paginateCompleteApi } from './OnPrintShopPagination';
import type { CompletePaginationOptions } from './OnPrintShopPagination';

const inputs: Record<string, Record<string, string>> = inputTypes;
const enums: Record<string, string[]> = enumTypes;
const RESOURCE = 'apiContract';
const label = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').split(' ').map(s => /^(id|url|sku|json|api)$/i.test(s) ? s.toUpperCase() : s[0]?.toUpperCase() + s.slice(1)).join(' ');
const nullable = (type: string) => type.replace(/!$/, '');
const paginationFields: Record<string, { recordField: string; totalField: string }> = {
  customers: { recordField: 'customers', totalField: 'totalCustomers' },
  productsDetails: { recordField: 'products', totalField: 'totalProducts' },
  orders: { recordField: 'orders', totalField: 'totalOrders' },
  getStore: { recordField: 'store', totalField: 'totalStore' },
};
type PaginationConfig = Omit<CompletePaginationOptions, 'fetchPage'>;

function paginationConfig(context: IExecuteFunctions, index: number, name: string, kind: string, variables: IDataObject): PaginationConfig | undefined {
  const mode = context.getNodeParameter('apiPagination', index, 'off');
  if (mode === 'off') return undefined;
  if (mode !== 'all' && mode !== 'limit') throw new Error('Select a valid pagination mode');
  if (kind !== 'query' || !Object.prototype.hasOwnProperty.call(paginationFields, name)) throw new Error('Pagination is not supported for this API operation');
  function number(value: unknown, name: string, minimum: number, maximum: number): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    return value;
  }
  return {
    ...paginationFields[name], currentCountField: 'currentCount',
    initialOffset: number(variables.offset ?? 0, 'Offset', 0, COMPLETE_PAGINATION_LIMITS.initialOffset),
    pageSize: number(context.getNodeParameter('apiPageSize', index, 250), 'Page Size', 1, COMPLETE_PAGINATION_LIMITS.pageSize),
    pageDelay: number(context.getNodeParameter('apiPageDelay', index, 50), 'Page Delay', 0, COMPLETE_PAGINATION_LIMITS.pageDelay),
    maxPages: number(context.getNodeParameter('apiMaxPages', index, 1000), 'Max Pages', 1, COMPLETE_PAGINATION_LIMITS.maxPages),
    ...(mode === 'limit' ? { maxRecords: number(context.getNodeParameter('apiMaxRecords', index, 10), 'Max Records', 0, COMPLETE_PAGINATION_LIMITS.maxRecords) } : {}),
  };
}

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
    if (op.kind === 'mutation') description.properties.push({
      displayName: 'Partial Response', name: 'apiPartialResponse', type: 'options', default: 'fail',
      options: [{ name: 'Fail on Errors', value: 'fail' }, { name: 'Return Partial Data', value: 'returnData' }],
      description: 'Partial results may contain failures. Reconcile every row before any further write.',
      displayOptions: { show },
    });
    if (op.kind === 'query' && Object.prototype.hasOwnProperty.call(paginationFields, op.name)) {
      const pagedShow = { ...show, apiPagination: ['all', 'limit'] };
      description.properties.push(
        { displayName: 'Pagination', name: 'apiPagination', type: 'options', default: 'off', options: [{ name: 'Off', value: 'off' }, { name: 'All Records', value: 'all' }, { name: 'Limit Records', value: 'limit' }], description: 'Fetch additional pages from the configured offset. Off preserves the API limit and offset parameters.', displayOptions: { show } },
        { displayName: 'Page Size', name: 'apiPageSize', type: 'number', default: 250, typeOptions: { minValue: 1, maxValue: COMPLETE_PAGINATION_LIMITS.pageSize, numberPrecision: 0 }, description: 'Maximum records per request; replaces the API limit parameter when pagination is enabled', displayOptions: { show: pagedShow } },
        { displayName: 'Page Delay (Ms)', name: 'apiPageDelay', type: 'number', default: 50, typeOptions: { minValue: 0, maxValue: COMPLETE_PAGINATION_LIMITS.pageDelay, numberPrecision: 0 }, displayOptions: { show: pagedShow } },
        { displayName: 'Max Pages', name: 'apiMaxPages', type: 'number', default: 1000, typeOptions: { minValue: 1, maxValue: COMPLETE_PAGINATION_LIMITS.maxPages, numberPrecision: 0 }, description: 'Safety limit; reaching this before completion fails instead of returning partial results', displayOptions: { show: pagedShow } },
        { displayName: 'Max Records', name: 'apiMaxRecords', type: 'number', default: 10, typeOptions: { minValue: 0, maxValue: COMPLETE_PAGINATION_LIMITS.maxRecords, numberPrecision: 0 }, displayOptions: { show: { ...show, apiPagination: ['limit'] } } },
      );
    }
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

export function buildCompleteRequest(context: IExecuteFunctions, index: number): { query: string; variables: IDataObject; name: string; pagination?: PaginationConfig } {
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
  const pagination = paginationConfig(context, index, name, op.kind, variables);
  if (pagination) {
    variables.offset = pagination.initialOffset;
    variables.limit = Math.min(pagination.pageSize, pagination.maxRecords ?? pagination.pageSize);
  }
  const definitions = Object.keys(variables).map(key => `$${key}: ${op.args[key]}`);
  const args = Object.keys(variables).map(key => `${key}: $${key}`);
  let fields = context.getNodeParameter('apiReturnMode', index, 'all') === 'all' ? op.returns : context.getNodeParameter('apiReturnFields', index, []) as string[];
  if (!op.scalar && (!Array.isArray(fields) || !fields.length || fields.some(f => !op.returns.includes(f)))) throw new Error('Select at least one valid return field');
  if (pagination) {
    if (!fields.some(field => field.startsWith(`${pagination.recordField}.`))) throw new Error('Pagination requires at least one selected record return field');
    fields = [...new Set([...fields, pagination.totalField, pagination.currentCountField])];
  }
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
  return { name, variables, ...(pagination ? { pagination } : {}), query: `${op.kind} ${name}${definitions.length ? `(${definitions.join(', ')})` : ''} { ${name}${args.length ? `(${args.join(', ')})` : ''}${op.scalar ? '' : ` { ${render(tree)} }`} }` };
}

export async function executeCompleteApi(context: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
  if (context.getNodeParameter('resource', 0) !== RESOURCE) return null;
  const output: INodeExecutionData[] = [];
  let client: Awaited<ReturnType<typeof createOnPrintShopGraphqlClient>>;
  for (let index = 0; index < context.getInputData().length; index++) {
    let sending = false;
    let isMutation = false;
    try {
      const op = catalog.find(o => o.name === context.getNodeParameter('operation', index));
      isMutation = op?.kind === 'mutation';
      if (op?.kind === 'mutation' && context.getNodeParameter('safeMode', index, false)) throw new Error('Safe Mode blocks mutations');
      const partialResponse = isMutation ? context.getNodeParameter('apiPartialResponse', index, 'fail') : 'fail';
      if (partialResponse !== 'fail' && partialResponse !== 'returnData') throw new Error('Select a valid partial response mode');
      const request = buildCompleteRequest(context, index);
      if (request.pagination) {
        let firstPage: IDataObject;
        const pagination = await paginateCompleteApi({
          ...request.pagination,
          fetchPage: async (offset, limit) => {
            sending = true;
            client ||= await createOnPrintShopGraphqlClient(context);
            const data = await client(request.query, { ...request.variables, offset, limit }, index);
            const page = data[request.name] as IDataObject;
            firstPage ??= page;
            return page;
          },
        });
        output.push({ json: {
          [request.name]: {
            ...firstPage,
            [request.pagination.recordField]: pagination.records,
            [request.pagination.currentCountField]: pagination.currentCount,
            ...(pagination.total === undefined ? {} : { [request.pagination.totalField]: pagination.total }),
          },
          _pagination: { pages: pagination.pages, pageSize: pagination.pageSize, totalRecords: pagination.currentCount },
        }, pairedItem: { item: index } });
        continue;
      }
      sending = true;
      client ||= await createOnPrintShopGraphqlClient(context);
      const data = partialResponse === 'returnData'
        ? await client(request.query, request.variables, index, { partialDataRoot: request.name })
        : await client(request.query, request.variables, index);
      // Preserve the complete API envelope, including counts, nested lists and nulls.
      output.push({ json: { [request.name]: data[request.name] ?? null }, pairedItem: { item: index } });
    } catch (error) {
      // Reclassifying sanitized text can lose or change its original classification.
      let failure = error instanceof CompletePaginationRequestError
        ? { message: error.message, code: error.code, retryable: error.code === 'OPS_TRANSPORT' }
        : sending ? completeApiError(error) : { message: (error as Error).message, code: 'OPS_VALIDATION', retryable: false };
      if (isMutation && failure.retryable) failure = { ...failure, retryable: false, message: `OnPrintShop ${failure.code}: Write outcome is unknown. Verify the remote state before any further write.` };
      const message = failure.message;
      if (!context.continueOnFail()) throw new NodeOperationError(context.getNode(), message, { itemIndex: index });
      output.push({ json: { error: message, errorCode: failure.code, retryable: failure.retryable }, pairedItem: { item: index } });
    }
  }
  return [output];
}
