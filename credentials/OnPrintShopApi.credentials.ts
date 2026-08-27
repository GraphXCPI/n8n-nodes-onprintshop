import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class OnPrintShopApi implements ICredentialType {
	name = 'onPrintShopApi';
	displayName = 'OnPrintShop API';
	icon: Icon = {
		light: 'file:onprintshop-light.svg',
		dark: 'file:onprintshop-dark.svg',
	};
	documentationUrl = 'https://github.com/GraphXCPI/n8n-nodes-onprintshop/blob/main/docs/NODE_OPERATOR_GUIDE.md#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'OAuth2 Client ID from OnPrintShop',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'OAuth2 Client Secret from OnPrintShop',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.onprintshop.com',
			required: true,
			description: 'The base URL for your OnPrintShop instance',
		},
		{
			displayName: 'Token URL',
			name: 'tokenUrl',
			type: 'string',
			default: 'https://api.onprintshop.com/oauth/token',
			required: true,
			description: 'The OAuth2 token endpoint URL',
		},
		{
			displayName: 'Fallback Token Cache TTL',
			name: 'cacheTtlSeconds',
			type: 'number',
			default: 3300,
			typeOptions: {
				minValue: 60,
				maxValue: 86400,
			},
			description: 'Seconds to reuse a token only when OPS does not return expires_in, expires_at, or a JWT expiration claim',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.tokenUrl}}',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				grant_type: 'client_credentials',
				client_id: '={{$credentials.clientId}}',
				client_secret: '={{$credentials.clientSecret}}',
			},
		},
	};
}
