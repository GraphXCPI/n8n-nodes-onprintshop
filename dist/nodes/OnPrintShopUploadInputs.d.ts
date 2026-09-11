import { IExecuteFunctions, IDataObject, INodeTypeDescription } from 'n8n-workflow';
export declare function addUploadInputs(description: INodeTypeDescription): void;
export declare function readOrderUrlInput(context: IExecuteFunctions, index: number): IDataObject;
export declare function readUploadInput(context: IExecuteFunctions, operation: string, index: number): string;
