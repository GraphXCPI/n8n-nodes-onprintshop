import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeTypeDescription } from 'n8n-workflow';
export declare function addCompleteApi(description: INodeTypeDescription, domain?: string): INodeTypeDescription;
export declare function buildCompleteRequest(context: IExecuteFunctions, index: number): {
    query: string;
    variables: IDataObject;
    name: string;
};
export declare function executeCompleteApi(context: IExecuteFunctions): Promise<INodeExecutionData[][] | null>;
