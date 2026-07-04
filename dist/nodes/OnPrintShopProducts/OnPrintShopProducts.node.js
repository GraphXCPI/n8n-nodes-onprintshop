"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPrintShopProducts = void 0;
const OnPrintShopDomainConfigs_1 = require("../OnPrintShopDomainConfigs");
const OnPrintShopDomainNode_1 = require("../OnPrintShopDomainNode");
class OnPrintShopProducts extends OnPrintShopDomainNode_1.OnPrintShopDomainNode {
    constructor() {
        super(...arguments);
        this.description = (0, OnPrintShopDomainNode_1.buildOnPrintShopDomainDescription)(OnPrintShopDomainConfigs_1.ONPRINTSHOP_PRODUCTS_DOMAIN);
    }
}
exports.OnPrintShopProducts = OnPrintShopProducts;
