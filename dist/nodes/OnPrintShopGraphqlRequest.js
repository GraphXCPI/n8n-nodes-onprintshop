"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOnPrintShopGraphqlClient = createOnPrintShopGraphqlClient;
exports.rowsFromFixedCollection = rowsFromFixedCollection;
exports.compactObject = compactObject;
exports.resultItems = resultItems;
const n8n_workflow_1 = require("n8n-workflow");
async function createOnPrintShopGraphqlClient(context) {
    const credentials = await context.getCredentials('onPrintShopApi');
    const baseUrl = String(credentials.baseUrl || 'https://api.onprintshop.com').replace(/\/$/, '');
    const tokenUrl = String(credentials.tokenUrl || 'https://api.onprintshop.com/oauth/token');
    let accessToken;
    try {
        // OnPrintShop uses a client-credentials exchange rather than n8n-managed OAuth.
        const token = await context.helpers.httpRequest({
            method: 'POST',
            url: tokenUrl,
            headers: { 'Content-Type': 'application/json' },
            body: {
                grant_type: 'client_credentials',
                client_id: String(credentials.clientId),
                client_secret: String(credentials.clientSecret),
            },
            json: true,
        });
        accessToken = String(token.access_token || '');
        if (!accessToken)
            throw new Error('Token response did not include access_token');
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(context.getNode(), error, {
            message: `Failed to get OnPrintShop access token: ${error.message}`,
        });
    }
    return async (query, variables = {}, itemIndex = 0) => {
        let response;
        try {
            response = await context.helpers.httpRequest({
                method: 'POST',
                url: `${baseUrl}/api/`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: { query, variables },
                json: true,
            });
        }
        catch (error) {
            throw new n8n_workflow_1.NodeApiError(context.getNode(), error, { itemIndex });
        }
        if (Array.isArray(response.errors) && response.errors.length > 0) {
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `OnPrintShop GraphQL error: ${JSON.stringify(response.errors)}`, { itemIndex });
        }
        return (response.data || {});
    };
}
function rowsFromFixedCollection(value, groupName) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return [];
    const rows = value[groupName];
    return Array.isArray(rows) ? rows : [];
}
function compactObject(value) {
    const compacted = {};
    for (const [key, current] of Object.entries(value)) {
        if (current === '' || current === undefined || current === null)
            continue;
        if (Array.isArray(current)) {
            if (current.length === 0)
                continue;
            compacted[key] = current.map((entry) => (typeof entry === 'object' && entry !== null && !Array.isArray(entry)
                ? compactObject(entry)
                : entry));
            continue;
        }
        if (typeof current === 'object') {
            compacted[key] = compactObject(current);
            continue;
        }
        compacted[key] = current;
    }
    return compacted;
}
function resultItems(result, itemIndex) {
    const pairedItem = itemIndex === undefined ? {} : { pairedItem: { item: itemIndex } };
    if (Array.isArray(result)) {
        return result.map((entry) => ({ json: entry, ...pairedItem }));
    }
    return [{ json: result, ...pairedItem }];
}
