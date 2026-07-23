# OnPrintShop n8n Node Operator Guide

This guide explains how to choose and configure the OnPrintShop n8n nodes. It is written for workflow builders, not as a raw OnPrintShop GraphQL schema reference.

## Which Node To Use

Use the focused domain nodes for new workflows:

| Node | Use For |
| --- | --- |
| OnPrintShop Products | Product reads, category reads, pricing reads, FAQ reads, SKU matrix reads |
| OnPrintShop Product Builder | Product, category, size, page, price, SKU, and additional-option setup |
| OnPrintShop Master Options | Master options, attributes, prices, ranges, tags, groups, formulas, rules, matrices, and stock |
| OnPrintShop Inventory | Product stock reads/writes |
| OnPrintShop Orders | Orders, order products, shipments, batches, quotes, and statuses |
| OnPrintShop Customers | Customers and customer addresses |
| OnPrintShop Store Admin | Stores, departments, countries, FAQs, markups, payment terms, and reference data |
| OnPrintShop GraphQL | Approved custom or future GraphQL calls outside the mapped collection |
| OnPrintShop | Legacy all-in-one compatibility node for saved workflows |

The legacy all-in-one node remains available so existing workflows keep loading. Every operation in the current published collection has a typed domain action; do not build new workflows against the legacy node.

## Credentials

Create an **OnPrintShop API** credential before building workflows.

Required credential fields:

| Field | Description |
| --- | --- |
| Client ID | OAuth client ID from OnPrintShop |
| Client Secret | OAuth client secret from OnPrintShop |
| Base URL | OnPrintShop tenant/API base URL used for GraphQL requests |
| Token URL | OAuth token URL used to obtain bearer tokens |

After saving the credential, click **Test** in n8n. The credential test requests an OAuth token using `client_credentials`. A passing test confirms that n8n can reach the token endpoint and that the client credentials are accepted.

## Read Actions

Read actions do not change OnPrintShop data. They are safe for lookup, validation, scheduled syncs, and preflight checks.

For product reads:

- Use `Get Simple` or `Get Many Simple` when you only need IDs, names, SKU, or stock flags.
- Use `Get Detailed` for one product when you need catalog, SEO, category, page, size, or additional-option fields.
- Use `Get Many Detailed` carefully. Nested size and option fields can make responses large.
- Remove field groups you do not need. This keeps workflow data easier to inspect and reduces API load.

For order reads:

- Use `Order` for order header data.
- Use `Order Details` when downstream routing needs expanded order data.
- Use `Order Products` for proof, design, production status, or line-item automation.

For inventory reads:

- Use product stock reads when you know the product ID or SKU.
- Use `Product Stocks` for broader stock audits.
- Use `OnPrintShop Master Options > Stock > Get Configurations` before history, settings, or stock write actions.
- Use matrix actions before creating SKU or master-option stock mappings.

## Field Selection

Field groups use a mode control plus a multi-select:

| Mode | Behavior |
| --- | --- |
| `Custom Selection` | Show the field checklist and send only checked fields. |
| `All Fields` | Hide the checklist and send every available field for that group. |
| `No Fields` | Hide the checklist and send no fields for that group. Use this mainly for optional nested groups such as sizes, addresses, shipments, or additional options. |

This replaces the old fake `Select All Fields` and `Deselect All Fields` rows inside the multi-select. Existing workflows keep their saved custom field lists, and any old sentinel values are ignored at execution time.

## Write Actions

Write actions change OnPrintShop data. Keep them isolated, named clearly, and fed by validated upstream data.

General rules:

- Use explicit IDs from prior read actions whenever possible.
- Keep JSON input arrays small and auditable.
- Include only fields the workflow owns.
- Do not reuse broad catalog write nodes inside unrelated order/status workflows.
- For production status, proof, shipment, inventory, and pricing writes, add upstream approval or dry-run logic where appropriate.

The API contract contains 16 batch mutations. Their inputs are exposed as `JSON Object Array` fields in the focused nodes:

- Product Builder: products, product prices, sizes, pages, categories, SKUs, additional options, additional-option attributes, additional-option prices, quantity-based attribute prices, and option assignments.
- Master Options: master options, master-option attributes, master-option attribute prices, stock changes, and stock settings.

For Master Options writes, choose `JSON Object Array` under `Input Mode` to send many objects in one request. The field accepts a literal JSON array or an expression that resolves to an array. `Form Fields` remains the default, so saved workflows continue using their existing repeatable form rows.

`npm run verify:api-contract` discovers every Postman mutation declared with `$inputs: [Type!]!` and fails unless the node declares and consumes a matching JSON-array parameter. This keeps future contract updates from silently adding unsupported batch mutations.

Common write patterns:

| Need | Recommended Sequence |
| --- | --- |
| Update product content | Get Detailed -> validate current state -> Set Product |
| Update product pages | Get Detailed -> validate page IDs/sort order -> Set Product Pages |
| Create product SKUs | Get Detailed -> Get SKU Matrix -> Set Product SKU |
| Update product stock | Get Stock -> validate identifier and quantity -> Update Stock |
| Update master-option stock | Get Configs -> optional Get History -> Update Stock |
| Create master-option stock config | Get Combination Matrix -> Add Stock Config |
| Update order product proof/status | Order Product Get -> proof/status validation -> Set Design or Update Status |

## Raw GraphQL Fallback

Use raw GraphQL only when:

- The API operation is approved and current.
- The call is outside the currently mapped Postman collection.
- The workflow is temporary, exploratory, or waiting for node promotion.

Raw GraphQL does not count as API contract coverage. Add any newly published operation as a typed domain action before accepting an API update.

Raw OnPrintShop reference: https://documenter.getpostman.com/view/33263100/2sBXijHWys#intro

The published OPS documentation is the human reference for operation intent, parameter meaning, examples, and response behavior. The redacted, versioned snapshot at `contracts/OnPrintShop GraphQL API.postman_collection.json` is the machine contract used by `npm run verify:api-contract` to prove node coverage. Refresh it whenever OPS publishes a new collection:

```bash
npm run contract:update -- --source="/absolute/path/to/OnPrintShop.collection.json"
npm run verify:api-contract
```

The refresh command removes saved API responses and sanitizes credential and personal example values before writing the repository snapshot.

Operational limits documented by OnPrintShop:

- The API allows 120 requests per rolling minute. Pace large n8n loops and retries accordingly.
- List operations use limit/offset pagination and return at most 250 records per request.
- Calls made with valid credentials affect live account data. Test writes only in an approved demo or staging tenant.

## Icons

The node icon is packaged with the node:

```ts
icon: {
	light: 'file:onprintshop-light.svg',
	dark: 'file:onprintshop-dark.svg',
}
```

The npm package includes:

```text
dist/nodes/<NodeName>/onprintshop-light.svg
dist/nodes/<NodeName>/onprintshop-dark.svg
dist/credentials/onprintshop-light.svg
dist/credentials/onprintshop-dark.svg
```

n8n serves packaged icon files through its own `/icons/...` route at runtime so the browser can render them. That route should be on the same n8n instance where the package is installed; it is not a dependency on the GraphX devserver.

If icons are broken on an instance:

1. Confirm the installed package contains the themed SVG files above.
2. Restart every n8n process that loads community nodes.
3. Hard-refresh the browser.
4. Check the instance-local icon route:

```bash
curl -I https://<n8n-host>/icons/n8n-nodes-onprintshop/dist/nodes/OnPrintShop/onprintshop-light.svg
```

If the route returns `404`, the package install is stale or incomplete. Reinstall the current package version.

## API Mapping

The full API-to-domain-node map lives in `docs/API_DOMAIN_NODE_MAPPING.md`. Regenerate it after refreshing the Postman collection:

```bash
npm run build
npm run docs:api-map
```

The map is the audit surface for coverage. This guide is the operator surface for workflow builders.
