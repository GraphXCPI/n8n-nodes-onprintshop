# Runtime API Mapping

Generated from actual node executor requests, not action labels or Postman substring matches.
Schema snapshot: 2026-09-07; SHA-256: `6dce983d1a409873cec686cf265af367105a9877a908b8a153afa9e44045ffcc`.

- 275 exposed structured action paths, including legacy aliases and domain nodes.
- 88 distinct root operations exercised by these action paths.
- Default and all-selectable-field queries, typed variables, required UI lookups, and schema-shaped responses are checked by the release gate.
- This is not proof of live mutation behavior, every optional input combination, pagination behavior, or tenant-specific permissions.
- Raw GraphQL is intentionally excluded from the generated-action audit; preservation of user documents and JSON is regression-tested separately.

## Root Coverage Gaps

The following schema roots do not have a separately exercised structured root action. Some data is available through nested selections; raw GraphQL remains available. This list must not be described as complete first-class UI coverage:

- `query.adminExtraFieldValues`
- `query.attributes`
- `query.authenticateCustomer`
- `query.orderBillingDetails`
- `query.orderBlindDetails`
- `query.orderDeliveryDetails`
- `query.orderProducts`
- `query.orderSummary`
- `query.productSize`
- `query.validateCustomerToken`
- `mutation.setAdminExtraFieldValues`

## Action Map

| Node | Resource | Stable Operation | Actual API Roots | Schema / UI / Response |
| --- | --- | --- | --- | --- |
| onPrintShopProducts | product | getCategory | query.productCategory | Pass |
| onPrintShopProducts | product | getDetailed | query.productsDetails | Pass |
| onPrintShopProducts | product | getFAQs | query.faq | Pass |
| onPrintShopProducts | product | getManyCategories | query.productCategory | Pass |
| onPrintShopProducts | product | getManyDetailed | query.productsDetails | Pass |
| onPrintShopProducts | product | getManyFAQs | query.faq | Pass |
| onPrintShopProducts | product | getManyMasterOptionRanges | query.getMasterOptionRange | Pass |
| onPrintShopProducts | product | getManyMasterOptionTags | query.getMasterOptionTag | Pass |
| onPrintShopProducts | product | getManyMasterOptions | query.productMasterOptions | Pass |
| onPrintShopProducts | product | getManyOptionGroups | query.getOptionGroup | Pass |
| onPrintShopProducts | product | getManyOptionPrices | query.productOptionsPrice | Pass |
| onPrintShopProducts | product | getManyOptionsRules | query.productOptionRules | Pass |
| onPrintShopProducts | product | getManyPrices | query.productPrice | Pass |
| onPrintShopProducts | product | getManySimple | query.products | Pass |
| onPrintShopProducts | product | getMasterOptions | query.productMasterOptions | Pass |
| onPrintShopProducts | product | getOptionPrices | query.productOptionsPrice | Pass |
| onPrintShopProducts | product | getOptionsRules | query.productOptionRules | Pass |
| onPrintShopProducts | product | getPrices | query.productPrice | Pass |
| onPrintShopProducts | product | getSimple | query.products | Pass |
| onPrintShopProducts | product | getSkuMatrix | query.getProductSkuMatrix | Pass |
| onPrintShopProducts | productImage | getMany | query.productsImageGallery | Pass |
| onPrintShopProductBuilder | markupMaster | getAll | query.getStoreMarkup | Pass |
| onPrintShopProductBuilder | masterOptionRanges | getAll | query.getMasterOptionRange | Pass |
| onPrintShopProductBuilder | masterOptionTag | getAll | query.getMasterOptionTag | Pass |
| onPrintShopProductBuilder | mutation | assignOptions | mutation.setAssignOptions | Pass |
| onPrintShopProductBuilder | mutation | setAdditionalOption | mutation.setAdditionalOption | Pass |
| onPrintShopProductBuilder | mutation | setAdditionalOptionAttributes | mutation.setAdditionalOptionAttributes | Pass |
| onPrintShopProductBuilder | mutation | setMarkupMaster | mutation.setStoreMarkup | Pass |
| onPrintShopProductBuilder | mutation | setMasterOption | mutation.setMasterOption | Pass |
| onPrintShopProductBuilder | mutation | setMasterOptionAttributePrice | mutation.setMasterOptionAttributePrice | Pass |
| onPrintShopProductBuilder | mutation | setMasterOptionAttributes | mutation.setMasterOptionAttributes | Pass |
| onPrintShopProductBuilder | mutation | setMasterOptionRules | mutation.setProductOptionRules | Pass |
| onPrintShopProductBuilder | mutation | setMasterOptionTags | mutation.setMasterOptionTag | Pass |
| onPrintShopProductBuilder | mutation | setOptionFormulas | mutation.setCustomFormula | Pass |
| onPrintShopProductBuilder | mutation | setOptionGroup | mutation.setOptionGroup | Pass |
| onPrintShopProductBuilder | mutation | setProduct | mutation.setProduct | Pass |
| onPrintShopProductBuilder | mutation | setProductCategory | mutation.setProductCategory | Pass |
| onPrintShopProductBuilder | mutation | setProductImage | mutation.setProductsImageGallery | Pass |
| onPrintShopProductBuilder | mutation | setProductOptionRules | mutation.setProductOptionRules | Pass |
| onPrintShopProductBuilder | mutation | setProductPages | mutation.setProductPages | Pass |
| onPrintShopProductBuilder | mutation | setProductPrice | mutation.setProductPrice | Pass |
| onPrintShopProductBuilder | mutation | setProductSize | mutation.setProductSize | Pass |
| onPrintShopProductBuilder | mutation | setProductSku | mutation.setProductSku | Pass |
| onPrintShopProductBuilder | mutation | setProductsAttributePrice | mutation.setProductsAttributePrice | Pass |
| onPrintShopProductBuilder | mutation | setQuantityBasedAttributePrice | mutation.setQuantityBasedAttributePrice | Pass |
| onPrintShopProductBuilder | optionFormulas | getAll | query.getCustomFormula | Pass |
| onPrintShopProductBuilder | optionGroup | getAll | query.getOptionGroup | Pass |
| onPrintShopProductBuilder | product | getManyMasterOptionRanges | query.getMasterOptionRange | Pass |
| onPrintShopProductBuilder | product | getManyMasterOptionTags | query.getMasterOptionTag | Pass |
| onPrintShopProductBuilder | product | getManyMasterOptions | query.productMasterOptions | Pass |
| onPrintShopProductBuilder | product | getManyOptionGroups | query.getOptionGroup | Pass |
| onPrintShopProductBuilder | product | getManyOptionPrices | query.productOptionsPrice | Pass |
| onPrintShopProductBuilder | product | getManyOptionsRules | query.productOptionRules | Pass |
| onPrintShopProductBuilder | product | getMasterOptions | query.productMasterOptions | Pass |
| onPrintShopProductBuilder | product | getOptionPrices | query.productOptionsPrice | Pass |
| onPrintShopProductBuilder | product | getOptionsRules | query.productOptionRules | Pass |
| onPrintShopProductBuilder | productAdditionalOption | getMany | query.productAdditionalOptions | Pass |
| onPrintShopProductBuilder | productAttributePrice | getMany | query.productsAttributePrice | Pass |
| onPrintShopProductBuilder | quantityAttributePrice | getMany | query.quantityBasedAttributePrice | Pass |
| onPrintShopInventory | masterOptionStock | addConfig | mutation.addMasterOptionStockConfig | Pass |
| onPrintShopInventory | masterOptionStock | deleteConfig | mutation.deleteMasterOptionStockConfig | Pass |
| onPrintShopInventory | masterOptionStock | getCombinationMatrix | query.getMasterOptionCombinationMatrix | Pass |
| onPrintShopInventory | masterOptionStock | getConfigs | query.getMasterOptionStockConfigs | Pass |
| onPrintShopInventory | masterOptionStock | getHistory | query.getMasterOptionStockHistory | Pass |
| onPrintShopInventory | masterOptionStock | setSettings | mutation.setMasterOptionStockSettings | Pass |
| onPrintShopInventory | masterOptionStock | updateStock | mutation.updateMasterOptionStock | Pass |
| onPrintShopInventory | product | getStock | query.productStocks | Pass |
| onPrintShopInventory | product | updateStock | mutation.updateProductStock | Pass |
| onPrintShopInventory | productStocks | getAll | query.productStocks | Pass |
| onPrintShopMasterOptions | attribute | set | mutation.setMasterOptionAttributes | Pass |
| onPrintShopMasterOptions | attributePrice | getMany | query.productOptionsPrice | Pass |
| onPrintShopMasterOptions | attributePrice | set | mutation.setMasterOptionAttributePrice | Pass |
| onPrintShopMasterOptions | formula | getMany | query.getCustomFormula | Pass |
| onPrintShopMasterOptions | formula | set | mutation.setCustomFormula | Pass |
| onPrintShopMasterOptions | masterOption | getMany | query.productMasterOptions | Pass |
| onPrintShopMasterOptions | masterOption | set | mutation.setMasterOption | Pass |
| onPrintShopMasterOptions | optionGroup | getMany | query.getOptionGroup | Pass |
| onPrintShopMasterOptions | optionGroup | set | mutation.setOptionGroup | Pass |
| onPrintShopMasterOptions | range | getMany | query.getMasterOptionRange | Pass |
| onPrintShopMasterOptions | range | set | mutation.setMasterOptionRange | Pass |
| onPrintShopMasterOptions | rule | getMany | query.productOptionRules | Pass |
| onPrintShopMasterOptions | rule | set | mutation.setProductOptionRules | Pass |
| onPrintShopMasterOptions | stock | addConfig | mutation.addMasterOptionStockConfig | Pass |
| onPrintShopMasterOptions | stock | deleteConfig | mutation.deleteMasterOptionStockConfig | Pass |
| onPrintShopMasterOptions | stock | getCombinationMatrix | query.getMasterOptionCombinationMatrix | Pass |
| onPrintShopMasterOptions | stock | getConfigs | query.getMasterOptionStockConfigs | Pass |
| onPrintShopMasterOptions | stock | getHistory | query.getMasterOptionStockHistory | Pass |
| onPrintShopMasterOptions | stock | setSettings | mutation.setMasterOptionStockSettings | Pass |
| onPrintShopMasterOptions | stock | updateStock | mutation.updateMasterOptionStock | Pass |
| onPrintShopMasterOptions | tag | getMany | query.getMasterOptionTag | Pass |
| onPrintShopMasterOptions | tag | set | mutation.setMasterOptionTag | Pass |
| onPrintShopOrders | batch | getAll | query.getBatch | Pass |
| onPrintShopOrders | mutation | addProofVersion | mutation.setOrderProductImage | Pass |
| onPrintShopOrders | mutation | modifyOrderProduct | mutation.modifyOrderProduct | Pass |
| onPrintShopOrders | mutation | setBatch | mutation.setBatch | Pass |
| onPrintShopOrders | mutation | setOrder | mutation.setOrder | Pass |
| onPrintShopOrders | mutation | setOrderProduct | mutation.setOrderProduct | Pass |
| onPrintShopOrders | mutation | setProductDesign | mutation.setProductDesign | Pass |
| onPrintShopOrders | mutation | setQuote | mutation.setQuote | Pass |
| onPrintShopOrders | mutation | setShipment | mutation.setShipment | Pass |
| onPrintShopOrders | mutation | updateOrderProductImages | mutation.setOrderProductImage | Pass |
| onPrintShopOrders | mutation | updateOrderStatus | mutation.updateOrderStatus | Pass |
| onPrintShopOrders | mutation | updateZiflowLinkImages | mutation.setOrderProductImage | Pass |
| onPrintShopOrders | order | createShipment | mutation.setShipment | Pass |
| onPrintShopOrders | order | get | query.orders | Pass |
| onPrintShopOrders | order | getAll | query.orders | Pass |
| onPrintShopOrders | order | getMany | query.orders | Pass |
| onPrintShopOrders | order | getShipments | query.orderShipmentDetails | Pass |
| onPrintShopOrders | orderDetails | getAll | query.orders | Pass |
| onPrintShopOrders | orderDetails | getMany | query.orders | Pass |
| onPrintShopOrders | orderProducts | get | query.orders | Pass |
| onPrintShopOrders | orderProducts | getMany | query.orders | Pass |
| onPrintShopOrders | orderProducts | setDesign | mutation.setProductDesign | Pass |
| onPrintShopOrders | orderProducts | updateStatus | mutation.updateOrderStatus | Pass |
| onPrintShopOrders | orderShipment | getAll | query.orders | Pass |
| onPrintShopOrders | orderShipment | getMany | query.orders | Pass |
| onPrintShopOrders | quote | getAll | query.getQuote | Pass |
| onPrintShopOrders | quoteProduct | getAll | query.quoteproduct | Pass |
| onPrintShopOrders | shipToMultipleAddress | getAll | query.shipToMultipleAddress | Pass |
| onPrintShopOrders | shipToMultipleAddress | shipToMultipleAddress | query.shipToMultipleAddress | Pass |
| onPrintShopOrders | status | orderProductStatus | query.orderStatus | Pass |
| onPrintShopOrders | status | orderStatus | query.orderStatus | Pass |
| onPrintShopOrders | status | getManyStatus | query.orderStatus | Pass |
| onPrintShopOrders | status | getStatus | query.orderStatus | Pass |
| onPrintShopCustomers | customer | create | mutation.setCustomer | Pass |
| onPrintShopCustomers | customer | get | query.customers | Pass |
| onPrintShopCustomers | customer | getAll | query.customers | Pass |
| onPrintShopCustomers | customer | getMany | query.customers | Pass |
| onPrintShopCustomers | customer | update | mutation.setCustomer | Pass |
| onPrintShopCustomers | customerAddress | getAll | query.customerAddressDetails | Pass |
| onPrintShopCustomers | customerAddress | getMany | query.customerAddressDetails | Pass |
| onPrintShopCustomers | customerAddress | set | mutation.setCustomerAddressDetail | Pass |
| onPrintShopCustomers | basket | get | query.getUserBasket | Pass |
| onPrintShopCustomers | basket | set | mutation.setUserBasket | Pass |
| onPrintShopCustomers | notification | send | mutation.notifyUser | Pass |
| onPrintShopStoreAdmin | countries | getAll | query.getCountries | Pass |
| onPrintShopStoreAdmin | department | setDepartment | mutation.setDepartment | Pass |
| onPrintShopStoreAdmin | department | getAll | query.getDepartments | Pass |
| onPrintShopStoreAdmin | faq | getMany | query.faq | Pass |
| onPrintShopStoreAdmin | faq | set | mutation.setFaq | Pass |
| onPrintShopStoreAdmin | faqCategory | getAll | query.getFaqCategory | Pass |
| onPrintShopStoreAdmin | mutation | setDepartment | mutation.setDepartment | Pass |
| onPrintShopStoreAdmin | mutation | setFaqCategory | mutation.setFaqCategory | Pass |
| onPrintShopStoreAdmin | mutation | setStore | mutation.setStore | Pass |
| onPrintShopStoreAdmin | mutation | setStoreAddress | mutation.setStoreAddress | Pass |
| onPrintShopStoreAdmin | mutation | setStoreMarkup | mutation.setStoreMarkup | Pass |
| onPrintShopStoreAdmin | paymentTerms | getAll | query.getPaymentTermMaster | Pass |
| onPrintShopStoreAdmin | store | setStore | mutation.setStore | Pass |
| onPrintShopStoreAdmin | store | setStoreAddress | mutation.setStoreAddress | Pass |
| onPrintShopStoreAdmin | store | getCountries | query.getCountries | Pass |
| onPrintShopStoreAdmin | store | getAll | query.getStore | Pass |
| onPrintShopStoreAdmin | store | storeAddress | query.storeaddress | Pass |
| onPrintShopStoreAdmin | storeAddress | getAll | query.storeaddress | Pass |
| onPrintShopStoreAdmin | storeMarkup | getAll | query.getStoreMarkup | Pass |
| onPrintShopStoreAdmin | accountSummary | getMany | query.accountSummary | Pass |
| onPrintShopStoreAdmin | adminExtraField | getMany | query.adminExtraFields | Pass |
| onPrintShopStoreAdmin | adminExtraField | set | mutation.setAdminExtraField | Pass |
| onPrintShopStoreAdmin | storeCredit | getMany | query.storeCreditSummary | Pass |
| onPrintShopStoreAdmin | storeLocation | getMany | query.getStoreLocations | Pass |
| onPrintShopStoreAdmin | storeLocation | set | mutation.setStoreLocation | Pass |
| onPrintShop | batch | getAll | query.getBatch | Pass |
| onPrintShop | countries | getAll | query.getCountries | Pass |
| onPrintShop | customer | create | mutation.setCustomer | Pass |
| onPrintShop | customer | get | query.customers | Pass |
| onPrintShop | customer | getAll | query.customers | Pass |
| onPrintShop | customer | getMany | query.customers | Pass |
| onPrintShop | customer | update | mutation.setCustomer | Pass |
| onPrintShop | customerAddress | getAll | query.customerAddressDetails | Pass |
| onPrintShop | customerAddress | getMany | query.customerAddressDetails | Pass |
| onPrintShop | department | setDepartment | mutation.setDepartment | Pass |
| onPrintShop | department | getAll | query.getDepartments | Pass |
| onPrintShop | faq | getMany | query.faq | Pass |
| onPrintShop | faqCategory | getAll | query.getFaqCategory | Pass |
| onPrintShop | markupMaster | getAll | query.getStoreMarkup | Pass |
| onPrintShop | masterOptionRanges | getAll | query.getMasterOptionRange | Pass |
| onPrintShop | masterOptionStock | addConfig | mutation.addMasterOptionStockConfig | Pass |
| onPrintShop | masterOptionStock | deleteConfig | mutation.deleteMasterOptionStockConfig | Pass |
| onPrintShop | masterOptionStock | getCombinationMatrix | query.getMasterOptionCombinationMatrix | Pass |
| onPrintShop | masterOptionStock | getConfigs | query.getMasterOptionStockConfigs | Pass |
| onPrintShop | masterOptionStock | getHistory | query.getMasterOptionStockHistory | Pass |
| onPrintShop | masterOptionStock | setSettings | mutation.setMasterOptionStockSettings | Pass |
| onPrintShop | masterOptionStock | updateStock | mutation.updateMasterOptionStock | Pass |
| onPrintShop | masterOptionTag | getAll | query.getMasterOptionTag | Pass |
| onPrintShop | mutation | addProofVersion | mutation.setOrderProductImage | Pass |
| onPrintShop | mutation | assignOptions | mutation.setAssignOptions | Pass |
| onPrintShop | mutation | modifyOrderProduct | mutation.modifyOrderProduct | Pass |
| onPrintShop | mutation | setAdditionalOption | mutation.setAdditionalOption | Pass |
| onPrintShop | mutation | setAdditionalOptionAttributes | mutation.setAdditionalOptionAttributes | Pass |
| onPrintShop | mutation | setBatch | mutation.setBatch | Pass |
| onPrintShop | mutation | setDepartment | mutation.setDepartment | Pass |
| onPrintShop | mutation | setFaqCategory | mutation.setFaqCategory | Pass |
| onPrintShop | mutation | setMarkupMaster | mutation.setStoreMarkup | Pass |
| onPrintShop | mutation | setMasterOption | mutation.setMasterOption | Pass |
| onPrintShop | mutation | setMasterOptionAttributePrice | mutation.setMasterOptionAttributePrice | Pass |
| onPrintShop | mutation | setMasterOptionAttributes | mutation.setMasterOptionAttributes | Pass |
| onPrintShop | mutation | setMasterOptionRules | mutation.setProductOptionRules | Pass |
| onPrintShop | mutation | setMasterOptionTags | mutation.setMasterOptionTag | Pass |
| onPrintShop | mutation | setOptionFormulas | mutation.setCustomFormula | Pass |
| onPrintShop | mutation | setOptionGroup | mutation.setOptionGroup | Pass |
| onPrintShop | mutation | setOrder | mutation.setOrder | Pass |
| onPrintShop | mutation | setOrderProduct | mutation.setOrderProduct | Pass |
| onPrintShop | mutation | setProduct | mutation.setProduct | Pass |
| onPrintShop | mutation | setProductCategory | mutation.setProductCategory | Pass |
| onPrintShop | mutation | setProductDesign | mutation.setProductDesign | Pass |
| onPrintShop | mutation | setProductImage | mutation.setProductsImageGallery | Pass |
| onPrintShop | mutation | setProductOptionRules | mutation.setProductOptionRules | Pass |
| onPrintShop | mutation | setProductPages | mutation.setProductPages | Pass |
| onPrintShop | mutation | setProductPrice | mutation.setProductPrice | Pass |
| onPrintShop | mutation | setProductSize | mutation.setProductSize | Pass |
| onPrintShop | mutation | setProductSku | mutation.setProductSku | Pass |
| onPrintShop | mutation | setProductsAttributePrice | mutation.setProductsAttributePrice | Pass |
| onPrintShop | mutation | setQuantityBasedAttributePrice | mutation.setQuantityBasedAttributePrice | Pass |
| onPrintShop | mutation | setQuote | mutation.setQuote | Pass |
| onPrintShop | mutation | setShipment | mutation.setShipment | Pass |
| onPrintShop | mutation | setStore | mutation.setStore | Pass |
| onPrintShop | mutation | setStoreAddress | mutation.setStoreAddress | Pass |
| onPrintShop | mutation | setStoreMarkup | mutation.setStoreMarkup | Pass |
| onPrintShop | mutation | updateOrderProductImages | mutation.setOrderProductImage | Pass |
| onPrintShop | mutation | updateOrderStatus | mutation.updateOrderStatus | Pass |
| onPrintShop | mutation | updateZiflowLinkImages | mutation.setOrderProductImage | Pass |
| onPrintShop | optionFormulas | getAll | query.getCustomFormula | Pass |
| onPrintShop | optionGroup | getAll | query.getOptionGroup | Pass |
| onPrintShop | order | createShipment | mutation.setShipment | Pass |
| onPrintShop | order | get | query.orders | Pass |
| onPrintShop | order | getAll | query.orders | Pass |
| onPrintShop | order | getMany | query.orders | Pass |
| onPrintShop | order | getShipments | query.orderShipmentDetails | Pass |
| onPrintShop | orderDetails | getAll | query.orders | Pass |
| onPrintShop | orderDetails | getMany | query.orders | Pass |
| onPrintShop | orderProducts | get | query.orders | Pass |
| onPrintShop | orderProducts | getMany | query.orders | Pass |
| onPrintShop | orderProducts | setDesign | mutation.setProductDesign | Pass |
| onPrintShop | orderProducts | updateStatus | mutation.updateOrderStatus | Pass |
| onPrintShop | orderShipment | getAll | query.orders | Pass |
| onPrintShop | orderShipment | getMany | query.orders | Pass |
| onPrintShop | paymentTerms | getAll | query.getPaymentTermMaster | Pass |
| onPrintShop | product | getCategory | query.productCategory | Pass |
| onPrintShop | product | getDetailed | query.productsDetails | Pass |
| onPrintShop | product | getFAQs | query.faq | Pass |
| onPrintShop | product | getManyCategories | query.productCategory | Pass |
| onPrintShop | product | getManyDetailed | query.productsDetails | Pass |
| onPrintShop | product | getManyFAQs | query.faq | Pass |
| onPrintShop | product | getManyMasterOptionRanges | query.getMasterOptionRange | Pass |
| onPrintShop | product | getManyMasterOptionTags | query.getMasterOptionTag | Pass |
| onPrintShop | product | getManyMasterOptions | query.productMasterOptions | Pass |
| onPrintShop | product | getManyOptionGroups | query.getOptionGroup | Pass |
| onPrintShop | product | getManyOptionPrices | query.productOptionsPrice | Pass |
| onPrintShop | product | getManyOptionsRules | query.productOptionRules | Pass |
| onPrintShop | product | getManyPrices | query.productPrice | Pass |
| onPrintShop | product | getManySimple | query.products | Pass |
| onPrintShop | product | getMasterOptions | query.productMasterOptions | Pass |
| onPrintShop | product | getOptionPrices | query.productOptionsPrice | Pass |
| onPrintShop | product | getOptionsRules | query.productOptionRules | Pass |
| onPrintShop | product | getPrices | query.productPrice | Pass |
| onPrintShop | product | getSimple | query.products | Pass |
| onPrintShop | product | getSkuMatrix | query.getProductSkuMatrix | Pass |
| onPrintShop | product | getStock | query.productStocks | Pass |
| onPrintShop | product | setProductSku | mutation.setProductSku | Pass |
| onPrintShop | product | updateStock | mutation.updateProductStock | Pass |
| onPrintShop | productStocks | getAll | query.productStocks | Pass |
| onPrintShop | quote | getAll | query.getQuote | Pass |
| onPrintShop | quoteProduct | getAll | query.quoteproduct | Pass |
| onPrintShop | shipToMultipleAddress | getAll | query.shipToMultipleAddress | Pass |
| onPrintShop | shipToMultipleAddress | shipToMultipleAddress | query.shipToMultipleAddress | Pass |
| onPrintShop | status | orderProductStatus | query.orderStatus | Pass |
| onPrintShop | status | orderStatus | query.orderStatus | Pass |
| onPrintShop | status | getManyStatus | query.orderStatus | Pass |
| onPrintShop | status | getStatus | query.orderStatus | Pass |
| onPrintShop | store | setStore | mutation.setStore | Pass |
| onPrintShop | store | setStoreAddress | mutation.setStoreAddress | Pass |
| onPrintShop | store | getCountries | query.getCountries | Pass |
| onPrintShop | store | getAll | query.getStore | Pass |
| onPrintShop | store | storeAddress | query.storeaddress | Pass |
| onPrintShop | storeAddress | getAll | query.storeaddress | Pass |
| onPrintShop | storeMarkup | getAll | query.getStoreMarkup | Pass |
