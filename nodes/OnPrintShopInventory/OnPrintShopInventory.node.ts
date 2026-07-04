import { ONPRINTSHOP_INVENTORY_DOMAIN } from '../OnPrintShopDomainConfigs';
import { buildOnPrintShopDomainDescription, OnPrintShopDomainNode } from '../OnPrintShopDomainNode';

export class OnPrintShopInventory extends OnPrintShopDomainNode {
	description = buildOnPrintShopDomainDescription(ONPRINTSHOP_INVENTORY_DOMAIN);
}
