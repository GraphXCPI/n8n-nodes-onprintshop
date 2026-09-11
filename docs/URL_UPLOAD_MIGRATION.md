# OnPrintShop URL Upload Migration

Date: 2026-09-11. Package release: 1.2.9. Installation in n8n is a separate step.

## Evidence and Scope

Compared the supplied API_CHANGES.md and updated Postman collection with the
previous package contract, then performed authenticated read-only introspection.
The current live schema has 52 queries, 49 mutations, and 55 input types. Relative
to the previous snapshot there are no removed fields or changed existing types;
the changes are additive. The collection has 93 named operations (previously 92).
The collection is not an exhaustive listing of every schema field.

Schema SHA-256: `887fc38784687c8aa06007204b4d8d0725c15bba3fc15e707603f3fbd6d92027`.
Validate capabilities against the actual credential/environment before migration;
collection titles, including "Staging", are not rollout evidence.

Environment note: the operator reports both environments support the changes.
Two read-only checks through the existing n8n credential binding labelled
"VG Staging" still returned the older schema; the "VG Live" binding returned
the new fields. This discrepancy may be credential routing or rollout state;
it is not proof the operator's staging endpoint lacks the feature. Verify the
exact binding used by each automation rather than globally blocking staging.

## Important Behavior

This replaces the **pre-upload requirement**, not the need for a reachable file.
OnPrintShop fetches the URL server-side. The node does not download the asset,
upload to S3, or forward n8n binary data. Existing filename inputs remain valid.

The collection documents upfront file type/size/content-type validation followed
by background processing. A successful response is **not proof the asset has
finished downloading or rendering**. Gallery rows can return an ID before images
and thumbnails finish. For order files, `result` reports whether the job queued.
Failed downloads may leave empty page entries; inspect completion before retrying.
No job-status endpoint or numeric file-size limits were provided in this update.

## Field Mapping

All new typed image fields below are optional `String` values. Batch `inputs`
remain arrays; each row retains its own record identifier and image URL.

| Mutation | Input path | Existing filename field | Node action |
| --- | --- | --- | --- |
| `setProductCategory` | `inputs[].category_image_url` | `category_image` | Product Builder / mutation / setProductCategory |
| `setProductCategory` | `inputs[].category_icon_url` | `category_icon` | Same |
| `setProductSize` | `inputs[].size_image_url` | `size_image` | Product Builder / mutation / setProductSize |
| `setProductsImageGallery` | `input.image_arr[].image_url` | `products_large_image_name` | Product Builder / mutation / setProductImage |
| `setStoreLocation` | `inputs[].site_logo_url` | `site_logo` | Store Admin / storeLocation / set |
| `setMasterOptionAttributes` | `inputs[].attributes_image_url` | `attributes_image` | Master Options / attribute / set |
| `setAdditionalOptionAttributes` | `inputs[].attributes_image_url` | `attributes_image` | Product Builder / mutation / setAdditionalOptionAttributes |
| `setProduct` | `inputs[].image_url` | `imagename` | Product Builder / mutation / setProduct |
| `setProduct` | `inputs[].product_desc_image_url` | `product_desc_image` | Same |

The two `setProduct` fields were discovered through live introspection, not the
seven-row change log. Their presence/type is confirmed; detailed processing
semantics were not supplied. Test these separately before migrating production.

Gallery `input.image_arr[].product_desc_image_type` is a String, not a GraphQL
enum: `"0"` none, `"1"` small image, `"2"` large/description image, `"3"` both.
The node exposes this as a dropdown. This assignment can change the main product
image, so do not default existing automations to `"3"`.

For size/gallery the collection explicitly permits a filename alongside the URL
as the base name; for attributes/store logos it permits omitting the filename
and deriving it from the URL. Prefer URL-only unless a stable base name is needed.
Category filename/URL precedence is not documented; do not assume it.

## Node UI and Saved Parameters

Node type prefix: `n8n-nodes-onprintshop.`. Exact domain names:
`onPrintShopProductBuilder`, `onPrintShopMasterOptions`,
`onPrintShopStoreAdmin`, `onPrintShopOrders`.

Product Builder actions listed above now offer Input Mode = Fields or JSON Array.
For action `OP`, saved keys are `OP_inputMode` (`fields` or `json`),
`OP_entries.entry[].fields` (named fields), and the unchanged `OP_input` (JSON).
Example: `setProductSize_entries.entry[0].fields.size_image_url`.
The legacy default remains JSON; existing workflows do not switch modes.
Only explicitly selected form fields are sent, avoiding implicit zero/empty
updates to unrelated properties. IDs and other create/update requirements still
apply. Fields and JSON expressions both support multiple objects.

Gallery JSON retains its wrapper: `{"image_arr":[...]}`, not a bare array.
Master Options retains its existing Fields/JSON modes and adds Image URL to each
attribute row. Store Locations retains its modes and adds Site Logo URL.
Legacy node identifiers, operations, credentials, and filename payloads remain.

## Order Files: New Action

Use Orders / mutation / `setOrderProductImageFromUrl`, displayed as
"Upload Order Product Files From URLs". Do not just add `file_url` to the old
`setOrderProductImage` request.

```graphql
mutation Upload($order_product_id: Int, $input: SetOrderProductImageFromUrlInput!) {
  setOrderProductImageFromUrl(order_product_id: $order_product_id, input: $input) {
    result message id
  }
}
```

```json
{
  "order_product_id": 123,
  "input": {
    "imagefiles": [
      {"pagename": "Front", "file_url": "https://example.com/front.pdf"},
      {"pagename": "Back", "file_url": "https://example.com/back.pdf"}
    ]
  }
}
```

The input's `imagefiles` is a JSON scalar: GraphQL introspection alone cannot
validate its nested shape. The collection requires `pagename` and `file_url`;
optional `ziflow_link` and `ziflow_preflight_link` are retained. OnPrintShop
generates thumb/large previews; clients no longer need three image filenames.
Preserve actual page names; do not assume every product uses Front/Back.

Saved node keys: `urlUploadOrderProductId`, `urlUploadInputMode` (`fields` or
`json`), `urlUploadFiles.file[]`, `urlUploadJson` (object containing imagefiles),
and `urlUploadOptions`. Files can also be provided as an expression object.

Introspection additionally exposes optional Int arguments `add_version_file_only`,
`ask_for_approval`, and `update_ziflow_link_only`; these are available under
Options and omitted unless selected. Preserve existing workflow intent and
verify behavior on a test order before using them. Old proof/version actions
are unchanged. The new UI requires a positive order-product ID.

## Other API Discovery

Live introspection adds `setBatchJob(input: SetBatchJobMasterInput!,
order_product_id: Int, pagename: String, pagename_rear: String)`.
Input: optional `extra_json_info: String`; result: `result: Boolean!`,
`message: String!`. This is not in the supplied collection/change log and is
not an upload migration target. It is available through Raw GraphQL; no dedicated
action or business semantics are asserted in this change.

No existing query signature or response field changed in this schema comparison.
Do not rewrite customer/order retrieval, authentication, pagination, or stock
workflows as part of the URL migration.

## Automation Migration Checklist

1. Inventory only workflows that upload these assets. Record node IDs, resource,
   operation, source URL, target record ID, filename mapping, and approval flags.
2. Verify the target schema has the relevant input field/mutation. Clone the
   workflow inactive; keep the old S3/filename branch as a rollback path.
3. Use the original source URL directly when it is stable and server-accessible.
   Local paths, `localhost`, n8n binary property names, session-only links, and
   login pages are not downloadable file URLs. Use HTTPS and least-privilege links.
4. If using signed URLs, allow for queue delay, download time, and bounded retries.
   There is no documented maximum queue time. Do not expire or delete the source
   immediately after mutation success. A successful local HEAD request alone does
   not prove OPS can fetch the file.
5. Map URL fields per the table. Preserve IDs, batch wrappers, external references,
   and required non-image fields. Do not rename every `*_image` field globally.
6. Check GraphQL errors AND each returned `result`; batch results include `index`.
   Record returned IDs. Read back/render the resulting asset with bounded polling
   before declaring completion. Do not treat a queued response as final success.
7. Retry only failed records/pages after checking current state. Avoid replaying
   creates or proof/version additions blindly; no idempotency-key contract was
   supplied. Keep batch sizes and concurrency bounded to existing API limits.
8. Test invalid/expired URL, unsupported file, partial batch failure, multiple pages,
   and original filename fallback on authorized test records. Validate image and
   proof/approval behavior before removing S3 steps from the production path.
9. Keep signed query strings, tokens, customer URLs, and files out of shared logs
   and agent handoffs. OPS may log failed URLs; account for upstream retention.
10. Obtain production approval, enable one migrated path, verify actual assets,
    then migrate the remainder. Retain a rollback export and outcome receipt.

## Before / After: Product Size

```json
[{"size_id":123,"size_image":"previous-upload.png"}]
```

```json
[{"size_id":123,"size_image_url":"https://example.com/size.png"}]
```

In Fields mode select Size ID and Size Image URL. Do not populate other defaults
unless the automation intends to change them. When the source exists only as n8n
binary data, it still needs accessible hosting; this API does not eliminate that
case's storage requirement.

## Verification Receipt

- Build and n8n node CLI lint/build pass.
- 93/93 collection operations mapped; 277/277 exposed action paths validate
  against the current live SDL in both default and all-fields mock audits.
- URL tests cover six legacy form/JSON paths, dedicated master attribute and
  store location form batches, new order-file forms/JSON, and invalid inputs.
- Existing customer, store pagination, stock, batch, token-cache, and admin-field
  regression tests pass. npm audit reports zero vulnerabilities.
- No production upload mutation was executed, and no package was published or
  installed during this work. Background completion and file validation still
  require an authorized test upload before production workflow migration.
