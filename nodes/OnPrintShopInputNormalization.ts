import { IDataObject } from 'n8n-workflow';
import { parse, print } from './OnPrintShopGraphqlSyntax';
import inputTypes from './OnPrintShopInputTypes.json';
import enumTypes from './OnPrintShopEnumTypes.json';

const types: Record<string, Record<string, string>> = inputTypes;
const enums: Record<string, string[]> = enumTypes;

function normalize(value: unknown, type: string): unknown {
	if (value === null || value === undefined) return value;
	const nullable = type.replace(/!$/, '');
	if (nullable.startsWith('[')) {
		const itemType = nullable.slice(1, -1);
		return Array.isArray(value) ? value.map(item => normalize(item, itemType)) : normalize(value, itemType);
	}
	// n8n numeric dropdown values must match OPS string-encoded flags on the wire.
	if (nullable === 'String' && typeof value === 'number') return String(value);
	if (enums[nullable] && typeof value === 'string') {
		return enums[nullable].find(option => option.toLowerCase() === value.toLowerCase()) || value;
	}
	const fields = types[nullable];
	if (!fields || typeof value !== 'object' || Array.isArray(value)) return value;
	const result: IDataObject = {};
	for (const [key, entry] of Object.entries(value)) {
		const snake = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
		const candidate = key === 'courirer_company_name' ? 'courier_company_name' : snake;
		const name = fields[key] ? key : fields[candidate] ? candidate : key;
		result[name] = (fields[name] ? normalize(entry, fields[name]) : entry) as IDataObject;
	}
	return result;
}

export function normalizeOnPrintShopInputs(query: string, variables: IDataObject): IDataObject {
	const result = { ...variables };
	for (const definition of parse(query).definitions) {
		if (definition.kind !== 'OperationDefinition') continue;
		for (const variable of definition.variableDefinitions || []) {
			const name = variable.variable.name.value;
			if (Object.prototype.hasOwnProperty.call(result, name)) {
				result[name] = normalize(result[name], print(variable.type)) as IDataObject;
			}
		}
	}
	return result;
}
