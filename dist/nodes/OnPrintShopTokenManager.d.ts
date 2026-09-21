import { IDataObject, IExecuteFunctions, ICredentialDataDecryptedObject, JsonObject } from 'n8n-workflow';
export declare function getOnPrintShopApiUrl(credentials: ICredentialDataDecryptedObject): string;
export declare function getOnPrintShopTokenUrl(credentials: ICredentialDataDecryptedObject): string;
export declare function safeOnPrintShopRequestError(error: unknown, sensitiveValues?: unknown[]): JsonObject;
export declare function getOnPrintShopAccessToken(context: IExecuteFunctions, credentials: ICredentialDataDecryptedObject, forceRefresh?: boolean, rejectedAccessToken?: string): Promise<string>;
export declare function invalidateOnPrintShopAccessToken(credentials: ICredentialDataDecryptedObject): void;
export declare function isOnPrintShopAuthenticationFailure(error: unknown): boolean;
export declare function hasOnPrintShopAuthenticationError(response: IDataObject): boolean;
export declare function clearOnPrintShopTokenCacheForTests(): void;
