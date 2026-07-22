# n8n-nodes-onprintshop

Community node package for using the OnPrintShop GraphQL API from n8n.

This package provides focused OnPrintShop domain nodes, a legacy all-in-one compatibility node for existing workflows, and one OAuth credential type. It is intended for workflow builders who need product, order, customer, inventory, store-admin, and approved raw GraphQL access from n8n.

## Install

In n8n, open **Settings > Community Nodes**, choose **Install a community node**, and enter:

```text
n8n-nodes-onprintshop
```

To install a specific version:

```text
n8n-nodes-onprintshop@1.2.1
```

For Docker or queue-mode deployments, install the package into the shared n8n community-node folder and restart every process that loads nodes. See [CUSTOMER_INSTALL.md](CUSTOMER_INSTALL.md) for details.

## Nodes

| Node | Use For |
| --- | --- |
| OnPrintShop Products | Product reads, category reads, pricing reads, FAQ reads, SKU matrix reads |
| OnPrintShop Product Builder | Product, category, size, page, price, SKU, option, and master-option writes |
| OnPrintShop Inventory | Product stock and master-option stock reads/writes |
| OnPrintShop Orders | Orders, order products, shipments, batches, quotes, and statuses |
| OnPrintShop Customers | Customers and customer addresses |
| OnPrintShop Store Admin | Stores, departments, countries, FAQs, markups, payment terms, and reference data |
| OnPrintShop GraphQL | Approved raw GraphQL calls that have not been promoted into a first-class action |
| OnPrintShop | Legacy all-in-one compatibility node for saved workflows |

The focused domain nodes are recommended for new workflows. The older **OnPrintShop** all-in-one node remains registered so saved workflows continue to load.

## Credentials

Create an **OnPrintShop API** credential in n8n.

| Field | Description |
| --- | --- |
| Client ID | OAuth client ID from OnPrintShop |
| Client Secret | OAuth client secret from OnPrintShop |
| Base URL | OnPrintShop tenant/API base URL |
| Token URL | OAuth token URL |

The credential includes a built-in n8n credential test that requests an OAuth token using `client_credentials`.

## Documentation

- [Customer install guide](CUSTOMER_INSTALL.md)
- [Operator guide](docs/NODE_OPERATOR_GUIDE.md)
- [API to domain-node map](docs/API_DOMAIN_NODE_MAPPING.md)
- [OnPrintShop public API documentation](https://documenter.getpostman.com/view/33263100/2sBXijHWys#intro)

The API map is the coverage audit surface. It shows which OnPrintShop GraphQL operations have first-class node actions and which currently use the raw GraphQL fallback node.

## Development

```bash
npm ci
npm run build
npm run verify:release
npm run n8n-node:lint
```

The package uses the official n8n node tooling through `pnpm dlx @n8n/node-cli`, so `pnpm` must be available in development and CI.

## Release

This public repository is designed for npm Trusted Publishing through GitHub Actions OIDC. The release workflow does not require an npm token after the package owner configures a trusted publisher for:

```text
GraphXCPI/n8n-nodes-onprintshop
.github/workflows/release.yml
```

Create a GitHub release or dispatch the release workflow to publish the current package version to npm.

## Public Package Boundary

This public repository contains the customer-safe package source, operator documentation, and API coverage map. Internal deployment notes, private workflow inventories, local collection paths, credentials, and support artifacts are intentionally excluded from the public export.
