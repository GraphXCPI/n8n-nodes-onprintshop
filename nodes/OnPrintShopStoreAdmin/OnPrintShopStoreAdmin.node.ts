import { ONPRINTSHOP_STORE_ADMIN_DOMAIN } from '../OnPrintShopDomainConfigs';
import { buildOnPrintShopDomainDescription, OnPrintShopDomainNode } from '../OnPrintShopDomainNode';

export class OnPrintShopStoreAdmin extends OnPrintShopDomainNode {
	description = buildOnPrintShopDomainDescription(ONPRINTSHOP_STORE_ADMIN_DOMAIN);
}
