"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOnPrintShopGraphqlClient = createOnPrintShopGraphqlClient;
exports.rowsFromFixedCollection = rowsFromFixedCollection;
exports.compactObject = compactObject;
exports.resultItems = resultItems;
const n8n_workflow_1 = require("n8n-workflow");
const OnPrintShopTokenManager_1 = require("./OnPrintShopTokenManager");
const OnPrintShopInputNormalization_1 = require("./OnPrintShopInputNormalization");
async function createOnPrintShopGraphqlClient(context) {
    const credentials = await context.getCredentials('onPrintShopApi');
    const apiUrl = (0, OnPrintShopTokenManager_1.getOnPrintShopApiUrl)(credentials);
    let accessToken = await (0, OnPrintShopTokenManager_1.getOnPrintShopAccessToken)(context, credentials);
    return async (query, variables = {}, itemIndex = 0, options = {}) => {
        variables = (0, OnPrintShopInputNormalization_1.normalizeOnPrintShopInputs)(query, variables);
        const sendRequest = async () => {
            return await context.helpers.httpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: { query, variables },
                json: true,
            });
        };
        let response;
        try {
            response = await sendRequest();
            if ((0, OnPrintShopTokenManager_1.hasOnPrintShopAuthenticationError)(response)) {
                const rejectedAccessToken = accessToken;
                accessToken = await (0, OnPrintShopTokenManager_1.getOnPrintShopAccessToken)(context, credentials, true, rejectedAccessToken);
                response = await sendRequest();
            }
        }
        catch (error) {
            if (!(0, OnPrintShopTokenManager_1.isOnPrintShopAuthenticationFailure)(error)) {
                throw new n8n_workflow_1.NodeApiError(context.getNode(), (0, OnPrintShopTokenManager_1.safeOnPrintShopRequestError)(error, [accessToken]), { itemIndex });
            }
            const rejectedAccessToken = accessToken;
            accessToken = await (0, OnPrintShopTokenManager_1.getOnPrintShopAccessToken)(context, credentials, true, rejectedAccessToken);
            try {
                response = await sendRequest();
            }
            catch (retryError) {
                throw new n8n_workflow_1.NodeApiError(context.getNode(), (0, OnPrintShopTokenManager_1.safeOnPrintShopRequestError)(retryError, [accessToken]), { itemIndex });
            }
        }
        const data = (response.data || {});
        if (Array.isArray(response.errors) && response.errors.length > 0) {
            // Legacy mutation routes prefer a present result; all other calls still fail closed.
            if (options.partialDataRoot && Object.prototype.hasOwnProperty.call(data, options.partialDataRoot) && data[options.partialDataRoot]) {
                return data;
            }
            throw new n8n_workflow_1.NodeOperationError(context.getNode(), `OnPrintShop GraphQL error: ${JSON.stringify(response.errors)}`, { itemIndex });
        }
        return data;
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
