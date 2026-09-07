# API Conformance and Regression Gate

## Authority

The reference Postman collection documents intended requests. The checked-in,
description-free `contracts/ops-schema.graphql` records the authorized live
GraphQL contract observed on 2026-09-07. Both Live and Staging accepted schema
validation of the candidate's 275 generated action paths. Action paths include
legacy aliases; they are not 275 distinct API endpoints.

See `RUNTIME_API_MAPPING.md` for every tested node/resource/operation and its
actual API root, including an explicit list of roots without a structured action.
See `API_DOMAIN_NODE_MAPPING.md` for the separate Postman-to-domain mapping.

## Corrected Regressions

- Invalid category, option, rule, and pricing count fields now use current names.
- GraphQL aliases are applied to parsed fields/arguments, not arbitrary text.
  Nested product option fields and user string literals are not rewritten.
- Raw GraphQL documents and variables bypass structured-node normalization.
- Typed mutation inputs follow the schema: string flags and enum spelling are
  normalized without rewriting opaque JSON, losing false/zero/null, or changing
  caller objects. Unknown input fields are not silently discarded.
- Status, ship-to-multiple, address, markup, formula, payment-term, FAQ category,
  and quantity-price branches use current root and response field names.
- Product image gallery actions are selectable. Legacy aliases expose their
  required inputs. Batch and nested-list outputs are valid individual n8n items.

## Documented API Differences

- The Postman Quantity Based Attribute Price example uses the wrong query root.
  The corrected document is `contracts/quantity-based-attribute-price.graphql`.
  The live root is `quantityBasedAttributePrice`, with `price_id` and
  `attribute_id` filters. No records produces `DATA_NOT_FOUND` in observed tests.
  The previous Size ID control has been replaced with Price ID because Size ID
  is not an argument of this endpoint. Existing quantity-price workflows using
  that obsolete filter require review; the two IDs are not interchangeable.
- Ship-to-multiple needs an order ID at runtime, although the schema declares it
  nullable. The node validates a positive order ID before its data request.
- Customer date filters are `registration` and `login`. An old `MODIFIED`
  selection is not silently reinterpreted as a different date meaning.

## Repeating the Audit

1. Obtain an authorized introspection response using the existing credential
   binding. Never export credentials or commit customer execution payloads.
2. Run `node scripts/update-runtime-schema.js <introspection.json>` and review
   the SDL, input-type, and enum changes alongside the updated Postman collection.
3. Run `npm run verify:release`. The runtime gate executes every exposed action
   with synthetic UI inputs, validates its actual document and variables, then
   checks response handling using schema-shaped data with multiple list records.
4. Regenerate the full map:

   ```sh
   OPS_AUDIT_UI=1 OPS_AUDIT_ALL_FIELDS=1 OPS_AUDIT_RESPONSES=1 OPS_AUDIT_REPORT=/tmp/ops-synthetic-audit.json node scripts/audit-runtime-contract.js
   node scripts/generate-runtime-mapping.js /tmp/ops-synthetic-audit.json
   ```

5. Perform bounded read-only candidate smoke tests using the target n8n runtime.
   Test writes separately in an approved sandbox; schema validation cannot prove
   mutation business behavior. Preserve node types, operation values, credential
   names, and saved parameter names when making compatibility repairs.
6. Export and scan the public package. Publishing and installing are separate
   gates; neither a build nor an isolated smoke test changes production.

The parser is bundled at build time with its license. Customers do not need a
separate GraphQL runtime dependency. The schema and input maps contain no tenant
hostnames, credentials, or data records.
