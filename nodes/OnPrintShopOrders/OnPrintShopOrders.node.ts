import { ONPRINTSHOP_ORDERS_DOMAIN } from '../OnPrintShopDomainConfigs';
import { buildOnPrintShopDomainDescription, OnPrintShopDomainNode } from '../OnPrintShopDomainNode';

export class OnPrintShopOrders extends OnPrintShopDomainNode {
	description = buildOnPrintShopDomainDescription(ONPRINTSHOP_ORDERS_DOMAIN);
}
