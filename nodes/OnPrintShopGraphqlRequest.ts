import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	getOnPrintShopAccessToken,
	hasOnPrintShopAuthenticationError,
	isOnPrintShopAuthenticationFailure,
	safeOnPrintShopRequestError,
} from './OnPrintShopTokenManager';
import { normalizeOnPrintShopInputs } from './OnPrintShopInputNormalization';

export async function createOnPrintShopGraphqlClient(context: IExecuteFunctions): Promise<(
	query: string,
	variables?: IDataObject,
	itemIndex?: number,
) => Promise<IDataObject>> {
	const credentials = await context.getCredentials('onPrintShopApi');
	const baseUrl = String(credentials.baseUrl || 'https://api.onprintshop.com').replace(/\/$/, '');
	let accessToken = await getOnPrintShopAccessToken(context, credentials);

	return async (query: string, variables: IDataObject = {}, itemIndex = 0): Promise<IDataObject> => {
		variables = normalizeOnPrintShopInputs(query, variables);
		const sendRequest = async (): Promise<IDataObject> => {
			return await context.helpers.httpRequest({
				method: 'POST',
				url: `${baseUrl}/api/`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: { query, variables },
				json: true,
			}) as IDataObject;
		};

		let response: IDataObject;
		try {
			response = await sendRequest();
			if (hasOnPrintShopAuthenticationError(response)) {
				const rejectedAccessToken = accessToken;
				accessToken = await getOnPrintShopAccessToken(
					context,
					credentials,
					true,
					rejectedAccessToken,
				);
				response = await sendRequest();
			}
		} catch (error) {
			if (!isOnPrintShopAuthenticationFailure(error)) {
				throw new NodeApiError(
					context.getNode(),
					safeOnPrintShopRequestError(error, [accessToken]),
					{ itemIndex },
				);
			}
			const rejectedAccessToken = accessToken;
			accessToken = await getOnPrintShopAccessToken(
				context,
				credentials,
				true,
				rejectedAccessToken,
			);
			try {
				response = await sendRequest();
			} catch (retryError) {
				throw new NodeApiError(
					context.getNode(),
					safeOnPrintShopRequestError(retryError, [accessToken]),
					{ itemIndex },
				);
			}
		}

		if (Array.isArray(response.errors) && response.errors.length > 0) {
			throw new NodeOperationError(
				context.getNode(),
				`OnPrintShop GraphQL error: ${JSON.stringify(response.errors)}`,
				{ itemIndex },
			);
		}

		return (response.data || {}) as IDataObject;
	};
}

export function rowsFromFixedCollection(value: unknown, groupName: string): IDataObject[] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
	const rows = (value as IDataObject)[groupName];
	return Array.isArray(rows) ? rows as IDataObject[] : [];
}

export function compactObject(value: IDataObject): IDataObject {
	const compacted: IDataObject = {};
	for (const [key, current] of Object.entries(value)) {
		if (current === '' || current === undefined || current === null) continue;
		if (Array.isArray(current)) {
			if (current.length === 0) continue;
			compacted[key] = current.map((entry) => (
				typeof entry === 'object' && entry !== null && !Array.isArray(entry)
					? compactObject(entry as IDataObject)
					: entry
			)) as IDataObject[];
			continue;
		}
		if (typeof current === 'object') {
			compacted[key] = compactObject(current as IDataObject);
			continue;
		}
		compacted[key] = current;
	}
	return compacted;
}

export function resultItems(result: unknown, itemIndex?: number): INodeExecutionData[] {
	const pairedItem = itemIndex === undefined ? {} : { pairedItem: { item: itemIndex } };
	if (Array.isArray(result)) {
		return result.map((entry) => ({ json: entry as IDataObject, ...pairedItem }));
	}
	return [{ json: result as IDataObject, ...pairedItem }];
}
