"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnPrintShopOrders = void 0;
const OnPrintShopDomainConfigs_1 = require("../OnPrintShopDomainConfigs");
const OnPrintShopDomainNode_1 = require("../OnPrintShopDomainNode");
class OnPrintShopOrders extends OnPrintShopDomainNode_1.OnPrintShopDomainNode {
    constructor() {
        super(...arguments);
        this.description = (0, OnPrintShopDomainNode_1.buildOnPrintShopDomainDescription)(OnPrintShopDomainConfigs_1.ONPRINTSHOP_ORDERS_DOMAIN);
    }
}
exports.OnPrintShopOrders = OnPrintShopOrders;
