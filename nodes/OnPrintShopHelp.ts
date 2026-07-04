import {
	INodeProperties,
	INodeTypeDescription,
} from 'n8n-workflow';

export const ONPRINTSHOP_OPERATOR_DOC_URL = 'https://github.com/GraphXCPI/n8n-nodes-onprintshop/blob/main/docs/NODE_OPERATOR_GUIDE.md';
export const ONPRINTSHOP_POSTMAN_DOC_URL = 'https://documenter.getpostman.com/view/33263100/2sBXijHWys#intro';

type OperationOption = {
	name?: string;
	value?: string | number | boolean;
	description?: string;
	action?: string;
};

type ParameterHelp = {
	description?: string;
	hint?: string;
	placeholder?: string;
};

export type OnPrintShopFieldSelectionMode = 'custom' | 'all' | 'none';

export const ONPRINTSHOP_FIELD_SELECTION_MODE_SUFFIX = 'Mode';

const RESOURCE_HELP: Record<string, string> = {
	customer: 'Customer actions read, create, or update OnPrintShop customer accounts. Use Customer Address for address lists and keep customer writes isolated from order workflows.',
	customerAddress: 'Customer Address actions list saved customer addresses. Use these before shipping or billing workflows that need address IDs.',
	graphql: 'Raw GraphQL is an escape hatch for approved OnPrintShop operations that do not have a domain-node action yet. Repeated use should be promoted into a first-class action.',
	order: 'Order actions read order headers, order shipments, and shipment creation data. Use order-product actions for product-level proof or status work.',
	orderDetails: 'Order Details returns expanded order payloads. Use this when the order header is not enough for downstream routing.',
	orderShipment: 'Order Shipment lists shipment records. Use Create Shipment only in workflows that intentionally write shipment data.',
	orderProducts: 'Order Products is for line-item proof, design, and status workflows. These actions can affect production status, so keep write workflows explicit.',
	shipToMultipleAddress: 'Ship To Multiple actions read split-shipping addresses for an order. Use order_id filters to avoid large responses.',
	batch: 'Batch actions read production batch metadata used by order and fulfillment workflows.',
	quote: 'Quote actions read quote headers. Use Quote Product for line-level quote product details.',
	quoteProduct: 'Quote Product actions read product rows attached to quotes.',
	status: 'Status actions read order and order-product status reference data. Use these values when mapping OPS state to automation state.',
	product: 'Product actions read catalog records, pricing, option, SKU, and stock data. Use Product Builder for product writes.',
	productStocks: 'Product Stocks lists stock records across products. Use product-level stock actions when you already know the product ID or SKU.',
	masterOptionStock: 'Master Option Stock manages inventory tied to master-option combinations. Use matrix/config reads before write actions.',
	mutation: 'Mutation actions write OPS catalog, order, store, or reference data. Inputs are JSON arrays unless the field says otherwise.',
	department: 'Department actions manage store department reference data.',
	countries: 'Countries actions read country reference data for store and address workflows.',
	faq: 'FAQ actions read or write storefront FAQ content.',
	faqCategory: 'FAQ Category actions manage FAQ grouping reference data.',
	markupMaster: 'Markup Master actions read or write markup master records used by pricing workflows.',
	masterOptionRanges: 'Master Option Range actions read option range reference records.',
	masterOptionTag: 'Master Option Tag actions read or write option tag reference records.',
	optionFormulas: 'Option Formula actions manage formulas used by option pricing.',
	optionGroup: 'Option Group actions read or write groups that organize product additional options.',
	paymentTerms: 'Payment Terms actions read payment term reference data.',
	store: 'Store actions read or write OnPrintShop tenant stores and supporting reference lists.',
	storeAddress: 'Store Address actions read or write store address records.',
	storeMarkup: 'Store Markup actions read or write store-specific markup configuration.',
};

const OPERATION_HELP: Record<string, string> = {
	'customer.get': 'Read one customer by ID. Use this when a workflow already has the OnPrintShop customer ID and needs the current account details.',
	'customer.getAll': 'List customers with optional filters. Keep limits tight when using this in scheduled workflows.',
	'customer.getMany': 'List customers with optional filters. Keep limits tight when using this in scheduled workflows.',
	'customer.create': 'Create a customer account. Use only after validating required account fields upstream.',
	'customer.update': 'Update an existing customer account. Pass only the fields the workflow intends to change.',

	'graphql.execute': 'Use this only for approved API calls that are not modeled as actions yet. Paste the query and variables together, then add a domain action if the workflow will rely on it long term.',

	'order.get': 'Read one order by order ID. Use Order Products when the workflow needs line-item proof, design, or production status data.',
	'order.getAll': 'List order headers. Use date, status, customer, or store filters before enabling broad scheduled reads.',
	'order.getMany': 'List order headers. Use date, status, customer, or store filters before enabling broad scheduled reads.',
	'order.getShipments': 'Read shipment records for an order. This is a read action and does not create shipments.',
	'order.createShipment': 'Create a shipment record in OnPrintShop. Use only after the workflow has validated carrier, address, and order context.',
	'orderDetails.getAll': 'Read expanded order detail records. Use this when downstream logic needs more than the order header.',
	'orderDetails.getMany': 'Read expanded order detail records. Use this when downstream logic needs more than the order header.',
	'orderShipment.getAll': 'List order shipment records. Filter by order when possible to keep payloads predictable.',
	'orderShipment.getMany': 'List order shipment records. Filter by order when possible to keep payloads predictable.',
	'orderProducts.get': 'Read one order product line. Use this before proof, design, or status write actions.',
	'orderProducts.getMany': 'List order product lines. Use filters to avoid pulling unrelated production rows.',
	'orderProducts.setDesign': 'Attach design/preflight links to an order product. This writes production-facing data.',
	'orderProducts.updateStatus': 'Update an order-product status. Confirm the target OnPrintShop status ID before using this in an active workflow.',

	'product.getSimple': 'Read one product with a small core field set. Use Detailed when you need SEO, category, size, option, or page data.',
	'product.getManySimple': 'List products with a small core field set. Use this for fast catalog scans and ID lookups.',
	'product.getDetailed': 'Read one product with catalog, SEO, size, and option fields. Start with the default field selections, then remove nested groups you do not need.',
	'product.getManyDetailed': 'List detailed product records. Use filters and page controls carefully because nested size and option groups can make responses large.',
	'product.getMasterOptions': 'Read master options attached to one product. Use this before changing option assignment or SKU mappings.',
	'product.getManyMasterOptions': 'List product master options. Keep pagination explicit when using this for catalog audits.',
	'product.getOptionsRules': 'Read option rules for one product. Use this before changing rule or option pricing automation.',
	'product.getManyOptionsRules': 'List product option rules. Use filters and pagination for large catalogs.',
	'product.getPrices': 'Read pricing for one product UUID. Use this before product price write actions.',
	'product.getManyPrices': 'List product prices. Use product_uuid when possible to avoid broad price pulls.',
	'product.getOptionPrices': 'Read one option-price record. Use this for price diagnostics before write actions.',
	'product.getManyOptionPrices': 'List option-price records. Filter by attribute when possible.',
	'product.getCategory': 'Read one catalog category. Use category fields to choose storefront, SEO, and hierarchy output.',
	'product.getManyCategories': 'List catalog categories for navigation, sync, or validation workflows.',
	'product.getFAQs': 'Read FAQ content related to a product or category.',
	'product.getManyFAQs': 'List FAQ content. Keep limits explicit for storefront content syncs.',
	'product.getStock': 'Read product stock records. Use this before Update Stock so the workflow can compare current quantity and identifiers.',
	'product.updateStock': 'Update product stock by stock ID, SKU, or product ID. Choose Add, Remove, or Set deliberately; this writes inventory.',
	'product.getSkuMatrix': 'Generate valid size/option combinations for SKU mapping. Run this before Set Product SKU.',
	'product.setProductSku': 'Create, update, or delete SKU mappings. Use Get SKU Matrix first so size_id, prod_add_opt_ids, and attribute_ids match OnPrintShop.',

	'productStocks.getAll': 'List product stock records across products. Use this for stock audits when you do not have a specific product ID.',

	'masterOptionStock.getConfigs': 'Read stock configs grouped by master-option combinations. Use this before stock history, settings, or update actions.',
	'masterOptionStock.getHistory': 'Read stock movement history for one master-option stock config.',
	'masterOptionStock.getCombinationMatrix': 'Generate valid option and attribute combinations before creating master-option stock configs.',
	'masterOptionStock.addConfig': 'Create master-option stock configs. Use the combination matrix first to avoid invalid option/attribute pairs.',
	'masterOptionStock.deleteConfig': 'Delete a master-option stock config by config ID or option IDs. Treat this as a destructive inventory setup action.',
	'masterOptionStock.updateStock': 'Credit or debit master-option stock. Use config reads first so the workflow targets the right combination.',
	'masterOptionStock.setSettings': 'Update out-of-stock and notify settings for master-option inventory.',

	'mutation.setProduct': 'Create or update products. Inputs must be a JSON array, even for one product. Include only fields the workflow owns.',
	'mutation.setProductPages': 'Create or update product page records in batch. Inputs must be a JSON array.',
	'mutation.setProductPrice': 'Create or update product pricing. Read existing product prices first when changing live catalog pricing.',
	'mutation.setProductSize': 'Create or update product sizes. Use product detailed reads to verify current size IDs and sort order.',
	'mutation.setProductSku': 'Create, update, or delete SKU mappings. Use Get SKU Matrix first so size_id, prod_add_opt_ids, and attribute_ids match OnPrintShop.',
	'mutation.setProductCategory': 'Create or update catalog categories. Verify parent/category IDs before write workflows run.',
	'mutation.setProductImage': 'Create or update product gallery images. Confirm source URLs and image slot expectations upstream.',
	'mutation.setProductOptionRules': 'Create or update product option rules. Read current rules first and keep rule ownership clear.',
	'mutation.setAdditionalOption': 'Create or update product additional options. Use this before assigning attributes or option pricing.',
	'mutation.setAdditionalOptionAttributes': 'Create or update attributes under a product additional option.',
	'mutation.assignOptions': 'Assign options to a product. Verify product and option IDs before running this in bulk.',
	'mutation.setMasterOption': 'Create or update master options. Use master-option reads before changing shared catalog setup.',
	'mutation.setMasterOptionAttributes': 'Create or update master-option attributes.',
	'mutation.setMasterOptionAttributePrice': 'Create or update master-option attribute pricing.',
	'mutation.setMasterOptionRules': 'Create or update master-option rules.',
	'mutation.setMasterOptionTags': 'Create or update master-option tags.',
	'mutation.setMarkupMaster': 'Create or update markup master records used by pricing.',
	'mutation.setOptionFormulas': 'Create or update option pricing formulas. Validate formulas outside live workflows before enabling writes.',
	'mutation.setOptionGroup': 'Create or update option groups that organize product additional options.',
	'mutation.setOrder': 'Create or update an order. Treat this as a production-impacting write.',
	'mutation.setOrderProduct': 'Create or update an order product line. Treat this as a production-impacting write.',
	'mutation.modifyOrderProduct': 'Modify an order product line. Use only after reading the current order product state.',
	'mutation.addProofVersion': 'Add proof version data to an order product. This writes proof history.',
	'mutation.setProductDesign': 'Set design/preflight data for an order product. This writes production-facing links.',
	'mutation.updateOrderProductImages': 'Update order product images. Confirm image source and product line before running.',
	'mutation.updateOrderStatus': 'Update order status. Confirm the target status ID and workflow approval path.',
	'mutation.updateZiflowLinkImages': 'Update Ziflow link images on an order product. Use only in approved proof workflows.',
	'mutation.setShipment': 'Create or update shipment data. Validate carrier, tracking, and address context upstream.',
	'mutation.setStore': 'Create or update a tenant store. Keep store provisioning workflows separate from catalog workflows.',
	'mutation.setStoreAddress': 'Create or update a store address. Validate country/state and store IDs first.',
	'mutation.setStoreMarkup': 'Create or update store markup configuration. Read current markup before writing.',
	'mutation.setDepartment': 'Create or update department reference data for a store.',
	'mutation.setFaqCategory': 'Create or update FAQ categories used by storefront content.',

	'store.getAll': 'Read store records. Use corporate ID, email, or status filters when targeting a specific tenant.',
	'store.setStore': 'Create or update a tenant store. Use only in provisioning workflows.',
	'store.setStoreAddress': 'Create or update a store address. Validate store and country IDs first.',
	'store.storeAddress': 'List store addresses for tenant provisioning or validation.',
	'store.getCountries': 'List countries for address and store setup dropdowns.',
	'storeAddress.getAll': 'List store address records. Filter by store where possible.',
	'storeMarkup.getAll': 'Read store markup records used by pricing workflows.',
	'department.getAll': 'List store departments for provisioning and reference-data syncs.',
	'department.setDepartment': 'Create or update a store department.',
	'countries.getAll': 'List country reference records for address and store setup workflows.',
	'paymentTerms.getAll': 'List payment term reference records.',
	'faq.getMany': 'List FAQ content for storefront sync or validation.',
	'faqCategory.getAll': 'List FAQ categories for storefront content workflows.',
	'markupMaster.getAll': 'List markup master records used by pricing setup.',
	'masterOptionRanges.getAll': 'List master-option ranges used by option setup.',
	'masterOptionTag.getAll': 'List master-option tags used by option setup.',
	'optionFormulas.getAll': 'List option formulas used by pricing setup.',
	'optionGroup.getAll': 'List option groups used by product setup.',
};

export function isOnPrintShopFieldSelectionSentinel(value: unknown): boolean {
	if (typeof value !== 'string') return false;
	return value.startsWith('SELECT_')
		|| value.startsWith('DESELECT_')
		|| value.startsWith('SELECT_ALL')
		|| value.startsWith('DESELECT_ALL')
		|| value.startsWith('SEPARATOR');
}

export function cleanOnPrintShopFieldValues(values: string[] = []): string[] {
	return values.filter((value) => value && !isOnPrintShopFieldSelectionSentinel(value));
}

const PARAMETER_HELP: Record<string, ParameterHelp> = {
	resource: {
		hint: 'New workflows should use the focused OnPrintShop domain nodes. The all-in-one node is retained for saved workflow compatibility.',
	},
	operation: {
		hint: 'The note below describes what the selected action does and whether it writes to OnPrintShop.',
	},
	safeMode: {
		description: 'Retries large list reads with a smaller nested field shape when OnPrintShop returns a transient server error.',
		hint: 'Leave off for normal single-record calls. Enable only for large list reads that fail on nested response groups.',
	},
	productId: {
		description: 'OPS product ID to read.',
		hint: 'Use Get Many Simple or Get Many Detailed first if the workflow only has SKU, title, or category context.',
	},
	productIdDetailed: {
		description: 'OPS product ID to read with detailed catalog fields.',
		hint: 'This returns the selected core, size, and additional-option fields for one product.',
	},
	productIdStock: {
		description: 'OPS product ID to read stock for.',
		hint: 'Use this when the workflow needs current stock before an inventory write.',
	},
	productSkuMatrix_products_id: {
		description: 'OPS product ID used to generate valid SKU matrix rows.',
		hint: 'Run this before setting SKU mappings so size and option identifiers match OnPrintShop.',
	},
	productSkuMatrix_prod_add_opt_ids: {
		description: 'Comma-separated additional option IDs to include in the SKU matrix.',
		hint: 'Example: 8021,8022. These are product additional option IDs, not master option IDs.',
	},
	setProductSku_input: {
		description: 'ProductSkuInput JSON array. Set delete to 1 to remove a SKU mapping.',
		hint: 'Use one array item per SKU row. Get SKU Matrix provides the size_id, prod_add_opt_ids, and attribute_ids values.',
	},
	queryParameters: {
		hint: 'Optional filters and pagination. Leave empty for a direct ID lookup unless the action says otherwise.',
	},
	queryParametersDetailed: {
		hint: 'Status defaults to active products. Use External Catalogue only when the workflow needs external catalog visibility.',
	},
	queryParametersManyDetailed: {
		hint: 'For broad catalog reads, prefer Fetch All Pages with a controlled page size and only the nested fields you need.',
	},
	queryParametersManySimple: {
		hint: 'Use this for fast product ID/SKU lookups before detailed product reads.',
	},
	fetchAllPages: {
		hint: 'Use for controlled audits or syncs. Keep page size at or below the OPS limit and avoid unnecessary nested fields.',
	},
	productFieldsSimple: {
		hint: 'Small field set for product lookup workflows. Use Detailed fields when you need SEO, categories, sizes, or options.',
	},
	productFieldsManySimple: {
		hint: 'Small field set for catalog scans. Keep this lean for scheduled workflows.',
	},
	productFieldsDetailed: {
		description: 'Core product fields to return for a detailed product read.',
		hint: 'These are product-level fields. Size and additional-option fields are controlled separately below.',
	},
	productFieldsManyDetailed: {
		description: 'Core product fields to return for detailed product list reads.',
		hint: 'Remove nested groups unless the workflow actually needs size or option data.',
	},
	productSizeFields: {
		description: 'Nested product size fields to include with detailed product reads.',
		hint: 'Leave empty to exclude size rows. Include size_id when downstream logic updates sizes or SKUs.',
	},
	productAdditionalOptionsFields: {
		description: 'Nested product additional-option fields to include with detailed product reads.',
		hint: 'Leave empty to exclude option rows. Include attributes when downstream logic maps SKUs or option pricing.',
	},
	stockFields: {
		hint: 'Include stock_id for stock-ID writes, and option_details when stock varies by option combination.',
	},
	stockIdentifierType: {
		hint: 'Prefer Stock ID when known. Use SKU only when SKU mappings are maintained and unique.',
	},
	stockAction: {
		hint: 'Set replaces the quantity; Add and Remove adjust it. This writes inventory.',
	},
	stock_quantity: {
		hint: 'Quantity used by Add, Remove, or Set. Validate units upstream before inventory writes.',
	},
	comment: {
		hint: 'Use a workflow-specific reason so stock history is auditable.',
	},
	masterOptionStock_configId: {
		hint: 'Use Get Configs first if the workflow does not already have the config ID.',
	},
	masterOptionStock_optionFilter: {
		hint: 'Optional JSON array of option IDs. Example: [52,59].',
	},
	masterOptionStock_optionIdsArray: {
		hint: 'JSON array of master option IDs used to build valid stock combinations.',
	},
	masterOptionStock_input: {
		hint: 'Create configs only after verifying the combination matrix. Invalid option or attribute pairs will fail.',
	},
	masterOptionStock_inputs: {
		hint: 'Use one item per stock movement. change_type C credits stock and D debits stock.',
	},
	masterOptionStock_settingsInputs: {
		hint: 'Use one item per option setting update. Confirm out-of-stock behavior before enabling writes.',
	},
	setProduct_input: {
		description: 'ProductInput JSON array. Use an array even for one product.',
		hint: 'Include only the fields this workflow owns. Existing products_id updates a product; create behavior depends on OnPrintShop input rules.',
	},
	setProductPages_input: {
		description: 'ProductPagesInput JSON array.',
		hint: 'Use one array item per page update. Keep sort_order and visible values explicit.',
	},
	graphqlQuery: {
		description: 'GraphQL query or mutation for an approved OnPrintShop API operation that is not modeled as a node action yet.',
		hint: 'Prefer a domain-node action when one exists. Promote repeated raw GraphQL use into this package.',
	},
	graphqlVariables: {
		description: 'Variables object sent with the GraphQL request.',
		hint: 'Use JSON only. The node normalizes known OnPrintShop field aliases before sending.',
	},
};

function getShowArray(property: INodeProperties, key: 'resource' | 'operation'): string[] | undefined {
	const show = property.displayOptions?.show as Record<string, string[]> | undefined;
	const value = show?.[key];
	return Array.isArray(value) ? value : undefined;
}

function sanitizeName(value: string): string {
	return value.replace(/[^A-Za-z0-9_]/g, '_');
}

function getOperationHelp(resource: string, option: OperationOption): string | undefined {
	if (!option.value) return undefined;

	const key = `${resource}.${String(option.value)}`;
	const specific = OPERATION_HELP[key];
	if (specific) return specific;

	const resourceHelp = RESOURCE_HELP[resource];
	const optionText = option.description || option.action;
	if (resourceHelp && optionText) return `${optionText}. ${resourceHelp}`;
	return resourceHelp || optionText;
}

function buildOperationNotice(resource: string, option: OperationOption): INodeProperties | undefined {
	if (!option.value) return undefined;

	const help = getOperationHelp(resource, option);
	if (!help) return undefined;
	const operation = String(option.value);

	return {
		displayName: help,
		name: `onPrintShopHelp_${sanitizeName(resource)}_${sanitizeName(operation)}`,
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				resource: [resource],
				operation: [operation],
			},
		},
	};
}

function operationNoticesFor(property: INodeProperties): INodeProperties[] {
	if (property.name !== 'operation' || !Array.isArray(property.options)) return [];

	const resources = getShowArray(property, 'resource') || [];
	const options = property.options as OperationOption[];
	const notices: INodeProperties[] = [];

	for (const resource of resources) {
		for (const option of options) {
			const notice = buildOperationNotice(resource, option);
			if (notice) notices.push(notice);
		}
	}

	return notices;
}

function fieldSelectionModeName(propertyName: string): string {
	return `${propertyName}${ONPRINTSHOP_FIELD_SELECTION_MODE_SUFFIX}`;
}

function supportsFieldSelectionMode(property: INodeProperties): boolean {
	return property.type === 'multiOptions'
		&& typeof property.name === 'string'
		&& property.name.toLowerCase().includes('fields')
		&& Array.isArray(property.options)
		&& property.options.some((option) => typeof option === 'object' && option !== null && typeof (option as { value?: unknown }).value === 'string');
}

function buildFieldSelectionMode(property: INodeProperties): INodeProperties | undefined {
	if (!supportsFieldSelectionMode(property)) return undefined;

	return {
		displayName: `${property.displayName} Mode`,
		name: fieldSelectionModeName(property.name),
		type: 'options',
		noDataExpression: true,
		displayOptions: property.displayOptions,
		options: [
			{
				name: 'Custom Selection',
				value: 'custom',
				description: 'Use the checked fields below',
			},
			{
				name: 'All Fields',
				value: 'all',
				description: 'Send every available field in this group',
			},
			{
				name: 'No Fields',
				value: 'none',
				description: 'Send no fields from this group',
			},
		],
		default: 'custom',
		description: 'Controls how , are sent to OPS',
		hint: 'Use All Fields or No Fields instead of selecting fake options in the list. No Fields is mainly for optional nested groups; root GraphQL reads usually require at least one field.',
	};
}

function cleanFieldSelectionProperty(property: INodeProperties): INodeProperties {
	if (!supportsFieldSelectionMode(property) || !Array.isArray(property.options)) return property;

	const next = {
		...property,
		options: property.options.filter((option) => {
			if (typeof option !== 'object' || option === null) return true;
			return !isOnPrintShopFieldSelectionSentinel((option as { value?: unknown }).value);
		}) as INodeProperties['options'],
		displayOptions: {
			...property.displayOptions,
			show: {
				...property.displayOptions?.show,
				[fieldSelectionModeName(property.name)]: ['custom'],
			},
		},
	};

	const existingHint = next.hint ? `${next.hint} ` : '';
	next.hint = `${existingHint}Use the mode above to select all or clear this group.`;
	return next;
}

function applyHelpToProperty(property: INodeProperties): INodeProperties {
	const help = PARAMETER_HELP[property.name];
	const next = {
		...property,
	};

	if (help?.description) next.description = help.description;
	if (help?.hint) next.hint = help.hint;
	if (help?.placeholder) next.placeholder = help.placeholder;

	if (Array.isArray(next.options)) {
		next.options = next.options.map((option) => {
			if (typeof option !== 'object' || option === null) return option;
			if (!('displayName' in option) || !('type' in option) || !('name' in option)) return option;
			return applyHelpToProperty(option as INodeProperties);
		}) as INodeProperties['options'];
	}

	return cleanFieldSelectionProperty(next);
}

export function addOnPrintShopHelp(description: INodeTypeDescription): INodeTypeDescription {
	const properties: INodeProperties[] = [];

	for (const property of description.properties) {
		const mode = buildFieldSelectionMode(property);
		if (mode) properties.push(applyHelpToProperty(mode));

		const next = applyHelpToProperty(property);
		properties.push(next);
		properties.push(...operationNoticesFor(next));
	}

	return {
		...description,
		properties,
	};
}
