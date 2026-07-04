# OnPrintShop n8n Node Customer Install Guide

This package adds OnPrintShop GraphQL actions to n8n through the `n8n-nodes-onprintshop` community node package.

## Requirements

- n8n self-hosted or n8n Cloud with community nodes enabled
- OnPrintShop API client credentials
- Network access from n8n to the OnPrintShop base URL and token URL

Do not place client secrets in workflow JSON, notes, screenshots, or support tickets. Store them only in n8n credentials.

## Install From the n8n UI

Use this path for normal self-hosted n8n instances that support community-node installation from the editor.

1. Open n8n.
2. Go to **Settings > Community Nodes**.
3. Select **Install a community node**.
4. Enter:

```text
n8n-nodes-onprintshop
```

5. Confirm the community-node risk notice.
6. Install the package.
7. Restart n8n if your instance does not restart node loading automatically.

To install a specific version:

```text
n8n-nodes-onprintshop@1.1.0
```

## Manual Install for Self-Hosted n8n

Use this path for queue mode, Docker installs without UI package management, or locked-down instances.

```bash
docker exec -it <n8n-container> sh
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-onprintshop@1.1.0
exit
docker restart <n8n-container>
```

If your n8n deployment has separate main, webhook, and worker containers, install the package where the node volume is shared and restart every container that loads nodes.

## Docker Image Install

For production Docker deployments, the most repeatable option is to bake the package into the n8n image:

```Dockerfile
FROM n8nio/n8n:latest

USER root
RUN mkdir -p /home/node/.n8n/nodes \
	&& cd /home/node/.n8n/nodes \
	&& npm install n8n-nodes-onprintshop@1.1.0 \
	&& chown -R node:node /home/node/.n8n
USER node
```

Build and deploy this image using your normal n8n deployment process.

## Credentials

Create an **OnPrintShop API** credential in n8n.

Required fields:

| Field | Description |
| --- | --- |
| Client ID | OAuth client ID from OnPrintShop |
| Client Secret | OAuth client secret from OnPrintShop |
| Base URL | OnPrintShop tenant/API base URL |
| Token URL | OAuth token URL |

After saving, click **Test**. The credential test requests an OAuth token using `client_credentials`. A passing test confirms that n8n can reach the token endpoint and that the client credentials are accepted.

## Which Node To Use

Use focused domain nodes for new workflows:

| Node | Use For |
| --- | --- |
| OnPrintShop Products | Product, category, pricing, FAQ, and SKU matrix reads |
| OnPrintShop Product Builder | Product, category, size, page, price, SKU, option, and master-option writes |
| OnPrintShop Inventory | Product stock and master-option stock reads/writes |
| OnPrintShop Orders | Orders, order products, shipments, batches, quotes, and statuses |
| OnPrintShop Customers | Customers and customer addresses |
| OnPrintShop Store Admin | Stores, departments, countries, FAQs, markups, payment terms, and reference data |
| OnPrintShop GraphQL | Approved raw GraphQL fallback |

The older **OnPrintShop** all-in-one node remains available for saved workflow compatibility.

## Safe Workflow Pattern

For write workflows:

1. Read the current OnPrintShop record first.
2. Validate the target IDs and state.
3. Build the write input intentionally.
4. Execute the write node.
5. Read the record again if downstream logic depends on the result.

Inventory, shipment, proof, status, pricing, and catalog write actions should be isolated in clearly named workflows with appropriate approval or dry-run logic.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Node does not appear | Restart n8n and confirm the package is installed under the n8n user folder. |
| Icon is broken | Confirm the installed package contains `dist/nodes/OnPrintShop/onprintshop-light.svg` and restart n8n. |
| Credential test fails | Check Client ID, Client Secret, Token URL, and outbound network access from n8n. |
| API calls fail after credential test passes | Check Base URL and tenant-level API permissions. |
| Community-node install is blocked | Use the manual or Docker install path and confirm your n8n policy allows community nodes. |

## Support Information To Provide

When requesting support, include:

- n8n version
- `n8n-nodes-onprintshop` package version
- Node name and operation
- Sanitized error message
- Sanitized GraphQL variables shape, with all secrets and customer data removed

Do not include API secrets, bearer tokens, customer PII, or full workflow exports containing credentials.
