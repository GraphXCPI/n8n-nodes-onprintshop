# Complete API Controls

Generated from the checked-in GraphQL schema. Regenerate with `node scripts/generate-complete-api.js`.

## Usage and compatibility

In an OnPrintShop domain node, choose **Complete API**, then the named operation. These are native, typed n8n controls, not a raw GraphQL editor. The all-in-one node also exposes the full catalog. Existing resource values, operation values, parameter names, and output behavior are retained for saved workflows.

**Fields** mode supplies named arguments, enums, numbers, booleans and repeatable nested records. Optional parameters are added explicitly so omitted values remain omitted; zero, false and empty strings are not silently discarded. **JSON Object** mode accepts an arguments object for expressions and bulk input, including explicit nulls. Every typed input is validated before authentication or sending.

The API defines some payloads as opaque JSON scalars. Those fields retain a JSON control because GraphQL provides no subfield contract; this does not imply their business rules or every JSON shape has been validated. Existing specialized controls remain available for documented JSON payloads such as URL-upload files.

Return Fields Mode supports All Fields or Custom Selection. Nested selections use their complete field path. Nested return-field arguments have separate parameter controls. Outputs preserve the API root envelope, counts, arrays and nulls, with one output item per input item. This differs from some older convenience actions that flatten rows; adjust downstream expressions only when deliberately moving to Complete API.

Safe Mode blocks every mutation. Operations using customer passwords or tokens have masked input controls. Remote errors never copy the request or response payload into execution errors.

## Verification boundary

The verification suite compares the complete root inventory with the schema, checks every argument control and nested typed input, compares Fields and JSON request payloads, validates every individual return-field selection, and tests multi-item output, required-field errors, Safe Mode, and continue-on-fail. It is a contract and mocked execution test, not permission to claim successful live writes.

Read-only introspection on 2026-09-12 observed 52 queries and 49 mutations on live, and 52 queries and 48 mutations on staging. Staging lacked `setBatchJob`. URL upload mutations were present on both. Environment availability must be rechecked before use; no fallback to another credential or host occurs.

## Inventory

The contract contains 101 roots (52 queries and 49 mutations).

| Domain node | Kind | Operation | Arguments | Return leaf paths |
| --- | --- | --- | --- | --- |
| onPrintShopStoreAdmin | query | `accountSummary` | `limit: Int`, `offset: Int`, `storeid: Int` | 14 |
| onPrintShopStoreAdmin | query | `adminExtraFieldValues` | `entity_id: Int!`, `entity_type: String!` | 8 |
| onPrintShopStoreAdmin | query | `adminExtraFields` | `admin_extra_field_id: Int`, `available_to: String`, `limit: Int`, `offset: Int`, `status: String` | 19 |
| onPrintShopProducts | query | `attributes` | `limit: Int`, `offset: Int`, `prod_add_opt_id: Int` | 15 |
| onPrintShopCustomers | query | `authenticateCustomer` | `email: String`, `password: String` | 2 |
| onPrintShopCustomers | query | `customerAddressDetails` | `limit: Int`, `offset: Int`, `user_id: Int` | 16 |
| onPrintShopCustomers | query | `customers` | `corporate_id: Int`, `date_type: CustomerDateTypeEnum`, `department_id: Int`, `email: String`, `from_date: String`, `limit: Int`, `offset: Int`, `to_date: String` | 44 |
| onPrintShopStoreAdmin | query | `faq` | `faq_id: Int`, `faqcat_id: Int`, `limit: Int`, `offset: Int` | 12 |
| onPrintShopOrders | query | `getBatch` | `batch_id: Int`, `limit: Int`, `offset: Int`, `search: String` | 17 |
| onPrintShopStoreAdmin | query | `getCountries` | `countries_id: Int`, `limit: Int`, `offset: Int`, `status: Int` | 7 |
| onPrintShopProductBuilder | query | `getCustomFormula` | `formula_id: Int`, `limit: Int`, `offset: Int` | 5 |
| onPrintShopStoreAdmin | query | `getDepartments` | `corporate_id: Int`, `department_id: Int`, `limit: Int`, `offset: Int` | 11 |
| onPrintShopStoreAdmin | query | `getFaqCategory` | `faqcat_id: Int`, `limit: Int`, `offset: Int`, `status: Int` | 6 |
| onPrintShopInventory | query | `getMasterOptionCombinationMatrix` | `option_ids: [Int!]!` | 3 |
| onPrintShopProductBuilder | query | `getMasterOptionRange` | `limit: Int`, `offset: Int`, `option_id: Int`, `range_id: Int` | 6 |
| onPrintShopInventory | query | `getMasterOptionStockConfigs` | `config_id: Int`, `limit: Int`, `offset: Int`, `optionFilter: [Int]` | 25 |
| onPrintShopInventory | query | `getMasterOptionStockHistory` | `config_id: Int`, `limit: Int`, `offset: Int` | 8 |
| onPrintShopProductBuilder | query | `getMasterOptionTag` | `limit: Int`, `master_option_tag_id: Int`, `offset: Int` | 4 |
| onPrintShopProductBuilder | query | `getOptionGroup` | `limit: Int`, `offset: Int`, `prod_add_opt_group_id: Int`, `use_for: String` | 9 |
| onPrintShopStoreAdmin | query | `getPaymentTermMaster` | `limit: Int`, `offset: Int`, `status: Int`, `term_id: Int` | 9 |
| onPrintShopProducts | query | `getProductSkuMatrix` | `prod_add_opt_ids: String`, `products_id: Int!` | 4 |
| onPrintShopOrders | query | `getQuote` | `limit: Int`, `offset: Int`, `quote_id: Int`, `user_id: Int` | 31 |
| onPrintShopStoreAdmin | query | `getStore` | `corporate_id: Int`, `email: String`, `limit: Int`, `offset: Int`, `status: Int` | 41 |
| onPrintShopStoreAdmin | query | `getStoreLocations` | `limit: Int`, `location_id_code: String`, `offset: Int`, `status: String`, `store_location_id: Int` | 55 |
| onPrintShopStoreAdmin | query | `getStoreMarkup` | `corporate_id: Int`, `corporate_markup_id: Int`, `limit: Int`, `offset: Int`, `status: Int` | 10 |
| onPrintShopCustomers | query | `getUserBasket` | `basket_id: Int`, `limit: Int`, `offset: Int`, `user_id: Int!` | 12 |
| onPrintShopOrders | query | `orderBillingDetails` | `limit: Int`, `offset: Int`, `orders_id: Int` | 15 |
| onPrintShopOrders | query | `orderBlindDetails` | `limit: Int`, `offset: Int`, `orders_id: Int` | 14 |
| onPrintShopOrders | query | `orderDeliveryDetails` | `limit: Int`, `offset: Int`, `orders_id: Int` | 15 |
| onPrintShopOrders | query | `orderProducts` | `limit: Int`, `offset: Int`, `orders_id: Int`, `product_id: Int` | 42 |
| onPrintShopOrders | query | `orderShipmentDetails` | `limit: Int`, `offset: Int`, `orders_id: Int` | 7 |
| onPrintShopOrders | query | `orderStatus` | `limit: Int`, `offset: Int`, `process_status_id: Int` | 7 |
| onPrintShopOrders | query | `orderSummary` | `customer_reference: String`, `from_date: String`, `group_by: OrderSummaryGroupByEnum`, `limit: Int`, `offset: Int`, `order_status: String`, `orders_id: Int`, `to_date: String` | 191 |
| onPrintShopOrders | query | `orders` | `customer_email: String`, `customer_id: Int`, `from_date: String`, `limit: Int`, `offset: Int`, `order_product_status: Int`, `order_status: String`, `order_type: OrdersOrderTypeEnum`, `orders_id: Int`, `orders_products_id: Int`, `store_id: String`, `to_date: String` | 180 |
| onPrintShopProducts | query | `productAdditionalOptions` | `limit: Int`, `offset: Int`, `products_id: Int` | 19 |
| onPrintShopProducts | query | `productCategory` | `category_id: Int`, `limit: Int`, `offset: Int` | 19 |
| onPrintShopProducts | query | `productMasterOptions` | `limit: Int`, `master_option_id: Int`, `offset: Int` | 32 |
| onPrintShopProducts | query | `productOptionRules` | `limit: Int`, `offset: Int`, `rule_id: Int` | 13 |
| onPrintShopProducts | query | `productOptionsPrice` | `attr_id: Int`, `limit: Int`, `offset: Int` | 10 |
| onPrintShopProducts | query | `productPrice` | `limit: Int`, `offset: Int`, `product_uuid: String` | 10 |
| onPrintShopProducts | query | `productSize` | `limit: Int`, `offset: Int`, `products_id: Int`, `size_id: Int` | 23 |
| onPrintShopInventory | query | `productStocks` | `limit: Int`, `offset: Int`, `product_id: Int`, `type: StockTypeEnum!` | 12 |
| onPrintShopProducts | query | `products` | `limit: Int`, `offset: Int`, `products_id: Int` | 7 |
| onPrintShopProducts | query | `productsAttributePrice` | `attribute_id: Int`, `attribute_price_id: Int`, `limit: Int`, `offset: Int`, `size_id: Int` | 9 |
| onPrintShopProducts | query | `productsDetails` | `all_store: Int`, `external_catalogue: Int`, `limit: Int`, `offset: Int`, `products_id: Int`, `status: Int` | 93 |
| onPrintShopProducts | query | `productsImageGallery` | `corporate_id: Int`, `limit: Int`, `offset: Int`, `products_id: Int`, `products_image_gallery_id: Int` | 14 |
| onPrintShopProducts | query | `quantityBasedAttributePrice` | `attribute_id: Int`, `limit: Int`, `offset: Int`, `price_id: Int` | 9 |
| onPrintShopOrders | query | `quoteproduct` | `limit: Int`, `offset: Int`, `products_id: Int`, `quote_id: Int`, `quote_products_id: Int` | 17 |
| onPrintShopOrders | query | `shipToMultipleAddress` | `limit: Int`, `offset: Int`, `order_id: Int` | 20 |
| onPrintShopStoreAdmin | query | `storeCreditSummary` | `from_date: String`, `limit: Int`, `offset: Int`, `storeid: Int`, `to_date: String`, `user_id: Int` | 16 |
| onPrintShopStoreAdmin | query | `storeaddress` | `corporate_address_id: Int`, `corporate_id: Int`, `department_id: Int`, `limit: Int`, `offset: Int` | 20 |
| onPrintShopCustomers | query | `validateCustomerToken` | `token: String` | 2 |
| onPrintShopInventory | mutation | `addMasterOptionStockConfig` | `input: AddMasterOptionStockConfigInput!` | 4 |
| onPrintShopInventory | mutation | `deleteMasterOptionStockConfig` | `config_id: Int`, `option_ids: String` | 4 |
| onPrintShopOrders | mutation | `modifyOrderProduct` | `input: ModifyOrderProductInput!`, `orderid: Int!` | 4 |
| onPrintShopCustomers | mutation | `notifyUser` | `cust_id: Int`, `input: UserNotifyInput!`, `usertype: UserNotifyTypeEnum!` | 3 |
| onPrintShopProductBuilder | mutation | `setAdditionalOption` | `inputs: [AdditionalOptionInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setAdditionalOptionAttributes` | `inputs: [AdditionalOptionAttributesInput!]!` | 4 |
| onPrintShopStoreAdmin | mutation | `setAdminExtraField` | `inputs: [AdminExtraFieldInput!]!` | 4 |
| onPrintShopStoreAdmin | mutation | `setAdminExtraFieldValues` | `inputs: [AdminExtraFieldValueInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setAssignOptions` | `inputs: [AssignOptionsInput!]!` | 4 |
| onPrintShopOrders | mutation | `setBatch` | `batch_id: Int`, `input: SetBatchMasterInput!` | 5 |
| onPrintShopOrders | mutation | `setBatchJob` | `input: SetBatchJobMasterInput!`, `order_product_id: Int`, `pagename: String`, `pagename_rear: String` | 2 |
| onPrintShopProductBuilder | mutation | `setCustomFormula` | `input: CustomFormulaInput!` | 3 |
| onPrintShopCustomers | mutation | `setCustomer` | `customer_id: Int`, `input: SetCustomerInput!` | 4 |
| onPrintShopCustomers | mutation | `setCustomerAddressDetail` | `input: CustomerAddressInput!` | 3 |
| onPrintShopStoreAdmin | mutation | `setDepartment` | `input: DepartmentInput!` | 3 |
| onPrintShopStoreAdmin | mutation | `setFaq` | `input: FaqInput!` | 3 |
| onPrintShopStoreAdmin | mutation | `setFaqCategory` | `input: FaqCategoryInput!` | 3 |
| onPrintShopProductBuilder | mutation | `setMasterOption` | `inputs: [MasterOptionInput!]!` | 5 |
| onPrintShopProductBuilder | mutation | `setMasterOptionAttributePrice` | `inputs: [MasterOptionAttributePriceInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setMasterOptionAttributes` | `inputs: [MasterOptionAttributesInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setMasterOptionRange` | `input: MasterOptionRangeInput!` | 3 |
| onPrintShopInventory | mutation | `setMasterOptionStockSettings` | `inputs: [SetMasterOptionStockSettingsInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setMasterOptionTag` | `input: MasterOptionTagInput!` | 3 |
| onPrintShopProductBuilder | mutation | `setOptionGroup` | `input: OptionGroupInput!` | 3 |
| onPrintShopOrders | mutation | `setOrder` | `admin_extra_fields: JSON`, `input: SetOrderInput!`, `order_id: Int`, `order_product_status: Int`, `order_title: String!`, `selected_shipping_type: Int`, `userid: Int!` | 3 |
| onPrintShopOrders | mutation | `setOrderProduct` | `height: Float`, `input: SetOrderProductInput!`, `order_product_id: Int`, `width: Float` | 3 |
| onPrintShopOrders | mutation | `setOrderProductImage` | `add_version_file_only: Int`, `ask_for_approval: Int`, `input: SetOrderProductImageInput!`, `order_product_id: Int`, `update_ziflow_link_only: Int` | 3 |
| onPrintShopOrders | mutation | `setOrderProductImageFromUrl` | `add_version_file_only: Int`, `ask_for_approval: Int`, `input: SetOrderProductImageFromUrlInput!`, `order_product_id: Int`, `update_ziflow_link_only: Int` | 3 |
| onPrintShopProductBuilder | mutation | `setProduct` | `inputs: [ProductInput!]!` | 14 |
| onPrintShopProductBuilder | mutation | `setProductCategory` | `inputs: [ProductCategoryInput!]!` | 5 |
| onPrintShopOrders | mutation | `setProductDesign` | `order_product_id: Int`, `ziflow_link: String`, `ziflow_preflight_link: String` | 3 |
| onPrintShopProductBuilder | mutation | `setProductOptionRules` | `input: ProductOptionRulesInput!` | 3 |
| onPrintShopProductBuilder | mutation | `setProductPages` | `inputs: [ProductPagesInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setProductPrice` | `inputs: [ProductPriceInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setProductSize` | `inputs: [ProductSizeInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setProductSku` | `inputs: [ProductSkuInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setProductsAttributePrice` | `inputs: [ProductsAttributePriceInput!]!` | 4 |
| onPrintShopProductBuilder | mutation | `setProductsImageGallery` | `input: ProductsImageGalleryBulkInput!`, `optimizeimg: Int`, `products_id: Int!` | 4 |
| onPrintShopProductBuilder | mutation | `setQuantityBasedAttributePrice` | `inputs: [QuantityBasedAttributePriceInput!]!` | 4 |
| onPrintShopOrders | mutation | `setQuote` | `admin_extra_fields: JSON`, `input: SetQuoteInput`, `order_product_status: Int`, `quote_id: Int`, `quote_title: String`, `selected_shipping_type: String`, `userid: Int!` | 3 |
| onPrintShopOrders | mutation | `setShipment` | `order_id: Int`, `shipment_id: Int`, `shipmentinfo: JSON`, `tracking_number: String` | 3 |
| onPrintShopStoreAdmin | mutation | `setStore` | `input: StoreInput!` | 3 |
| onPrintShopStoreAdmin | mutation | `setStoreAddress` | `input: StoreAddressInput!` | 3 |
| onPrintShopStoreAdmin | mutation | `setStoreLocation` | `inputs: [StoreLocationInput!]!` | 4 |
| onPrintShopStoreAdmin | mutation | `setStoreMarkup` | `input: StoreMarkupInput!` | 3 |
| onPrintShopCustomers | mutation | `setUserBasket` | `action: String!`, `input: SetUserBasketInput`, `item_index: Int`, `user_id: Int!` | 3 |
| onPrintShopInventory | mutation | `updateMasterOptionStock` | `inputs: [UpdateMasterOptionStockInput!]!` | 4 |
| onPrintShopOrders | mutation | `updateOrderStatus` | `input: UpdateOrderStatusInput!`, `orders_id: Int`, `orders_products_id: Int`, `type: OrderStatusUpdateTypeEnum!` | 3 |
| onPrintShopInventory | mutation | `updateProductStock` | `input: UpdateProductStockInput!`, `product_sku: String`, `type: UpdateStockTypeEnum` | 5 |

## Previously uncovered roots

`adminExtraFieldValues`, `attributes`, `authenticateCustomer`, `orderBillingDetails`, `orderBlindDetails`, `orderDeliveryDetails`, `orderProducts`, `orderSummary`, `productSize`, `validateCustomerToken`, `setAdminExtraFieldValues`, and `setBatchJob` now have structured controls in their owning domain nodes.
