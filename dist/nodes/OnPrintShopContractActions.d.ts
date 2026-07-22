import { IExecuteFunctions, INodeExecutionData, INodeTypeDescription } from 'n8n-workflow';
export declare function extendOnPrintShopDomainDescription(description: INodeTypeDescription, domainName: string): INodeTypeDescription;
export declare function executeOnPrintShopContractAction(context: IExecuteFunctions): Promise<INodeExecutionData[][] | null>;
