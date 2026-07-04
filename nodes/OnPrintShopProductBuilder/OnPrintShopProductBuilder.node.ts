import { ONPRINTSHOP_PRODUCT_BUILDER_DOMAIN } from '../OnPrintShopDomainConfigs';
import { buildOnPrintShopDomainDescription, OnPrintShopDomainNode } from '../OnPrintShopDomainNode';

export class OnPrintShopProductBuilder extends OnPrintShopDomainNode {
	description = buildOnPrintShopDomainDescription(ONPRINTSHOP_PRODUCT_BUILDER_DOMAIN);
}
