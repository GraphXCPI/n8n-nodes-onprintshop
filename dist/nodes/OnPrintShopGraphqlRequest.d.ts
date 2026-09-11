import { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
export declare function createOnPrintShopGraphqlClient(context: IExecuteFunctions): Promise<(query: string, variables?: IDataObject, itemIndex?: number) => Promise<IDataObject>>;
export declare function rowsFromFixedCollection(value: unknown, groupName: string): IDataObject[];
export declare function compactObject(value: IDataObject): IDataObject;
export declare function resultItems(result: unknown, itemIndex?: number): INodeExecutionData[];
