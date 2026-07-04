import { ONPRINTSHOP_GRAPHQL_DOMAIN } from '../OnPrintShopDomainConfigs';
import { buildOnPrintShopDomainDescription, OnPrintShopDomainNode } from '../OnPrintShopDomainNode';

export class OnPrintShopGraphql extends OnPrintShopDomainNode {
	description = buildOnPrintShopDomainDescription(ONPRINTSHOP_GRAPHQL_DOMAIN);
}
