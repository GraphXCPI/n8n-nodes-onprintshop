import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	JsonObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

export async function createOnPrintShopGraphqlClient(context: IExecuteFunctions): Promise<(
	query: string,
	variables?: IDataObject,
	itemIndex?: number,
) => Promise<IDataObject>> {
	const credentials = await context.getCredentials('onPrintShopApi');
	const baseUrl = String(credentials.baseUrl || 'https://api.onprintshop.com').replace(/\/$/, '');
	const tokenUrl = String(credentials.tokenUrl || 'https://api.onprintshop.com/oauth/token');

	let accessToken: string;
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
		}) as IDataObject;
		accessToken = String(token.access_token || '');
		if (!accessToken) throw new Error('Token response did not include access_token');
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject, {
			message: `Failed to get OnPrintShop access token: ${(error as Error).message}`,
		});
	}

	return async (query: string, variables: IDataObject = {}, itemIndex = 0): Promise<IDataObject> => {
		let response: IDataObject;
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
			}) as IDataObject;
		} catch (error) {
			throw new NodeApiError(context.getNode(), error as JsonObject, { itemIndex });
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
