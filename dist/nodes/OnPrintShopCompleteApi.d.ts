import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeTypeDescription } from 'n8n-workflow';
import type { CompletePaginationOptions } from './OnPrintShopPagination';
type PaginationConfig = Omit<CompletePaginationOptions, 'fetchPage'>;
export declare function addCompleteApi(description: INodeTypeDescription, domain?: string): INodeTypeDescription;
export declare function buildCompleteRequest(context: IExecuteFunctions, index: number): {
    query: string;
    variables: IDataObject;
    name: string;
    pagination?: PaginationConfig;
};
export declare function executeCompleteApi(context: IExecuteFunctions): Promise<INodeExecutionData[][] | null>;
export {};
