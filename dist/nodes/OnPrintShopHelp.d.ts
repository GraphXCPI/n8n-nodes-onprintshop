import { INodeTypeDescription } from 'n8n-workflow';
export declare const ONPRINTSHOP_OPERATOR_DOC_URL = "https://github.com/GraphXCPI/n8n-nodes-onprintshop/blob/main/docs/NODE_OPERATOR_GUIDE.md";
export declare const ONPRINTSHOP_POSTMAN_DOC_URL = "https://documenter.getpostman.com/view/33263100/2sBXijHWys#intro";
export type OnPrintShopFieldSelectionMode = 'custom' | 'all' | 'none';
export declare const ONPRINTSHOP_FIELD_SELECTION_MODE_SUFFIX = "Mode";
export declare function isOnPrintShopFieldSelectionSentinel(value: unknown): boolean;
export declare function cleanOnPrintShopFieldValues(values?: string[]): string[];
export declare function addOnPrintShopHelp(description: INodeTypeDescription): INodeTypeDescription;
