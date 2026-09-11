"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUploadInputs = addUploadInputs;
exports.readOrderUrlInput = readOrderUrlInput;
exports.readUploadInput = readUploadInput;
const n8n_workflow_1 = require("n8n-workflow");
const OnPrintShopInputTypes_json_1 = __importDefault(require("./OnPrintShopInputTypes.json"));
const uploadTypes = {
    setProduct: 'ProductInput',
    setProductCategory: 'ProductCategoryInput',
    setProductSize: 'ProductSizeInput',
    setMasterOptionAttributes: 'MasterOptionAttributesInput',
    setAdditionalOptionAttributes: 'AdditionalOptionAttributesInput',
    setProductImage: 'ProductsImageGalleryItemInput',
};
const primaryFields = {
    setProduct: ['products_id', 'products_title', 'image_url', 'product_desc_image_url'],
    setProductCategory: ['category_id', 'category_name', 'category_image_url', 'category_icon_url'],
    setProductSize: ['size_id', 'products_id', 'size_title', 'size_image_url'],
    setMasterOptionAttributes: ['master_attribute_id', 'master_option_id', 'label', 'attributes_image_url'],
    setAdditionalOptionAttributes: ['attribute_id', 'prod_add_opt_id', 'label', 'attributes_image_url'],
    setProductImage: ['products_image_gallery_id', 'image_url', 'products_large_image_name'],
};
const entryLabels = {
    setProduct: ['Products', 'Product'],
    setProductCategory: ['Categories', 'Category'],
    setProductSize: ['Sizes', 'Size'],
    setMasterOptionAttributes: ['Attributes', 'Attribute'],
    setAdditionalOptionAttributes: ['Attributes', 'Attribute'],
    setProductImage: ['Images', 'Image'],
};
function fieldsFor(type) {
    return Object.entries(OnPrintShopInputTypes_json_1.default[type]).map(([name, fieldType]) => ({
        displayName: name.split('_').map(word => word === 'url' || word === 'id' ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)).join(' '),
        name,
        type: name === 'product_desc_image_type' ? 'options' : fieldType === 'JSON' || fieldType.startsWith('[') ? 'json' : /^(Int|Float)/.test(fieldType) ? 'number' : 'string',
        default: name === 'product_desc_image_type' ? '0' : fieldType === 'JSON' || fieldType.startsWith('[') ? '[]' : /^(Int|Float)/.test(fieldType) ? 0 : '',
        ...(name === 'product_desc_image_type' ? { options: [{ name: 'None', value: '0' }, { name: 'Small Image', value: '1' }, { name: 'Large / Description Image', value: '2' }, { name: 'Both', value: '3' }] } : {}),
        description: name.endsWith('_url') ? 'Direct file URL accessible to OnPrintShop. Processing runs in the background; keep the URL available until complete.' : `OnPrintShop input field: ${name}`,
    }));
}
function addUploadInputs(description) {
    var _a;
    const selector = description.properties.find(property => { var _a, _b, _c; return property.name === 'operation' && ((_c = (_b = (_a = property.displayOptions) === null || _a === void 0 ? void 0 : _a.show) === null || _b === void 0 ? void 0 : _b.resource) === null || _c === void 0 ? void 0 : _c.includes('mutation')); });
    (_a = selector === null || selector === void 0 ? void 0 : selector.options) === null || _a === void 0 ? void 0 : _a.push({ name: 'Upload Order Product Files From URLs', value: 'setOrderProductImageFromUrl', action: 'Upload order product files from URLs' });
    const show = { resource: ['mutation'], operation: ['setOrderProductImageFromUrl'] };
    description.properties.push({ displayName: 'Order Product ID', name: 'urlUploadOrderProductId', type: 'number', default: 0, required: true, displayOptions: { show } }, { displayName: 'Options', name: 'urlUploadOptions', type: 'collection', default: {}, placeholder: 'Add Option', displayOptions: { show }, options: [
            { displayName: 'Add Version File Only', name: 'add_version_file_only', type: 'number', default: 0 },
            { displayName: 'Ask for Approval', name: 'ask_for_approval', type: 'number', default: 0 },
            { displayName: 'Update Ziflow Link Only', name: 'update_ziflow_link_only', type: 'number', default: 0 },
        ] }, { displayName: 'Input Mode', name: 'urlUploadInputMode', type: 'options', default: 'fields', displayOptions: { show }, options: [{ name: 'Fields', value: 'fields' }, { name: 'JSON Object', value: 'json' }] }, { displayName: 'Input JSON', name: 'urlUploadJson', type: 'json', default: '{"imagefiles":[]}', displayOptions: { show: { ...show, urlUploadInputMode: ['json'] } } }, { displayName: 'Files', name: 'urlUploadFiles', type: 'fixedCollection', default: {}, typeOptions: { multipleValues: true }, displayOptions: { show: { ...show, urlUploadInputMode: ['fields'] } }, options: [{ name: 'file', displayName: 'File', values: [
                    { displayName: 'Page Name', name: 'pagename', type: 'string', default: '', required: true },
                    { displayName: 'File URL', name: 'file_url', type: 'string', default: '', required: true, description: 'Direct file URL that OnPrintShop can download' },
                    { displayName: 'Ziflow Link', name: 'ziflow_link', type: 'string', default: '' },
                    { displayName: 'Ziflow Preflight Link', name: 'ziflow_preflight_link', type: 'string', default: '' },
                ] }] });
    for (const [operation, type] of Object.entries(uploadTypes)) {
        const original = description.properties.find(property => property.name === `${operation}_input`);
        if (!original)
            continue;
        const displayOptions = original.displayOptions;
        original.displayOptions = { show: { ...displayOptions === null || displayOptions === void 0 ? void 0 : displayOptions.show, [`${operation}_inputMode`]: ['json'] } };
        const allFields = fieldsFor(type);
        const visibleFields = primaryFields[operation].map(name => allFields.find(field => field.name === name)).filter(Boolean);
        const [plural, singular] = entryLabels[operation];
        description.properties.splice(description.properties.indexOf(original), 1, { displayName: 'Input Mode', name: `${operation}_inputMode`, type: 'options', default: 'json', displayOptions,
            options: [{ name: 'JSON Array', value: 'json' }, { name: 'Fields', value: 'fields' }] }, original, { displayName: plural, name: `${operation}_entries`, type: 'fixedCollection', default: { entry: [{}] },
            displayOptions: { show: { ...displayOptions === null || displayOptions === void 0 ? void 0 : displayOptions.show, [`${operation}_inputMode`]: ['fields'] } },
            typeOptions: { multipleValues: true },
            placeholder: `Add ${singular}`,
            options: [{ displayName: singular, name: 'entry', values: [
                        ...visibleFields,
                        { displayName: 'Additional Fields', name: 'fields', type: 'collection', placeholder: 'Add Field', default: {}, options: allFields },
                    ] }] });
    }
}
function readOrderUrlInput(context, index) {
    let input;
    try {
        if (context.getNodeParameter('urlUploadInputMode', index, 'fields') === 'json') {
            const raw = context.getNodeParameter('urlUploadJson', index);
            input = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
        else {
            const rows = context.getNodeParameter('urlUploadFiles', index, {});
            input = { imagefiles: rows.file };
        }
    }
    catch {
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Provide an input object containing an imagefiles array', { itemIndex: index });
    }
    if (!input || !Array.isArray(input.imagefiles) || !input.imagefiles.length)
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Add at least one file', { itemIndex: index });
    for (const file of input.imagefiles) {
        const row = file;
        if (!row || typeof row.pagename !== 'string' || !row.pagename.trim() || typeof row.file_url !== 'string' || !/^https?:\/\//i.test(row.file_url)) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Each file needs a page name and an HTTP or HTTPS file URL', { itemIndex: index });
        }
    }
    return input;
}
function readUploadInput(context, operation, index) {
    if (context.getNodeParameter(`${operation}_inputMode`, index, 'json') === 'json') {
        const value = context.getNodeParameter(`${operation}_input`, index);
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
    const collection = context.getNodeParameter(`${operation}_entries`, index, {});
    const entries = collection.entry;
    if (!Array.isArray(entries) || !entries.length)
        throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Add at least one upload entry', { itemIndex: index });
    const rows = entries.map(entry => {
        const row = entry;
        // Keep the 1.2.9 nested representation, including explicitly selected empty/zero values.
        const result = { ...(row.fields || {}) };
        for (const name of primaryFields[operation]) {
            const value = row[name];
            if (value !== undefined && value !== null && value !== '' && value !== 0)
                result[name] = value;
        }
        if (!Object.keys(result).length)
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), 'Add fields to every upload entry', { itemIndex: index });
        for (const [key, value] of Object.entries(result)) {
            const fieldType = OnPrintShopInputTypes_json_1.default[uploadTypes[operation]][key];
            if ((fieldType === 'JSON' || (fieldType === null || fieldType === void 0 ? void 0 : fieldType.startsWith('['))) && typeof value === 'string') {
                try {
                    result[key] = JSON.parse(value);
                }
                catch {
                    throw new n8n_workflow_1.NodeOperationError(context.getNode(), `Provide valid JSON for ${key}`, { itemIndex: index });
                }
            }
        }
        return result;
    });
    return JSON.stringify(operation === 'setProductImage' ? { image_arr: rows } : rows);
}
