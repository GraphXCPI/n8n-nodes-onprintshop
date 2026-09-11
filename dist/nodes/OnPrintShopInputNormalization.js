"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOnPrintShopInputs = normalizeOnPrintShopInputs;
const OnPrintShopGraphqlSyntax_1 = require("./OnPrintShopGraphqlSyntax");
const OnPrintShopInputTypes_json_1 = __importDefault(require("./OnPrintShopInputTypes.json"));
const OnPrintShopEnumTypes_json_1 = __importDefault(require("./OnPrintShopEnumTypes.json"));
const types = OnPrintShopInputTypes_json_1.default;
const enums = OnPrintShopEnumTypes_json_1.default;
function normalize(value, type) {
    if (value === null || value === undefined)
        return value;
    const nullable = type.replace(/!$/, '');
    if (nullable.startsWith('[')) {
        const itemType = nullable.slice(1, -1);
        return Array.isArray(value) ? value.map(item => normalize(item, itemType)) : normalize(value, itemType);
    }
    // n8n numeric dropdown values must match OPS string-encoded flags on the wire.
    if (nullable === 'String' && typeof value === 'number')
        return String(value);
    if (enums[nullable] && typeof value === 'string') {
        return enums[nullable].find(option => option.toLowerCase() === value.toLowerCase()) || value;
    }
    const fields = types[nullable];
    if (!fields || typeof value !== 'object' || Array.isArray(value))
        return value;
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        const snake = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
        const candidate = key === 'courirer_company_name' ? 'courier_company_name' : snake;
        const name = fields[key] ? key : fields[candidate] ? candidate : key;
        result[name] = (fields[name] ? normalize(entry, fields[name]) : entry);
    }
    return result;
}
function normalizeOnPrintShopInputs(query, variables) {
    const result = { ...variables };
    for (const definition of (0, OnPrintShopGraphqlSyntax_1.parse)(query).definitions) {
        if (definition.kind !== 'OperationDefinition')
            continue;
        for (const variable of definition.variableDefinitions || []) {
            const name = variable.variable.name.value;
            if (Object.prototype.hasOwnProperty.call(result, name)) {
                result[name] = normalize(result[name], (0, OnPrintShopGraphqlSyntax_1.print)(variable.type));
            }
        }
    }
    return result;
}
