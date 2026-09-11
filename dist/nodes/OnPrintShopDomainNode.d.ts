import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
type OperationMap = Record<string, string[]>;
export interface OnPrintShopDomainConfig {
    displayName: string;
    name: string;
    description: string;
    defaultName: string;
    resources: string[];
    defaultResource: string;
    operations: OperationMap;
}
export declare function buildOnPrintShopDomainDescription(config: OnPrintShopDomainConfig): INodeTypeDescription;
export declare abstract class OnPrintShopDomainNode implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
export {};
