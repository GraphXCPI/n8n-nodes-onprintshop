import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import {
	compactObject,
	createOnPrintShopGraphqlClient,
	resultItems,
	rowsFromFixedCollection,
} from '../OnPrintShopGraphqlRequest';

type Field = INodeProperties;

const show = (resource: string, operations: string[]): INodeProperties['displayOptions'] => ({
	show: { resource: [resource], operation: operations },
});

const numberField = (
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	defaultValue = 0,
	required = false,
	description?: string,
): Field => ({
	displayName,
	name,
	type: 'number',
	default: defaultValue,
	required,
	displayOptions: show(resource, operations),
	description,
});

const stringField = (
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	required = false,
	description?: string,
): Field => ({
	displayName,
	name,
	type: 'string',
	default: '',
	required,
	displayOptions: show(resource, operations),
	description,
});

const paginationFields = (resource: string, operations: string[]): Field[] => [
	numberField('Limit', `${resource}Limit`, resource, operations, 50, false, 'Maximum records to return'),
	numberField('Offset', `${resource}Offset`, resource, operations, 0, false, 'Starting record offset'),
];

const yesNoOptions = [
	{ name: 'No', value: 0 },
	{ name: 'Yes', value: 1 },
];

const operationProperty = (resource: string, options: Array<{ name: string; value: string; action: string }>, defaultValue: string): Field => ({
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	default: defaultValue,
	displayOptions: { show: { resource: [resource] } },
	options,
});

const fixedCollection = (
	displayName: string,
	name: string,
	resource: string,
	operation: string,
	groupName: string,
	groupDisplayName: string,
	values: Field[],
	required = true,
	multipleValues = true,
): Field => ({
	displayName,
	name,
	type: 'fixedCollection',
	typeOptions: { multipleValues },
	default: {},
	required,
	displayOptions: show(resource, [operation]),
	placeholder: `Add ${groupDisplayName}`,
	options: [{ displayName: groupDisplayName, name: groupName, values }],
});

const nestedFixedCollection = (
	displayName: string,
	name: string,
	groupName: string,
	groupDisplayName: string,
	values: Field[],
	required = false,
): Field => ({
	displayName,
	name,
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	default: {},
	required,
	placeholder: `Add ${groupDisplayName}`,
	options: [{ displayName: groupDisplayName, name: groupName, values }],
});

const masterOptionValues: Field[] = [
	{ displayName: 'Master Option ID', name: 'master_option_id', type: 'number', default: 0, description: 'Use 0 to create; provide an ID to update or delete' },
	{ displayName: 'Title', name: 'title', type: 'string', default: '', required: true },
	{ displayName: 'Description', name: 'description', type: 'string', default: '' },
	{ displayName: 'Production Description', name: 'production_description', type: 'string', default: '' },
	{
		displayName: 'Option Type', name: 'options_type', type: 'options', default: 'combo', required: true,
		options: [
			{ name: 'Additional Information - TextBox', value: 'text' },
			{ name: 'Admin Only', value: 'admin_only' },
			{ name: 'Check Box', value: 'checkbox' },
			{ name: 'Date Picker', value: 'datepicker' },
			{ name: 'Drop Down', value: 'combo' },
			{ name: 'Radio Button', value: 'radio' },
			{ name: 'Text Area', value: 'area' },
			{ name: 'TextBox', value: 'textmp' },
			{ name: 'Upload File', value: 'file' },
			{ name: 'Upload Multiple Files', value: 'multiple_file' },
		],
	},
	{ displayName: 'Status', name: 'status', type: 'options', default: 1, options: yesNoOptions },
	{ displayName: 'Option Key', name: 'option_key', type: 'string', default: '' },
	{ displayName: 'Sort Order', name: 'sort_order', type: 'number', default: 0 },
	{ displayName: 'Export Group ID', name: 'prod_add_opt_export_group_id', type: 'number', default: 0 },
	{
		displayName: 'Pricing Method', name: 'pricing_method', type: 'options', default: 0, required: true,
		options: [
			{ name: 'Formula Based', value: 1 },
			{ name: 'Multiplier in Subtotal', value: 2 },
			{ name: 'Multiplier on Base Price', value: 3 },
			{ name: 'No Price', value: 0 },
		],
	},
	{ displayName: 'Linear Formula', name: 'linear_formula', type: 'options', default: 0, options: yesNoOptions },
	{
		displayName: 'Weight Setting', name: 'weight_setting', type: 'options', default: 0,
		options: [
			{ name: 'Multiply With Quantity', value: 0 },
			{ name: 'Multiply With Qty and Area', value: 1 },
			{ name: 'Multiply With Sheet', value: 4 },
			{ name: 'Product Specific Weight', value: 2 },
		],
	},
	{ displayName: 'Price Range Lookup', name: 'price_range_lookup', type: 'number', default: 0, description: 'Required for Formula Based pricing. IDs 1-13 follow the OPS API legend.' },
	{ displayName: 'Custom Lookup', name: 'custom_lookup', type: 'string', default: '', description: 'Required when Price Range Lookup is 13' },
	{ displayName: 'Predefined Formula ID', name: 'predefined_formula', type: 'number', default: 0 },
	{ displayName: 'Formula', name: 'formula', type: 'string', default: '' },
	{ displayName: 'Required', name: 'required', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Display in Calculator', name: 'display_in_calculator', type: 'options', default: 0, options: yesNoOptions },
	{
		displayName: 'Option Position', name: 'option_position', type: 'options', default: 'I',
		options: [
			{ name: 'Default', value: 'I' },
			{ name: 'Side by Side', value: 'S' },
			{ name: 'Side by Side with Offset', value: 'SO' },
			{ name: 'Up and Down', value: 'B' },
			{ name: 'Up and Down with Offset', value: 'BO' },
		],
	},
	{ displayName: 'Description Position', name: 'desc_position', type: 'number', default: 0 },
	{ displayName: 'Display Above Size', name: 'display_above_size', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Presentation Group ID', name: 'presentation_group', type: 'number', default: 0 },
	{ displayName: 'Exclude Setup Cost on Reorder', name: 'exclude_setup_cost_reorder', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Master Option Tag IDs', name: 'master_option_tag', type: 'string', default: '', description: 'Comma-separated tag IDs' },
	{ displayName: 'Hire Designer Option', name: 'hire_designer_option', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Hide From Calculator', name: 'hide_from_calc', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Enable Associated Quantity', name: 'enable_assoc_qty', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Allow Price Calculation', name: 'allow_price_cal', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'External Reference', name: 'external_ref', type: 'string', default: '' },
	{ displayName: 'Delete', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
];

const attributeValues: Field[] = [
	{ displayName: 'Master Attribute ID', name: 'master_attribute_id', type: 'number', default: 0 },
	{ displayName: 'Master Option ID', name: 'master_option_id', type: 'number', default: 0, required: true },
	{ displayName: 'Label', name: 'label', type: 'string', default: '', required: true },
	{ displayName: 'Attribute Key', name: 'attribute_key', type: 'string', default: '' },
	{ displayName: 'Description', name: 'attr_desc', type: 'string', default: '' },
	{ displayName: 'Image', name: 'attributes_image', type: 'string', default: '', description: 'Filename or URL under images/product_icon' },
	{ displayName: 'Order Product Status ID', name: 'op_statusid', type: 'number', default: 0 },
	{ displayName: 'Hex Color', name: 'hex_color', type: 'color', default: '#000000' },
	{ displayName: 'Default Attribute', name: 'default_attribute', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Sort Order', name: 'sort_order', type: 'number', default: 0 },
	{ displayName: 'Status', name: 'status', type: 'options', default: 1, options: yesNoOptions },
	{ displayName: 'Setup Cost', name: 'setup_cost', type: 'number', default: 0 },
	{ displayName: 'Multiplier', name: 'multiplier', type: 'number', default: 0 },
	{ displayName: 'Weight', name: 'weight', type: 'number', default: 0 },
	{ displayName: 'Material Thickness', name: 'material_thickness', type: 'number', default: 0 },
	{ displayName: 'Production Days', name: 'production_days', type: 'number', default: 0 },
	{ displayName: 'Production Description', name: 'production_description', type: 'string', default: '' },
	{ displayName: 'Delete', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
];

const rangeValues: Field[] = [
	{ displayName: 'From', name: 'from_range', type: 'number', default: 1, required: true },
	{ displayName: 'To', name: 'to_range', type: 'number', default: 1, required: true },
	{ displayName: 'Delete', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
];

const priceValues: Field[] = [
	{ displayName: 'Range ID', name: 'range_id', type: 'number', default: 0, required: true },
	{ displayName: 'Price', name: 'price', type: 'number', default: 0 },
	{ displayName: 'Vendor Price', name: 'vendor_price', type: 'number', default: 0 },
	{ displayName: 'Site Admin Markup', name: 'site_admin_markup', type: 'number', default: 0 },
	{ displayName: 'Delete', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
];

const ruleValues: Field[] = [
	{ displayName: 'Rule ID', name: 'rule_id', type: 'number', default: 0 },
	{ displayName: 'Rule Name', name: 'rule_name', type: 'string', default: '', required: true },
	{
		displayName: 'Rule Type', name: 'rule_type', type: 'options', default: 'additional_option_based', required: true,
		options: [
			{ name: 'Additional Option Based', value: 'additional_option_based' },
			{ name: 'Size-Additional Option Based', value: 'param_additional_option_based' },
			{ name: 'Size-Quantity-Additional Option Based', value: 'param_quantity_additional_option_based' },
			{ name: 'Size-Quantity Based', value: 'param_quantity_based' },
		],
	},
	{ displayName: 'Source Option IDs', name: 'source_option_ids', type: 'string', default: '', description: 'Comma-separated and positionally paired with Source Attribute IDs' },
	{ displayName: 'Source Attribute IDs', name: 'source_attribute_ids', type: 'string', default: '' },
	{ displayName: 'Hide Option IDs', name: 'hide_option_ids', type: 'string', default: '' },
	{ displayName: 'Hide Option Attribute IDs', name: 'hide_option_attribute_ids', type: 'string', default: '' },
	{ displayName: 'Status', name: 'status', type: 'options', default: 1, options: yesNoOptions },
	{
		displayName: 'Custom Parameter', name: 'custom_param', type: 'options', default: 'area',
		options: [
			{ name: 'Area', value: 'area' }, { name: 'Height', value: 'height' },
			{ name: 'Perimeter', value: 'perimeter' }, { name: 'Size', value: 'size' }, { name: 'Width', value: 'width' },
		],
	},
	{ displayName: 'Quantity Selection', name: 'rules_quantity_select', type: 'options', default: 0, options: [{ name: 'All Quantities', value: 0 }, { name: 'Specific Range', value: 1 }] },
	{ displayName: 'Quantity From', name: 'rules_quantity', type: 'number', default: 0 },
	{ displayName: 'Quantity To', name: 'rules_quantity_to', type: 'number', default: 0 },
	{ displayName: 'Custom Value From', name: 'custom_param_val', type: 'number', default: 0 },
	{ displayName: 'Custom Value To', name: 'custom_param_val_to', type: 'number', default: 0 },
	{ displayName: 'Width From', name: 'custom_param_width', type: 'number', default: 0 },
	{ displayName: 'Width To', name: 'custom_param_width_to', type: 'number', default: 0 },
	{ displayName: 'Height From', name: 'custom_param_height', type: 'number', default: 0 },
	{ displayName: 'Height To', name: 'custom_param_height_to', type: 'number', default: 0 },
	{ displayName: 'Sort Order', name: 'sort_order', type: 'number', default: 99999 },
	{ displayName: 'Hide Size IDs', name: 'hide_size_ids', type: 'string', default: '' },
	nestedFixedCollection('Textbox Conditions', 'opt_textbox_conditions', 'condition', 'Condition', [
		{ displayName: 'Option Key', name: 'opt_key', type: 'string', default: '', required: true, description: 'Format optionId_attributeId; use _0 for an entire option' },
		{ displayName: 'Comparison', name: 'opt_comparison', type: 'options', default: '=', options: [{ name: 'Between', value: '<=>' }, { name: 'Equal', value: '=' }, { name: 'Greater or Equal', value: '>=' }, { name: 'Less or Equal', value: '<=' }] },
		{ displayName: 'Value From', name: 'opt_val_from', type: 'number', default: 0 },
		{ displayName: 'Value To', name: 'opt_val_to', type: 'number', default: 0 },
	]),
	{ displayName: 'Condition', name: 'condition', type: 'options', default: 'AND', options: [{ name: 'AND', value: 'AND' }, { name: 'OR', value: 'OR' }] },
	{ displayName: 'Disabled for Admin', name: 'disabled_for_admin', type: 'options', default: 0, options: yesNoOptions },
	{ displayName: 'Delete', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
];

function normalizeNestedRows(row: IDataObject): IDataObject {
	const normalized = compactObject(row);
	for (const [name, group] of [
		['ranges', 'range'], ['prices', 'price'], ['opt_textbox_conditions', 'condition'],
		['multipliers', 'multiplier'], ['attributes', 'attribute'], ['combinations', 'combination'],
	] as Array<[string, string]>) {
		if (normalized[name] && typeof normalized[name] === 'object' && !Array.isArray(normalized[name])) {
			normalized[name] = rowsFromFixedCollection(normalized[name], group).map(normalizeNestedRows);
		}
	}
	return normalized;
}

function requiredResult(data: IDataObject, field: string, node: ReturnType<IExecuteFunctions['getNode']>, itemIndex: number): unknown {
	if (data[field] === undefined) {
		throw new NodeOperationError(node, `OnPrintShop response did not include ${field}`, { itemIndex });
	}
	return data[field];
}

export class OnPrintShopMasterOptions implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OnPrintShop Master Options',
		name: 'onPrintShopMasterOptions',
		icon: { light: 'file:onprintshop-light.svg', dark: 'file:onprintshop-dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Manage OnPrintShop master options, attributes, formulas, rules, ranges, prices, tags, groups, and stock',
		defaults: { name: 'OnPrintShop Master Options' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'onPrintShopApi', required: true }],
		properties: [
			{
				displayName: 'Resource', name: 'resource', type: 'options', noDataExpression: true, default: 'masterOption',
				options: [
					{ name: 'Attribute', value: 'attribute' },
					{ name: 'Attribute Price', value: 'attributePrice' },
					{ name: 'Formula', value: 'formula' },
					{ name: 'Master Option', value: 'masterOption' },
					{ name: 'Option Group', value: 'optionGroup' },
					{ name: 'Range', value: 'range' },
					{ name: 'Rule', value: 'rule' },
					{ name: 'Stock', value: 'stock' },
					{ name: 'Tag', value: 'tag' },
				],
			},
			operationProperty('masterOption', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many master options' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete master options' },
			], 'getMany'),
			operationProperty('attribute', [{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete master option attributes' }], 'set'),
			operationProperty('attributePrice', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many master option attribute prices' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete master option attribute prices' },
			], 'getMany'),
			operationProperty('range', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many master option ranges' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete master option ranges' },
			], 'getMany'),
			operationProperty('tag', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many master option tags' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete master option tags' },
			], 'getMany'),
			operationProperty('optionGroup', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many option groups' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete option groups' },
			], 'getMany'),
			operationProperty('formula', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many custom formulas' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete custom formulas' },
			], 'getMany'),
			operationProperty('rule', [
				{ name: 'Get Many', value: 'getMany', action: 'Get many product option rules' },
				{ name: 'Create, Update, or Delete', value: 'set', action: 'Create update or delete product option rules' },
			], 'getMany'),
			operationProperty('stock', [
				{ name: 'Add Configuration', value: 'addConfig', action: 'Add master option stock configuration' },
				{ name: 'Delete Configuration', value: 'deleteConfig', action: 'Delete master option stock configuration' },
				{ name: 'Get Combination Matrix', value: 'getCombinationMatrix', action: 'Get master option stock combination matrix' },
				{ name: 'Get Configurations', value: 'getConfigs', action: 'Get master option stock configurations' },
				{ name: 'Get History', value: 'getHistory', action: 'Get master option stock history' },
				{ name: 'Set Settings', value: 'setSettings', action: 'Set master option stock settings' },
				{ name: 'Update Stock', value: 'updateStock', action: 'Credit or debit master option stock' },
			], 'getConfigs'),

			numberField('Master Option ID', 'masterOptionId', 'masterOption', ['getMany'], 0, false, 'Optional master option ID filter'),
			...paginationFields('masterOption', ['getMany']),
			fixedCollection('Master Options', 'masterOptions', 'masterOption', 'set', 'item', 'Master Option', masterOptionValues),

			fixedCollection('Attributes', 'attributes', 'attribute', 'set', 'item', 'Attribute', attributeValues),
			numberField('Attribute ID', 'attributePriceId', 'attributePrice', ['getMany']),
			...paginationFields('attributePrice', ['getMany']),
			fixedCollection('Attribute Prices', 'attributePrices', 'attributePrice', 'set', 'item', 'Attribute Price', [
				{ displayName: 'Attribute ID', name: 'attr_id', type: 'number', default: 0, required: true },
				{ displayName: 'Delete All Prices', name: 'delete', type: 'options', default: 0, options: yesNoOptions },
				nestedFixedCollection('Prices', 'prices', 'price', 'Price', priceValues),
			]),

			numberField('Range ID', 'rangeId', 'range', ['getMany']),
			numberField('Master Option ID', 'rangeOptionId', 'range', ['getMany']),
			...paginationFields('range', ['getMany']),
			numberField('Master Option ID', 'setRangeOptionId', 'range', ['set'], 0, true),
			{ displayName: 'Delete All Ranges', name: 'deleteAllRanges', type: 'boolean', default: false, displayOptions: show('range', ['set']) },
			fixedCollection('Ranges', 'ranges', 'range', 'set', 'range', 'Range', rangeValues),

			numberField('Tag ID', 'tagId', 'tag', ['getMany']),
			...paginationFields('tag', ['getMany']),
			numberField('Tag ID', 'setTagId', 'tag', ['set']),
			stringField('Tag Name', 'tagName', 'tag', ['set'], true),
			{ displayName: 'Delete', name: 'deleteTag', type: 'boolean', default: false, displayOptions: show('tag', ['set']) },

			numberField('Option Group ID', 'optionGroupId', 'optionGroup', ['getMany']),
			stringField('Use For', 'optionGroupUseFor', 'optionGroup', ['getMany']),
			...paginationFields('optionGroup', ['getMany']),
			numberField('Option Group ID', 'setOptionGroupId', 'optionGroup', ['set']),
			stringField('Group Name', 'optionGroupName', 'optionGroup', ['set'], true),
			{ displayName: 'Use For', name: 'setOptionGroupUseFor', type: 'options', default: 0, displayOptions: show('optionGroup', ['set']), options: [{ name: 'Both', value: 2 }, { name: 'Export Order Group', value: 1 }, { name: 'Presentation Group', value: 0 }] },
			{ displayName: 'Display Style', name: 'optionGroupDisplayStyle', type: 'options', default: 1, displayOptions: show('optionGroup', ['set']), options: [{ name: 'Default', value: 1 }, { name: 'Inline', value: 0 }] },
			numberField('Options per Row', 'optionGroupCount', 'optionGroup', ['set'], 1),
			{ displayName: 'Expanded', name: 'optionGroupExpanded', type: 'boolean', default: true, displayOptions: show('optionGroup', ['set']) },
			numberField('Sort Order', 'optionGroupSortOrder', 'optionGroup', ['set']),
			{ displayName: 'Delete', name: 'deleteOptionGroup', type: 'boolean', default: false, displayOptions: show('optionGroup', ['set']) },

			numberField('Formula ID', 'formulaId', 'formula', ['getMany']),
			...paginationFields('formula', ['getMany']),
			numberField('Formula ID', 'setFormulaId', 'formula', ['set']),
			stringField('Formula Label', 'formulaLabel', 'formula', ['set'], true),
			stringField('Formula Syntax', 'formulaSyntax', 'formula', ['set'], true),
			{ displayName: 'Delete', name: 'deleteFormula', type: 'boolean', default: false, displayOptions: show('formula', ['set']) },

			numberField('Rule ID', 'ruleId', 'rule', ['getMany']),
			...paginationFields('rule', ['getMany']),
			fixedCollection('Rule', 'rules', 'rule', 'set', 'item', 'Rule', ruleValues, true, false),

			numberField('Config ID', 'stockConfigId', 'stock', ['getConfigs', 'deleteConfig']),
			numberField('Config ID', 'stockHistoryConfigId', 'stock', ['getHistory'], 0, true, 'Stock configuration ID whose history will be returned'),
			...paginationFields('stock', ['getConfigs', 'getHistory']),
			stringField('Option Filter', 'stockOptionFilter', 'stock', ['getConfigs'], false, 'Comma-separated master option IDs'),
			stringField('Option IDs', 'stockMatrixOptionIds', 'stock', ['getCombinationMatrix'], true, 'Comma-separated IDs; at least two are required'),
			stringField('Option IDs', 'stockDeleteOptionIds', 'stock', ['deleteConfig'], false, 'Use either Config ID or Option IDs, not both'),
			{
				displayName: 'Stock Type', name: 'stockType', type: 'options', default: 1, required: true, displayOptions: show('stock', ['addConfig']),
				options: [{ name: 'Attribute Wise', value: 2 }, { name: 'Combination Wise', value: 3 }, { name: 'Option Wise', value: 1 }],
			},
			numberField('Master Option ID', 'stockOptionId', 'stock', ['addConfig']),
			numberField('Default Stock', 'stockDefault', 'stock', ['addConfig'], 1),
			{ displayName: 'Use Custom Multipliers', name: 'stockCustomMultiplier', type: 'boolean', default: false, displayOptions: show('stock', ['addConfig']) },
			numberField('Apply to All', 'stockApplyToAll', 'stock', ['addConfig']),
			fixedCollection('Multipliers', 'stockMultipliers', 'stock', 'addConfig', 'multiplier', 'Multiplier', [
				{ displayName: 'Attribute ID', name: 'attribute_id', type: 'number', default: 0, required: true },
				{ displayName: 'Multiplier', name: 'multiplier', type: 'number', default: 1, required: true },
			], false),
			fixedCollection('Attribute Stock', 'stockAttributes', 'stock', 'addConfig', 'attribute', 'Attribute Stock', [
				{ displayName: 'Attribute ID', name: 'attribute_id', type: 'number', default: 0, required: true },
				{ displayName: 'Stock', name: 'stock', type: 'number', default: 1, required: true },
			], false),
			fixedCollection('Combination Stock', 'stockCombinations', 'stock', 'addConfig', 'combination', 'Combination Stock', [
				{ displayName: 'Option IDs', name: 'option_ids', type: 'string', default: '', required: true },
				{ displayName: 'Attribute IDs', name: 'attribute_ids', type: 'string', default: '', required: true },
				{ displayName: 'Stock', name: 'stock', type: 'number', default: 1, required: true },
			], false),
			fixedCollection('Stock Changes', 'stockChanges', 'stock', 'updateStock', 'item', 'Stock Change', [
				{ displayName: 'Config ID', name: 'config_id', type: 'number', default: 0, required: true },
				{ displayName: 'Quantity', name: 'stock_quantity', type: 'number', default: 1, required: true },
				{ displayName: 'Change Type', name: 'change_type', type: 'options', default: 'C', options: [{ name: 'Credit', value: 'C' }, { name: 'Debit', value: 'D' }] },
				{ displayName: 'Comments', name: 'comments', type: 'string', default: '' },
			]),
			fixedCollection('Stock Settings', 'stockSettings', 'stock', 'setSettings', 'item', 'Stock Setting', [
				{ displayName: 'Master Option ID', name: 'option_id', type: 'number', default: 0, required: true },
				{ displayName: 'Allow Out-of-Stock Orders', name: 'allow_order_out_of_stock', type: 'options', default: 0, options: yesNoOptions },
				{ displayName: 'Notify Quantity', name: 'notify_quantity', type: 'number', default: 0, required: true },
			]),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const output: INodeExecutionData[] = [];
		const request = await createOnPrintShopGraphqlClient(this);

		for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let data: IDataObject;
				let result: unknown;

				if (resource === 'masterOption' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('masterOptionLimit', itemIndex), offset: this.getNodeParameter('masterOptionOffset', itemIndex) };
					const id = this.getNodeParameter('masterOptionId', itemIndex) as number;
					if (id) variables.master_option_id = id;
					data = await request(`query productMasterOptions ($master_option_id: Int, $limit: Int, $offset: Int) { productMasterOptions (master_option_id: $master_option_id, limit: $limit, offset: $offset) { productMasterOptions { master_option_id production_description external_ref title description option_key pricing_method status sort_order options_type linear_formula formula weight_setting price_range_lookup additional_lookup_details hide_from_calc enable_assoc_qty allow_price_cal hire_designer_option required display_in_calculator option_position desc_position display_above_size presentation_group prod_add_opt_export_group_id exclude_setup_cost_reorder master_option_tag attributes } totalProductMasterOptions currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'productMasterOptions', this.getNode(), itemIndex);
				} else if (resource === 'masterOption' && operation === 'set') {
					const inputs = rowsFromFixedCollection(this.getNodeParameter('masterOptions', itemIndex), 'item').map(normalizeNestedRows);
					data = await request(`mutation setMasterOption ($inputs: [MasterOptionInput!]!) { setMasterOption (inputs: $inputs) { index result message id external_ref } }`, { inputs }, itemIndex);
					result = requiredResult(data, 'setMasterOption', this.getNode(), itemIndex);
				} else if (resource === 'attribute' && operation === 'set') {
					const inputs = rowsFromFixedCollection(this.getNodeParameter('attributes', itemIndex), 'item').map(normalizeNestedRows);
					data = await request(`mutation setMasterOptionAttributes ($inputs: [MasterOptionAttributesInput!]!) { setMasterOptionAttributes (inputs: $inputs) { index result message id } }`, { inputs }, itemIndex);
					result = requiredResult(data, 'setMasterOptionAttributes', this.getNode(), itemIndex);
				} else if (resource === 'attributePrice' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('attributePriceLimit', itemIndex), offset: this.getNodeParameter('attributePriceOffset', itemIndex) };
					const id = this.getNodeParameter('attributePriceId', itemIndex) as number;
					if (id) variables.attr_id = id;
					data = await request(`query productOptionsPrice ($attr_id: Int, $limit: Int, $offset: Int) { productOptionsPrice (attr_id: $attr_id, limit: $limit, offset: $offset) { productOptionsPrice { attr_id range_id price vendor_price from_range to_range site_admin_markup } totalProductOptionPrice currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'productOptionsPrice', this.getNode(), itemIndex);
				} else if (resource === 'attributePrice' && operation === 'set') {
					const inputs = rowsFromFixedCollection(this.getNodeParameter('attributePrices', itemIndex), 'item').map(normalizeNestedRows);
					data = await request(`mutation setMasterOptionAttributePrice ($inputs: [MasterOptionAttributePriceInput!]!) { setMasterOptionAttributePrice (inputs: $inputs) { index result message id } }`, { inputs }, itemIndex);
					result = requiredResult(data, 'setMasterOptionAttributePrice', this.getNode(), itemIndex);
				} else if (resource === 'range' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('rangeLimit', itemIndex), offset: this.getNodeParameter('rangeOffset', itemIndex) };
					const rangeId = this.getNodeParameter('rangeId', itemIndex) as number;
					const optionId = this.getNodeParameter('rangeOptionId', itemIndex) as number;
					if (rangeId) variables.range_id = rangeId;
					if (optionId) variables.option_id = optionId;
					data = await request(`query getMasterOptionRange ($range_id: Int, $option_id: Int, $limit: Int, $offset: Int) { getMasterOptionRange (range_id: $range_id, option_id: $option_id, limit: $limit, offset: $offset) { masterOptionRange { range_id option_id from_range to_range } totalMasterOptionRange currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'getMasterOptionRange', this.getNode(), itemIndex);
				} else if (resource === 'range' && operation === 'set') {
					const input: IDataObject = { option_id: this.getNodeParameter('setRangeOptionId', itemIndex), ranges: rowsFromFixedCollection(this.getNodeParameter('ranges', itemIndex), 'range').map(normalizeNestedRows) };
					if (this.getNodeParameter('deleteAllRanges', itemIndex) as boolean) input.delete = 1;
					data = await request(`mutation setMasterOptionRange ($input: MasterOptionRangeInput!) { setMasterOptionRange (input: $input) { result message id } }`, { input }, itemIndex);
					result = requiredResult(data, 'setMasterOptionRange', this.getNode(), itemIndex);
				} else if (resource === 'tag' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('tagLimit', itemIndex), offset: this.getNodeParameter('tagOffset', itemIndex) };
					const id = this.getNodeParameter('tagId', itemIndex) as number;
					if (id) variables.master_option_tag_id = id;
					data = await request(`query getMasterOptionTag ($master_option_tag_id: Int, $limit: Int, $offset: Int) { getMasterOptionTag (master_option_tag_id: $master_option_tag_id, limit: $limit, offset: $offset) { masterOptionTag { master_option_tag_id master_option_tag_name } totalMasterOptionTag currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'getMasterOptionTag', this.getNode(), itemIndex);
				} else if (resource === 'tag' && operation === 'set') {
					const input: IDataObject = { master_option_tag_id: this.getNodeParameter('setTagId', itemIndex), master_option_tag_name: this.getNodeParameter('tagName', itemIndex), delete: this.getNodeParameter('deleteTag', itemIndex) ? 1 : 0 };
					data = await request(`mutation setMasterOptionTag ($input: MasterOptionTagInput!) { setMasterOptionTag (input: $input) { result message id } }`, { input }, itemIndex);
					result = requiredResult(data, 'setMasterOptionTag', this.getNode(), itemIndex);
				} else if (resource === 'optionGroup' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('optionGroupLimit', itemIndex), offset: this.getNodeParameter('optionGroupOffset', itemIndex) };
					const id = this.getNodeParameter('optionGroupId', itemIndex) as number;
					const useFor = this.getNodeParameter('optionGroupUseFor', itemIndex) as string;
					if (id) variables.prod_add_opt_group_id = id;
					if (useFor) variables.use_for = useFor;
					data = await request(`query getOptionGroup ($prod_add_opt_group_id: Int, $use_for: String, $limit: Int, $offset: Int) { getOptionGroup (prod_add_opt_group_id: $prod_add_opt_group_id, use_for: $use_for, limit: $limit, offset: $offset) { optionGroup { prod_add_opt_group_id opt_group_name use_for display_style option_count is_collapse sort_order } totalOptionGroup currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'getOptionGroup', this.getNode(), itemIndex);
				} else if (resource === 'optionGroup' && operation === 'set') {
					const input: IDataObject = { prod_add_opt_group_id: this.getNodeParameter('setOptionGroupId', itemIndex), opt_group_name: this.getNodeParameter('optionGroupName', itemIndex), use_for: String(this.getNodeParameter('setOptionGroupUseFor', itemIndex)), display_style: String(this.getNodeParameter('optionGroupDisplayStyle', itemIndex)), option_count: this.getNodeParameter('optionGroupCount', itemIndex), is_collapse: this.getNodeParameter('optionGroupExpanded', itemIndex) ? '1' : '0', sort_order: this.getNodeParameter('optionGroupSortOrder', itemIndex), delete: this.getNodeParameter('deleteOptionGroup', itemIndex) ? 1 : 0 };
					data = await request(`mutation setOptionGroup ($input: OptionGroupInput!) { setOptionGroup (input: $input) { result message id } }`, { input }, itemIndex);
					result = requiredResult(data, 'setOptionGroup', this.getNode(), itemIndex);
				} else if (resource === 'formula' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('formulaLimit', itemIndex), offset: this.getNodeParameter('formulaOffset', itemIndex) };
					const id = this.getNodeParameter('formulaId', itemIndex) as number;
					if (id) variables.formula_id = id;
					data = await request(`query getCustomFormula ($formula_id: Int, $limit: Int, $offset: Int) { getCustomFormula (formula_id: $formula_id, limit: $limit, offset: $offset) { customFormula { formula_id formula_label formula_syntax } totalCustomFormula currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'getCustomFormula', this.getNode(), itemIndex);
				} else if (resource === 'formula' && operation === 'set') {
					const input: IDataObject = { formula_id: this.getNodeParameter('setFormulaId', itemIndex), formula_label: this.getNodeParameter('formulaLabel', itemIndex), formula_syntax: this.getNodeParameter('formulaSyntax', itemIndex), delete: this.getNodeParameter('deleteFormula', itemIndex) ? 1 : 0 };
					data = await request(`mutation setCustomFormula ($input: CustomFormulaInput!) { setCustomFormula (input: $input) { result message id } }`, { input }, itemIndex);
					result = requiredResult(data, 'setCustomFormula', this.getNode(), itemIndex);
				} else if (resource === 'rule' && operation === 'getMany') {
					const variables: IDataObject = { limit: this.getNodeParameter('ruleLimit', itemIndex), offset: this.getNodeParameter('ruleOffset', itemIndex) };
					const id = this.getNodeParameter('ruleId', itemIndex) as number;
					if (id) variables.rule_id = id;
					data = await request(`query productOptionRules ($rule_id: Int, $limit: Int, $offset: Int) { productOptionRules (rule_id: $rule_id, limit: $limit, offset: $offset) { productOptionRules { rule_id rule_name rule_type source_option_ids source_attribute_ids hide_option_ids hide_option_attribute_ids status sort_order comparison_value disabled_for_admin } totalProductOptionRules currentCount } }`, variables, itemIndex);
					result = requiredResult(data, 'productOptionRules', this.getNode(), itemIndex);
				} else if (resource === 'rule' && operation === 'set') {
					const rules = rowsFromFixedCollection(this.getNodeParameter('rules', itemIndex), 'item').map(normalizeNestedRows);
					if (rules.length !== 1) throw new NodeOperationError(this.getNode(), 'Exactly one product option rule is required', { itemIndex });
					const input = rules[0];
					data = await request(`mutation setProductOptionRules ($input: ProductOptionRulesInput!) { setProductOptionRules (input: $input) { result message id } }`, { input }, itemIndex);
					result = requiredResult(data, 'setProductOptionRules', this.getNode(), itemIndex);
				} else if (resource === 'stock') {
					if (operation === 'getConfigs') {
						const variables: IDataObject = { limit: this.getNodeParameter('stockLimit', itemIndex), offset: this.getNodeParameter('stockOffset', itemIndex) };
						const configId = this.getNodeParameter('stockConfigId', itemIndex) as number;
						const filter = String(this.getNodeParameter('stockOptionFilter', itemIndex) || '').split(',').map(Number).filter(Boolean);
						if (configId) variables.config_id = configId;
						if (filter.length) variables.optionFilter = filter;
						data = await request(`query getMasterOptionStockConfigs($limit: Int, $offset: Int, $config_id: Int, $optionFilter: [Int]) { getMasterOptionStockConfigs(limit: $limit, offset: $offset, config_id: $config_id, optionFilter: $optionFilter) { groups { group_title stock_type stock_type_id option_ids allow_out_of_stock notify_quantity configs { id option_ids attribute_ids stock type credit_stock debit_stock stock_title stock_label } } totalRecords currentCount } }`, variables, itemIndex);
						result = requiredResult(data, 'getMasterOptionStockConfigs', this.getNode(), itemIndex);
					} else if (operation === 'getHistory') {
						const configId = this.getNodeParameter('stockHistoryConfigId', itemIndex) as number;
						if (configId <= 0) throw new NodeOperationError(this.getNode(), 'Config ID must be greater than zero', { itemIndex });
						const variables: IDataObject = { config_id: configId, limit: this.getNodeParameter('stockLimit', itemIndex), offset: this.getNodeParameter('stockOffset', itemIndex) };
						data = await request(`query getMasterOptionStockHistory($config_id: Int!, $limit: Int, $offset: Int) { getMasterOptionStockHistory(config_id: $config_id, limit: $limit, offset: $offset) { history { id config_id stock_change change_type comments date_added } totalRecords currentCount } }`, variables, itemIndex);
						result = requiredResult(data, 'getMasterOptionStockHistory', this.getNode(), itemIndex);
					} else if (operation === 'getCombinationMatrix') {
						const optionIds = String(this.getNodeParameter('stockMatrixOptionIds', itemIndex)).split(',').map(Number).filter(Boolean);
						if (optionIds.length < 2) throw new NodeOperationError(this.getNode(), 'Combination Matrix requires at least two option IDs', { itemIndex });
						data = await request(`query getMasterOptionCombinationMatrix($option_ids: [Int!]!) { getMasterOptionCombinationMatrix(option_ids: $option_ids) { matrix { option_ids attribute_ids } totalRecords } }`, { option_ids: optionIds }, itemIndex);
						result = requiredResult(data, 'getMasterOptionCombinationMatrix', this.getNode(), itemIndex);
					} else if (operation === 'addConfig') {
						const input: IDataObject = { stock_type: this.getNodeParameter('stockType', itemIndex), option_id: this.getNodeParameter('stockOptionId', itemIndex), default_stock: this.getNodeParameter('stockDefault', itemIndex), custom_multiplier: this.getNodeParameter('stockCustomMultiplier', itemIndex) ? 1 : 0, apply_to_all: this.getNodeParameter('stockApplyToAll', itemIndex), multipliers: rowsFromFixedCollection(this.getNodeParameter('stockMultipliers', itemIndex), 'multiplier').map(normalizeNestedRows), attributes: rowsFromFixedCollection(this.getNodeParameter('stockAttributes', itemIndex), 'attribute').map(normalizeNestedRows), combinations: rowsFromFixedCollection(this.getNodeParameter('stockCombinations', itemIndex), 'combination').map(normalizeNestedRows) };
						data = await request(`mutation addMasterOptionStockConfig($input: AddMasterOptionStockConfigInput!) { addMasterOptionStockConfig(input: $input) { index result message id } }`, { input: compactObject(input) }, itemIndex);
						result = requiredResult(data, 'addMasterOptionStockConfig', this.getNode(), itemIndex);
					} else if (operation === 'deleteConfig') {
						const variables: IDataObject = {};
						const configId = this.getNodeParameter('stockConfigId', itemIndex) as number;
						const optionIds = this.getNodeParameter('stockDeleteOptionIds', itemIndex) as string;
						if (Boolean(configId) === Boolean(optionIds)) throw new NodeOperationError(this.getNode(), 'Provide exactly one of Config ID or Option IDs', { itemIndex });
						if (configId) variables.config_id = configId;
						if (optionIds) variables.option_ids = optionIds;
						data = await request(`mutation deleteMasterOptionStockConfig($config_id: Int, $option_ids: String) { deleteMasterOptionStockConfig(config_id: $config_id, option_ids: $option_ids) { index result message id } }`, variables, itemIndex);
						result = requiredResult(data, 'deleteMasterOptionStockConfig', this.getNode(), itemIndex);
					} else if (operation === 'updateStock') {
						const inputs = rowsFromFixedCollection(this.getNodeParameter('stockChanges', itemIndex), 'item').map(normalizeNestedRows);
						data = await request(`mutation updateMasterOptionStock($inputs: [UpdateMasterOptionStockInput!]!) { updateMasterOptionStock(inputs: $inputs) { index result message id } }`, { inputs }, itemIndex);
						result = requiredResult(data, 'updateMasterOptionStock', this.getNode(), itemIndex);
					} else {
						const inputs = rowsFromFixedCollection(this.getNodeParameter('stockSettings', itemIndex), 'item').map(normalizeNestedRows);
						data = await request(`mutation setMasterOptionStockSettings($inputs: [SetMasterOptionStockSettingsInput!]!) { setMasterOptionStockSettings(inputs: $inputs) { index result message id } }`, { inputs }, itemIndex);
						result = requiredResult(data, 'setMasterOptionStockSettings', this.getNode(), itemIndex);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported Master Options operation ${resource}.${operation}`, { itemIndex });
				}

				output.push(...resultItems(result, itemIndex));
				} catch (error) {
					if (this.continueOnFail()) output.push({ json: { error: (error as Error).message }, pairedItem: { item: itemIndex } });
					else throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
		}

		return [output];
	}
}
