import { IExecuteFunctions, IDataObject, INodeProperties, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';
import inputTypes from './OnPrintShopInputTypes.json';

const uploadTypes: Record<string, string> = {
	setProduct: 'ProductInput',
	setProductCategory: 'ProductCategoryInput',
	setProductSize: 'ProductSizeInput',
	setMasterOptionAttributes: 'MasterOptionAttributesInput',
	setAdditionalOptionAttributes: 'AdditionalOptionAttributesInput',
	setProductImage: 'ProductsImageGalleryItemInput',
};

function fieldsFor(type: string): INodeProperties[] {
	return Object.entries(inputTypes[type] as Record<string, string>).map(([name, fieldType]) => ({
		displayName: name.split('_').map(word => word === 'url' || word === 'id' ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)).join(' '),
		name,
		type: name === 'product_desc_image_type' ? 'options' : fieldType === 'JSON' || fieldType.startsWith('[') ? 'json' : /^(Int|Float)/.test(fieldType) ? 'number' : 'string',
		default: name === 'product_desc_image_type' ? '0' : fieldType === 'JSON' || fieldType.startsWith('[') ? '[]' : /^(Int|Float)/.test(fieldType) ? 0 : '',
		...(name === 'product_desc_image_type' ? { options: [{ name: 'None', value: '0' }, { name: 'Small Image', value: '1' }, { name: 'Large / Description Image', value: '2' }, { name: 'Both', value: '3' }] } : {}),
		description: name.endsWith('_url') ? 'Direct file URL accessible to OnPrintShop. Processing runs in the background; keep the URL available until complete.' : `OnPrintShop input field: ${name}`,
	}));
}

export function addUploadInputs(description: INodeTypeDescription): void {
	const selector = description.properties.find(property => property.name === 'operation' && property.displayOptions?.show?.resource?.includes('mutation'));
	selector?.options?.push({ name: 'Upload Order Product Files From URLs', value: 'setOrderProductImageFromUrl', action: 'Upload order product files from URLs' });
	const show = { resource: ['mutation'], operation: ['setOrderProductImageFromUrl'] };
	description.properties.push(
		{ displayName: 'Order Product ID', name: 'urlUploadOrderProductId', type: 'number', default: 0, required: true, displayOptions: { show } },
		{ displayName: 'Options', name: 'urlUploadOptions', type: 'collection', default: {}, placeholder: 'Add Option', displayOptions: { show }, options: [
			{ displayName: 'Add Version File Only', name: 'add_version_file_only', type: 'number', default: 0 },
			{ displayName: 'Ask for Approval', name: 'ask_for_approval', type: 'number', default: 0 },
			{ displayName: 'Update Ziflow Link Only', name: 'update_ziflow_link_only', type: 'number', default: 0 },
		] },
		{ displayName: 'Input Mode', name: 'urlUploadInputMode', type: 'options', default: 'fields', displayOptions: { show }, options: [{ name: 'Fields', value: 'fields' }, { name: 'JSON Object', value: 'json' }] },
		{ displayName: 'Input JSON', name: 'urlUploadJson', type: 'json', default: '{"imagefiles":[]}', displayOptions: { show: { ...show, urlUploadInputMode: ['json'] } } },
		{ displayName: 'Files', name: 'urlUploadFiles', type: 'fixedCollection', default: {}, typeOptions: { multipleValues: true }, displayOptions: { show: { ...show, urlUploadInputMode: ['fields'] } }, options: [{ name: 'file', displayName: 'File', values: [
			{ displayName: 'Page Name', name: 'pagename', type: 'string', default: '', required: true },
			{ displayName: 'File URL', name: 'file_url', type: 'string', default: '', required: true, description: 'Direct file URL that OnPrintShop can download' },
			{ displayName: 'Ziflow Link', name: 'ziflow_link', type: 'string', default: '' },
			{ displayName: 'Ziflow Preflight Link', name: 'ziflow_preflight_link', type: 'string', default: '' },
		] }] },
	);
	for (const [operation, type] of Object.entries(uploadTypes)) {
		const original = description.properties.find(property => property.name === `${operation}_input`);
		if (!original) continue;
		const displayOptions = original.displayOptions;
		original.displayOptions = { show: { ...displayOptions?.show, [`${operation}_inputMode`]: ['json'] } };
		description.properties.push(
			{ displayName: 'Input Mode', name: `${operation}_inputMode`, type: 'options', default: 'json', displayOptions,
				options: [{ name: 'JSON Array', value: 'json' }, { name: 'Fields', value: 'fields' }] },
			{ displayName: 'Entries', name: `${operation}_entries`, type: 'fixedCollection', default: {},
				displayOptions: { show: { ...displayOptions?.show, [`${operation}_inputMode`]: ['fields'] } },
				typeOptions: { multipleValues: true },
				options: [{ displayName: 'Entry', name: 'entry', values: [
					{ displayName: 'Fields', name: 'fields', type: 'collection', placeholder: 'Add Field', default: {}, options: fieldsFor(type) },
				] }] },
		);
	}
}

export function readOrderUrlInput(context: IExecuteFunctions, index: number): IDataObject {
	let input: IDataObject;
	try {
		if (context.getNodeParameter('urlUploadInputMode', index, 'fields') === 'json') {
			const raw = context.getNodeParameter('urlUploadJson', index);
			input = typeof raw === 'string' ? JSON.parse(raw) : raw as IDataObject;
		} else {
			const rows = context.getNodeParameter('urlUploadFiles', index, {}) as IDataObject;
			input = { imagefiles: rows.file };
		}
	} catch {
		throw new NodeOperationError(context.getNode(), 'Provide an input object containing an imagefiles array', { itemIndex: index });
	}
	if (!input || !Array.isArray(input.imagefiles) || !input.imagefiles.length) throw new NodeOperationError(context.getNode(), 'Add at least one file', { itemIndex: index });
	for (const file of input.imagefiles) {
		const row = file as IDataObject;
		if (!row || typeof row.pagename !== 'string' || !row.pagename.trim() || typeof row.file_url !== 'string' || !/^https?:\/\//i.test(row.file_url)) {
			throw new NodeOperationError(context.getNode(), 'Each file needs a page name and an HTTP or HTTPS file URL', { itemIndex: index });
		}
	}
	return input;
}

export function readUploadInput(context: IExecuteFunctions, operation: string, index: number): string {
	if (context.getNodeParameter(`${operation}_inputMode`, index, 'json') === 'json') {
		const value = context.getNodeParameter(`${operation}_input`, index);
		return typeof value === 'string' ? value : JSON.stringify(value);
	}
	const collection = context.getNodeParameter(`${operation}_entries`, index, {}) as IDataObject;
	const entries = collection.entry;
	if (!Array.isArray(entries) || !entries.length) throw new NodeOperationError(context.getNode(), 'Add at least one upload entry', { itemIndex: index });
	const rows = entries.map(entry => {
		const fields = (entry as IDataObject).fields as IDataObject;
		if (!fields || !Object.keys(fields).length) throw new NodeOperationError(context.getNode(), 'Add fields to every upload entry', { itemIndex: index });
		const result = { ...fields };
		for (const [key, value] of Object.entries(result)) {
			const fieldType = inputTypes[uploadTypes[operation]][key] as string;
			if ((fieldType === 'JSON' || fieldType?.startsWith('[')) && typeof value === 'string') {
				try { result[key] = JSON.parse(value); } catch {
					throw new NodeOperationError(context.getNode(), `Provide valid JSON for ${key}`, { itemIndex: index });
				}
			}
		}
		return result;
	});
	return JSON.stringify(operation === 'setProductImage' ? { image_arr: rows } : rows);
}
