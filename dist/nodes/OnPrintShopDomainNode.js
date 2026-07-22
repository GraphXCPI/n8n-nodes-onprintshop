"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPrintShopDomainNode = void 0;
exports.buildOnPrintShopDomainDescription = buildOnPrintShopDomainDescription;
const OnPrintShop_node_1 = require("./OnPrintShop/OnPrintShop.node");
const OnPrintShopContractActions_1 = require("./OnPrintShopContractActions");
const GLOBAL_PROPERTY_NAMES = new Set(['safeMode']);
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function getShowArray(property, key) {
    var _a;
    const show = (_a = property.displayOptions) === null || _a === void 0 ? void 0 : _a.show;
    const value = show === null || show === void 0 ? void 0 : show[key];
    return Array.isArray(value) ? value : undefined;
}
function setShowArray(property, key, value) {
    property.displayOptions = property.displayOptions || {};
    property.displayOptions.show = property.displayOptions.show || {};
    property.displayOptions.show[key] = value;
}
function intersects(left, right) {
    return !left || left.some((value) => right.includes(value));
}
function allowedOperationsForResources(resources, operations) {
    return Array.from(new Set(resources.flatMap((resource) => operations[resource] || [])));
}
function buildResourceProperty(base, config) {
    const property = clone(base);
    const allowed = new Set(config.resources);
    const options = (property.options || []).filter((option) => allowed.has(option.value));
    if (config.resources.length === 1) {
        const hiddenResourceProperty = {
            displayName: 'Area',
            name: 'resource',
            type: 'hidden',
            default: '',
        };
        hiddenResourceProperty.default = config.defaultResource;
        return hiddenResourceProperty;
    }
    property.displayName = 'Area';
    property.options = options;
    property.default = config.defaultResource;
    return property;
}
function buildOperationProperty(base, config) {
    const resourceValues = getShowArray(base, 'resource');
    if (!resourceValues || !intersects(resourceValues, config.resources))
        return undefined;
    const resources = resourceValues.filter((resource) => config.resources.includes(resource));
    const allowedOps = new Set(allowedOperationsForResources(resources, config.operations));
    const property = clone(base);
    const options = (property.options || []).filter((option) => allowedOps.has(option.value));
    if (options.length === 0)
        return undefined;
    property.options = options;
    property.default = options.some((option) => option.value === property.default)
        ? property.default
        : options[0].value;
    setShowArray(property, 'resource', resources);
    return property;
}
function buildDomainProperty(base, config) {
    const resourceValues = getShowArray(base, 'resource');
    if (!resourceValues || !intersects(resourceValues, config.resources))
        return undefined;
    const resources = resourceValues.filter((resource) => config.resources.includes(resource));
    const operationValues = getShowArray(base, 'operation');
    if (operationValues) {
        const allowedOps = allowedOperationsForResources(resources, config.operations);
        const operations = operationValues.filter((operation) => allowedOps.includes(operation));
        if (operations.length === 0)
            return undefined;
        const property = clone(base);
        setShowArray(property, 'resource', resources);
        setShowArray(property, 'operation', operations);
        return property;
    }
    const property = clone(base);
    setShowArray(property, 'resource', resources);
    return property;
}
function buildOnPrintShopDomainDescription(config) {
    const legacy = new OnPrintShop_node_1.OnPrintShop().description;
    const properties = [];
    const resourceProperty = legacy.properties.find((property) => property.name === 'resource');
    for (const baseProperty of legacy.properties) {
        if (GLOBAL_PROPERTY_NAMES.has(baseProperty.name)) {
            properties.push(clone(baseProperty));
            continue;
        }
        if (baseProperty.name === 'resource' && resourceProperty) {
            properties.push(buildResourceProperty(baseProperty, config));
            continue;
        }
        if (baseProperty.name === 'operation') {
            const operationProperty = buildOperationProperty(baseProperty, config);
            if (operationProperty)
                properties.push(operationProperty);
            continue;
        }
        const domainProperty = buildDomainProperty(baseProperty, config);
        if (domainProperty)
            properties.push(domainProperty);
    }
    return (0, OnPrintShopContractActions_1.extendOnPrintShopDomainDescription)({
        ...clone(legacy),
        displayName: config.displayName,
        name: config.name,
        subtitle: '={{$parameter["operation"]}}',
        description: config.description,
        defaults: {
            name: config.defaultName,
        },
        properties,
    }, config.name);
}
class OnPrintShopDomainNode {
    // Delegates to OnPrintShop.execute(), which contains per-item continueOnFail handling.
    async execute() {
        const contractResult = await (0, OnPrintShopContractActions_1.executeOnPrintShopContractAction)(this);
        if (contractResult)
            return contractResult;
        return OnPrintShop_node_1.OnPrintShop.prototype.execute.call(this);
    }
}
exports.OnPrintShopDomainNode = OnPrintShopDomainNode;
