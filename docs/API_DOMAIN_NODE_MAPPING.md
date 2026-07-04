# OnPrintShop API Domain Node Mapping

This document maps the current OnPrintShop Postman GraphQL collection to the reorganized n8n domain nodes. It is intentionally generated so future API updates can be diffed against the node surface instead of reverse-engineering the n8n editor action list.

## Source Contract

| Field | Value |
| --- | --- |
| Collection source | OnPrintShop public Postman documentation and local collection snapshot |
| Collection SHA-256 | 0c38e180d724cdd26129788f425a6d5c78ee0e7dff9e93f74408935d8c8c5dc5 |
| GraphQL operations found | 87 |
| Mapped operations | 87 |
| First-class domain actions | 75 |
| Raw GraphQL fallback actions | 12 |
| Unmapped operations | 0 |
| Stale assignments | 0 |

## Domain Nodes

| Node | Internal Name | Purpose |
| --- | --- | --- |
| OnPrintShop Products | onPrintShopProducts | Product catalog reads, categories, pricing, FAQs, and SKU matrix reads |
| OnPrintShop Product Builder | onPrintShopProductBuilder | Product writes, catalog setup, master-option setup, category writes, SKU writes |
| OnPrintShop Inventory | onPrintShopInventory | Product stock, stock lists, and master-option stock |
| OnPrintShop Orders | onPrintShopOrders | Orders, order products, shipments, batches, quotes, and statuses |
| OnPrintShop Customers | onPrintShopCustomers | Customers and customer addresses |
| OnPrintShop Store Admin | onPrintShopStoreAdmin | Stores, departments, countries, FAQs, markups, payment terms, and reference data |
| OnPrintShop GraphQL | onPrintShopGraphql | Raw GraphQL fallback for contract rows not yet modeled as first-class actions |

The legacy `OnPrintShop` node remains registered as `onPrintShop` for existing workflows. The domain nodes are additive; they do not rewrite saved workflow node types or parameter values.

## Coverage Summary

| Coverage | Count | Meaning |
| --- | --- | --- |
| first-class | 75 | The operation is available as a focused domain-node action and was verified against compiled node metadata. |
| raw-graphql | 12 | The operation is assigned to `OnPrintShop GraphQL` until a dedicated UI action is added. |
| unmapped | 0 | The collection contains an operation without an explicit assignment. This must be fixed before accepting an API update. |

## Full Contract Map

| # | Kind | GraphQL Operation | Collection Path | Conceptual Domain | Domain Node | Node Action | Coverage | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | query | productMasterOptions | Queries / Products / Master Options / Product Master Options | OnPrintShop Product Builder | OnPrintShop Product Builder | product.getManyMasterOptions | first-class | verified |  |
| 2 | query | getMasterOptionTag | Queries / Products / Master Options / Master Option Tag | OnPrintShop Product Builder | OnPrintShop Product Builder | masterOptionTag.getAll | first-class | verified |  |
| 3 | query | getOptionGroup | Queries / Products / Master Options / Option Group | OnPrintShop Product Builder | OnPrintShop Product Builder | optionGroup.getAll | first-class | verified |  |
| 4 | query | getCustomFormula | Queries / Products / Master Options / Option Formulas | OnPrintShop Product Builder | OnPrintShop Product Builder | optionFormulas.getAll | first-class | verified |  |
| 5 | query | getMasterOptionRange | Queries / Products / Master Options / Master Option Ranges | OnPrintShop Product Builder | OnPrintShop Product Builder | masterOptionRanges.getAll | first-class | verified |  |
| 6 | query | productOptionsPrice | Queries / Products / Master Options / Product Option Prices | OnPrintShop Product Builder | OnPrintShop Product Builder | product.getManyOptionPrices | first-class | verified |  |
| 7 | query | productOptionRules | Queries / Products / Master Options / Product Options Rules | OnPrintShop Product Builder | OnPrintShop Product Builder | product.getManyOptionsRules | first-class | verified |  |
| 8 | query | getMasterOptionStockConfigs | Queries / Products / Master Options / Master Option Stock - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.getConfigs | first-class | verified |  |
| 9 | query | getMasterOptionStockHistory | Queries / Products / Master Options / Master Option Stock History - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.getHistory | first-class | verified |  |
| 10 | query | getMasterOptionCombinationMatrix | Queries / Products / Master Options / Master Option Stock Matrix - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.getCombinationMatrix | first-class | verified |  |
| 11 | query | productsDetails | Queries / Products / Product Details | OnPrintShop Products | OnPrintShop Products | product.getManyDetailed | first-class | verified |  |
| 12 | query | productPrice | Queries / Products / Product Prices | OnPrintShop Products | OnPrintShop Products | product.getManyPrices | first-class | verified |  |
| 13 | query | productAdditionalOptions | Queries / Products / Product Additional Option | OnPrintShop Product Builder | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Additional option query is not exposed as a dedicated first-class action yet |
| 14 | query | productsAttributePrice | Queries / Products / Product Additional Attribute Price | OnPrintShop Product Builder | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Attribute price query is not exposed as a dedicated first-class action yet |
| 15 | query | products_attribute_price | Queries / Products / Quantity Based Attribute Price | OnPrintShop Product Builder | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Quantity attribute price query is not exposed as a dedicated first-class action yet |
| 16 | query | productsImageGallery | Queries / Products / Get Product image gallery | OnPrintShop Products | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Image-gallery read is not exposed as a dedicated first-class action yet |
| 17 | query | getProductSkuMatrix | Queries / Products / Get Product Sku Matrix - Staging | OnPrintShop Products | OnPrintShop Products | product.getSkuMatrix | first-class | verified |  |
| 18 | query | productStocks | Queries / Products / Product Stocks | OnPrintShop Inventory | OnPrintShop Inventory | productStocks.getAll | first-class | verified |  |
| 19 | query | productCategory | Queries / Products / Category | OnPrintShop Products | OnPrintShop Products | product.getManyCategories | first-class | verified |  |
| 20 | query | products | Queries / Products / Products | OnPrintShop Products | OnPrintShop Products | product.getManySimple | first-class | verified |  |
| 21 | query | orders | Queries / Orders / Orders | OnPrintShop Orders | OnPrintShop Orders | order.getAll | first-class | verified |  |
| 22 | query | orders | Queries / Orders / Order Details | OnPrintShop Orders | OnPrintShop Orders | orderDetails.getAll | first-class | verified |  |
| 23 | query | orderShipmentDetails | Queries / Orders / Order Shipment Details | OnPrintShop Orders | OnPrintShop Orders | orderShipment.getAll | first-class | verified |  |
| 24 | query | getBatch | Queries / Orders / Get Batch | OnPrintShop Orders | OnPrintShop Orders | batch.getAll | first-class | verified |  |
| 25 | query | orderStatus | Queries / Orders / Order and Order Product Statuses | OnPrintShop Orders | OnPrintShop Orders | status.orderStatus | first-class | verified |  |
| 26 | query | shipToMultipleAddress | Queries / Orders / ShipTo Multiple Address | OnPrintShop Orders | OnPrintShop Orders | shipToMultipleAddress.shipToMultipleAddress | first-class | verified |  |
| 27 | query | customers | Queries / Customers / Customers | OnPrintShop Customers | OnPrintShop Customers | customer.getAll | first-class | verified |  |
| 28 | query | getUserBasket | Queries / Customers / Get User Basket | OnPrintShop Customers | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Basket read is not exposed as a dedicated first-class action yet |
| 29 | query | customerAddressDetails | Queries / Customers / Customer Address Details | OnPrintShop Customers | OnPrintShop Customers | customerAddress.getAll | first-class | verified |  |
| 30 | query | getStoreMarkup | Queries / Store / Markup Master | OnPrintShop Store Admin | OnPrintShop Store Admin | storeMarkup.getAll | first-class | verified |  |
| 31 | query | storeaddress | Queries / Store / Store Address | OnPrintShop Store Admin | OnPrintShop Store Admin | storeAddress.getAll | first-class | verified |  |
| 32 | query | getStore | Queries / Store / Store Details | OnPrintShop Store Admin | OnPrintShop Store Admin | store.getAll | first-class | verified |  |
| 33 | query | getDepartments | Queries / Store / Department Details | OnPrintShop Store Admin | OnPrintShop Store Admin | department.getAll | first-class | verified |  |
| 34 | query | storeCreditSummary | Queries / Store / Store Credit Summary | OnPrintShop Store Admin | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Store credit summary is not exposed as a dedicated first-class action yet |
| 35 | query | accountSummary | Queries / Store / Account Summary | OnPrintShop Store Admin | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Account summary is not exposed as a dedicated first-class action yet |
| 36 | query | getQuote | Queries / Quote / Get Quote | OnPrintShop Orders | OnPrintShop Orders | quote.getAll | first-class | verified |  |
| 37 | query | quoteproduct | Queries / Quote / Get Quote Product | OnPrintShop Orders | OnPrintShop Orders | quoteProduct.getAll | first-class | verified |  |
| 38 | query | faq | Queries / FAQ / FAQs | OnPrintShop Store Admin | OnPrintShop Store Admin | faq.getMany | first-class | verified |  |
| 39 | query | getFaqCategory | Queries / FAQ / FAQs Category | OnPrintShop Store Admin | OnPrintShop Store Admin | faqCategory.getAll | first-class | verified |  |
| 40 | query | getCountries | Queries / Countries | OnPrintShop Store Admin | OnPrintShop Store Admin | countries.getAll | first-class | verified |  |
| 41 | query | getPaymentTermMaster | Queries / Get Payment Terms | OnPrintShop Store Admin | OnPrintShop Store Admin | paymentTerms.getAll | first-class | verified |  |
| 42 | query | faq | Queries / TEST | OnPrintShop Store Admin | OnPrintShop Store Admin | faq.getMany | first-class | verified |  |
| 43 | mutation | setProductOptionRules | Mutations / Products / Master Options / Set Master Option Rules | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductOptionRules | first-class | verified |  |
| 44 | mutation | setCustomFormula | Mutations / Products / Master Options / Set Option Formulas | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setOptionFormulas | first-class | verified |  |
| 45 | mutation | setOptionGroup | Mutations / Products / Master Options / Set Option Group | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setOptionGroup | first-class | verified |  |
| 46 | mutation | setMasterOptionTag | Mutations / Products / Master Options / Set Master Option Tags | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setMasterOptionTags | first-class | verified |  |
| 47 | mutation | setMasterOptionAttributes | Mutations / Products / Master Options / Set Master option attributes | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setMasterOptionAttributes | first-class | verified |  |
| 48 | mutation | setMasterOptionRange | Mutations / Products / Master Options / Set Master option range | OnPrintShop Product Builder | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Master-option range write is not exposed as a dedicated first-class action yet |
| 49 | mutation | setMasterOptionAttributePrice | Mutations / Products / Master Options / Set Master option Attribute price | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setMasterOptionAttributePrice | first-class | verified |  |
| 50 | mutation | setMasterOption | Mutations / Products / Master Options / Set Master option | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setMasterOption | first-class | verified |  |
| 51 | mutation | addMasterOptionStockConfig | Mutations / Products / Master Options / Set Master Option Stock - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.addConfig | first-class | verified |  |
| 52 | mutation | deleteMasterOptionStockConfig | Mutations / Products / Master Options / Delete Master Option Stock - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.deleteConfig | first-class | verified |  |
| 53 | mutation | updateMasterOptionStock | Mutations / Products / Master Options / Credit/Debit Master Option Stock - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.updateStock | first-class | verified |  |
| 54 | mutation | setMasterOptionStockSettings | Mutations / Products / Master Options / Set Master Option Stock Setting - Staging | OnPrintShop Inventory | OnPrintShop Inventory | masterOptionStock.setSettings | first-class | verified |  |
| 55 | mutation | setProduct | Mutations / Products / Set Product | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProduct | first-class | verified |  |
| 56 | mutation | setProductPrice | Mutations / Products / Set Product Price | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductPrice | first-class | verified |  |
| 57 | mutation | setProductSize | Mutations / Products / Set Product Size | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductSize | first-class | verified |  |
| 58 | mutation | setProductPages | Mutations / Products / Set Product Pages | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductPages | first-class | verified |  |
| 59 | mutation | setProductsImageGallery | Mutations / Products / Set Product Image Gallery | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductImage | first-class | verified |  |
| 60 | mutation | setAdditionalOption | Mutations / Products / Set Product Additional Option | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setAdditionalOption | first-class | verified |  |
| 61 | mutation | setProductSku | Mutations / Products / Set Product SKU - Staging | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductSku | first-class | verified |  |
| 62 | mutation | setAdditionalOptionAttributes | Mutations / Products / Set Product Additional Option  Attribute | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setAdditionalOptionAttributes | first-class | verified |  |
| 63 | mutation | setProductsAttributePrice | Mutations / Products / Set Product Additional Option Attribute Price | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductsAttributePrice | first-class | verified |  |
| 64 | mutation | setQuantityBasedAttributePrice | Mutations / Products / Set Quantity Based Attribute Price | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setQuantityBasedAttributePrice | first-class | verified |  |
| 65 | mutation | updateProductStock | Mutations / Products / Update Product Stock | OnPrintShop Inventory | OnPrintShop Inventory | product.updateStock | first-class | verified |  |
| 66 | mutation | setAssignOptions | Mutations / Products / Assign Options | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.assignOptions | first-class | verified |  |
| 67 | mutation | setProductCategory | Mutations / Products / Set Product Category | OnPrintShop Product Builder | OnPrintShop Product Builder | mutation.setProductCategory | first-class | verified |  |
| 68 | mutation | updateOrderStatus | Mutations / Orders / Update Order or Order Product Status | OnPrintShop Orders | OnPrintShop Orders | mutation.updateOrderStatus | first-class | verified |  |
| 69 | mutation | setShipment | Mutations / Orders / Set Shipment | OnPrintShop Orders | OnPrintShop Orders | mutation.setShipment | first-class | verified |  |
| 70 | mutation | setOrderProduct | Mutations / Orders / Set Order Product | OnPrintShop Orders | OnPrintShop Orders | mutation.setOrderProduct | first-class | verified |  |
| 71 | mutation | setOrderProduct | Mutations / Orders / Set Order Product Extra info only | OnPrintShop Orders | OnPrintShop Orders | mutation.setOrderProduct | first-class | verified |  |
| 72 | mutation | setBatch | Mutations / Orders / Set Batch | OnPrintShop Orders | OnPrintShop Orders | mutation.setBatch | first-class | verified |  |
| 73 | mutation | setOrder | Mutations / Orders / Set Order | OnPrintShop Orders | OnPrintShop Orders | mutation.setOrder | first-class | verified |  |
| 74 | mutation | modifyOrderProduct | Mutations / Orders / Modify Order Product | OnPrintShop Orders | OnPrintShop Orders | mutation.modifyOrderProduct | first-class | verified |  |
| 75 | mutation | setOrderProductImage | Mutations / Orders / Update Order Product Images | OnPrintShop Orders | OnPrintShop Orders | mutation.updateOrderProductImages | first-class | verified |  |
| 76 | mutation | setProductDesign | Mutations / Orders / Set Product Design | OnPrintShop Orders | OnPrintShop Orders | mutation.setProductDesign | first-class | verified |  |
| 77 | mutation | notifyUser | Mutations / Customers / Notify User | OnPrintShop Customers | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Notify user is not exposed as a dedicated first-class action yet |
| 78 | mutation | setCustomer | Mutations / Customers / Set Customer | OnPrintShop Customers | OnPrintShop Customers | customer.create | first-class | verified | Customer create and update both call the setCustomer GraphQL mutation |
| 79 | mutation | setCustomerAddressDetail | Mutations / Customers / Set Customer Address | OnPrintShop Customers | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Customer-address write is not exposed as a dedicated first-class action yet |
| 80 | mutation | setUserBasket | Mutations / Customers / Set User Basket | OnPrintShop Customers | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | Basket write is not exposed as a dedicated first-class action yet |
| 81 | mutation | setStoreAddress | Mutations / Store / Set Store Address | OnPrintShop Store Admin | OnPrintShop Store Admin | mutation.setStoreAddress | first-class | verified |  |
| 82 | mutation | setDepartment | Mutations / Store / Set Department | OnPrintShop Store Admin | OnPrintShop Store Admin | mutation.setDepartment | first-class | verified |  |
| 83 | mutation | setStore | Mutations / Store / Set Store | OnPrintShop Store Admin | OnPrintShop Store Admin | mutation.setStore | first-class | verified |  |
| 84 | mutation | setStoreMarkup | Mutations / Store / Set Markup Master | OnPrintShop Store Admin | OnPrintShop Store Admin | mutation.setStoreMarkup | first-class | verified |  |
| 85 | mutation | setQuote | Mutations / Quote / Set Quote | OnPrintShop Orders | OnPrintShop Orders | mutation.setQuote | first-class | verified |  |
| 86 | mutation | setFaqCategory | Mutations / FAQ / Set FAQ Category | OnPrintShop Store Admin | OnPrintShop Store Admin | mutation.setFaqCategory | first-class | verified |  |
| 87 | mutation | setFaq | Mutations / FAQ / Set FAQ | OnPrintShop Store Admin | OnPrintShop GraphQL | graphql.execute | raw-graphql | verified | FAQ write is not exposed as a dedicated first-class action yet |

## Raw GraphQL Backlog

These operations are part of the API contract and are mapped, but they still need first-class UI actions if they become common workflow steps.

| Kind | GraphQL Operation | Collection Path | Owner Domain | Current Node | Reason |
| --- | --- | --- | --- | --- | --- |
| query | productAdditionalOptions | Queries / Products / Product Additional Option | OnPrintShop Product Builder | OnPrintShop GraphQL | Additional option query is not exposed as a dedicated first-class action yet |
| query | productsAttributePrice | Queries / Products / Product Additional Attribute Price | OnPrintShop Product Builder | OnPrintShop GraphQL | Attribute price query is not exposed as a dedicated first-class action yet |
| query | products_attribute_price | Queries / Products / Quantity Based Attribute Price | OnPrintShop Product Builder | OnPrintShop GraphQL | Quantity attribute price query is not exposed as a dedicated first-class action yet |
| query | productsImageGallery | Queries / Products / Get Product image gallery | OnPrintShop Products | OnPrintShop GraphQL | Image-gallery read is not exposed as a dedicated first-class action yet |
| query | getUserBasket | Queries / Customers / Get User Basket | OnPrintShop Customers | OnPrintShop GraphQL | Basket read is not exposed as a dedicated first-class action yet |
| query | storeCreditSummary | Queries / Store / Store Credit Summary | OnPrintShop Store Admin | OnPrintShop GraphQL | Store credit summary is not exposed as a dedicated first-class action yet |
| query | accountSummary | Queries / Store / Account Summary | OnPrintShop Store Admin | OnPrintShop GraphQL | Account summary is not exposed as a dedicated first-class action yet |
| mutation | setMasterOptionRange | Mutations / Products / Master Options / Set Master option range | OnPrintShop Product Builder | OnPrintShop GraphQL | Master-option range write is not exposed as a dedicated first-class action yet |
| mutation | notifyUser | Mutations / Customers / Notify User | OnPrintShop Customers | OnPrintShop GraphQL | Notify user is not exposed as a dedicated first-class action yet |
| mutation | setCustomerAddressDetail | Mutations / Customers / Set Customer Address | OnPrintShop Customers | OnPrintShop GraphQL | Customer-address write is not exposed as a dedicated first-class action yet |
| mutation | setUserBasket | Mutations / Customers / Set User Basket | OnPrintShop Customers | OnPrintShop GraphQL | Basket write is not exposed as a dedicated first-class action yet |
| mutation | setFaq | Mutations / FAQ / Set FAQ | OnPrintShop Store Admin | OnPrintShop GraphQL | FAQ write is not exposed as a dedicated first-class action yet |

## Update Procedure

1. Replace or refresh the Postman collection file.
2. Run `npm run build` so compiled node metadata reflects the source.
3. Run `npm run docs:api-map`.
4. Review any nonzero `Unmapped operations`, `Stale assignments`, or `missing from node metadata` rows.
5. Promote common raw-only rows to first-class domain actions by adding the operation dropdown entry, parameters, execute handler, and updating this generator assignment.

