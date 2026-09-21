import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import {
	getOnPrintShopAccessToken,
	getOnPrintShopApiUrl,
	hasOnPrintShopAuthenticationError,
	isOnPrintShopAuthenticationFailure,
	safeOnPrintShopRequestError,
} from './OnPrintShopTokenManager';
import { normalizeOnPrintShopInputs } from './OnPrintShopInputNormalization';

export async function createOnPrintShopGraphqlClient(context: IExecuteFunctions): Promise<(
	query: string,
	variables?: IDataObject,
	itemIndex?: number,
	options?: { partialDataRoot?: string },
) => Promise<IDataObject>> {
	const credentials = await context.getCredentials('onPrintShopApi');
	const apiUrl = getOnPrintShopApiUrl(credentials);
	let accessToken = await getOnPrintShopAccessToken(context, credentials);

	return async (query: string, variables: IDataObject = {}, itemIndex = 0, options: { partialDataRoot?: string } = {}): Promise<IDataObject> => {
		variables = normalizeOnPrintShopInputs(query, variables);
		const sendRequest = async (): Promise<IDataObject> => {
			return await context.helpers.httpRequest({
				method: 'POST',
				url: apiUrl,
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

		const data = (response.data || {}) as IDataObject;
		if (Array.isArray(response.errors) && response.errors.length > 0) {
			// Legacy mutation routes prefer a present result; all other calls still fail closed.
			if (options.partialDataRoot && Object.prototype.hasOwnProperty.call(data, options.partialDataRoot) && data[options.partialDataRoot]) {
				return data;
			}
			throw new NodeOperationError(
				context.getNode(),
				`OnPrintShop GraphQL error: ${JSON.stringify(response.errors)}`,
				{ itemIndex },
			);
		}

		return data;
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
