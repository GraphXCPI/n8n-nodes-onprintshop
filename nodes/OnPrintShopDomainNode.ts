import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { OnPrintShop } from './OnPrintShop/OnPrintShop.node';
import { executeOnPrintShopContractAction, extendOnPrintShopDomainDescription } from './OnPrintShopContractActions';

type OperationMap = Record<string, string[]>;

export interface OnPrintShopDomainConfig {
	displayName: string;
	name: string;
	description: string;
	defaultName: string;
	resources: string[];
	defaultResource: string;
	operations: OperationMap;
}

const GLOBAL_PROPERTY_NAMES = new Set(['safeMode']);

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

function getShowArray(property: INodeProperties, key: 'resource' | 'operation'): string[] | undefined {
	const show = property.displayOptions?.show as Record<string, string[]> | undefined;
	const value = show?.[key];
	return Array.isArray(value) ? value : undefined;
}

function setShowArray(property: INodeProperties, key: 'resource' | 'operation', value: string[]): void {
	property.displayOptions = property.displayOptions || {};
	property.displayOptions.show = property.displayOptions.show || {};
	(property.displayOptions.show as Record<string, string[]>)[key] = value;
}

function intersects(left: string[] | undefined, right: string[]): boolean {
	return !left || left.some((value) => right.includes(value));
}

function allowedOperationsForResources(resources: string[], operations: OperationMap): string[] {
	return Array.from(new Set(resources.flatMap((resource) => operations[resource] || [])));
}

function buildResourceProperty(base: INodeProperties, config: OnPrintShopDomainConfig): INodeProperties {
	const property = clone(base);
	const allowed = new Set(config.resources);
	const options = ((property.options || []) as Array<{ name: string; value: string }>).filter((option) => allowed.has(option.value));

	if (config.resources.length === 1) {
		const hiddenResourceProperty: INodeProperties = {
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

function buildOperationProperty(base: INodeProperties, config: OnPrintShopDomainConfig): INodeProperties | undefined {
	const resourceValues = getShowArray(base, 'resource');
	if (!resourceValues || !intersects(resourceValues, config.resources)) return undefined;

	const resources = resourceValues.filter((resource) => config.resources.includes(resource));
	const allowedOps = new Set(allowedOperationsForResources(resources, config.operations));
	const property = clone(base);
	const options = ((property.options || []) as Array<{ name: string; value: string; action?: string }>).filter((option) => allowedOps.has(option.value));

	if (options.length === 0) return undefined;

	property.options = options;
	property.default = options.some((option) => option.value === property.default)
		? property.default
		: options[0].value;
	setShowArray(property, 'resource', resources);
	return property;
}

function buildDomainProperty(base: INodeProperties, config: OnPrintShopDomainConfig): INodeProperties | undefined {
	const resourceValues = getShowArray(base, 'resource');
	if (!resourceValues || !intersects(resourceValues, config.resources)) return undefined;

	const resources = resourceValues.filter((resource) => config.resources.includes(resource));
	const operationValues = getShowArray(base, 'operation');
	if (operationValues) {
		const allowedOps = allowedOperationsForResources(resources, config.operations);
		const operations = operationValues.filter((operation) => allowedOps.includes(operation));
		if (operations.length === 0) return undefined;

		const property = clone(base);
		setShowArray(property, 'resource', resources);
		setShowArray(property, 'operation', operations);
		return property;
	}

	const property = clone(base);
	setShowArray(property, 'resource', resources);
	return property;
}

export function buildOnPrintShopDomainDescription(config: OnPrintShopDomainConfig): INodeTypeDescription {
	const legacy = new OnPrintShop().description;
	const properties: INodeProperties[] = [];
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
			if (operationProperty) properties.push(operationProperty);
			continue;
		}

		const domainProperty = buildDomainProperty(baseProperty, config);
		if (domainProperty) properties.push(domainProperty);
	}

	return extendOnPrintShopDomainDescription({
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

export abstract class OnPrintShopDomainNode implements INodeType {
	description: INodeTypeDescription;

	// Delegates to OnPrintShop.execute(), which contains per-item continueOnFail handling.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const contractResult = await executeOnPrintShopContractAction(this);
		if (contractResult) return contractResult;
		return OnPrintShop.prototype.execute.call(this);
	}
}
