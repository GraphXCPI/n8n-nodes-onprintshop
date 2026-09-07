#!/usr/bin/env node
// Consume only the synthetic audit report, never real execution payloads.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {parse, buildSchema} = require('graphql');
const root = path.resolve(__dirname, '..');
if (!process.argv[2]) throw new Error('Usage: node scripts/generate-runtime-mapping.js <synthetic-audit-report.json>');
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (report.failed || report.captured !== report.actions) throw new Error('Cannot document a failing or incomplete audit');
const sdl = fs.readFileSync(path.join(root,'contracts/ops-schema.graphql'),'utf8');
const schema = buildSchema(sdl);
const seen = new Set();
const rows = report.results.map(action => {
  const roots = new Set();
  for (const request of action.requests) {
    const operation = parse(request.query).definitions.find(d=>d.kind==='OperationDefinition');
    for (const field of operation.selectionSet.selections) roots.add(`${operation.operation}.${field.name.value}`);
  }
  for (const name of roots) seen.add(name);
  return `| ${action.node} | ${action.resource} | ${action.operation} | ${[...roots].join(', ')} | Pass |`;
});
const absent = [];
for (const [kind,type] of [['query',schema.getQueryType()],['mutation',schema.getMutationType()]]) {
  for (const name of Object.keys(type.getFields())) if(!seen.has(`${kind}.${name}`)) absent.push(`${kind}.${name}`);
}
const text = `# Runtime API Mapping

Generated from actual node executor requests, not action labels or Postman substring matches.
Schema snapshot: 2026-09-07; SHA-256: \`${crypto.createHash('sha256').update(sdl).digest('hex')}\`.

- ${report.actions} exposed structured action paths, including legacy aliases and domain nodes.
- ${seen.size} distinct root operations exercised by these action paths.
- Default and all-selectable-field queries, typed variables, required UI lookups, and schema-shaped responses are checked by the release gate.
- This is not proof of live mutation behavior, every optional input combination, pagination behavior, or tenant-specific permissions.
- Raw GraphQL is intentionally excluded from the generated-action audit; preservation of user documents and JSON is regression-tested separately.

## Root Coverage Gaps

The following schema roots do not have a separately exercised structured root action. Some data is available through nested selections; raw GraphQL remains available. This list must not be described as complete first-class UI coverage:

${absent.map(name=>`- \`${name}\``).join('\n')}

## Action Map

| Node | Resource | Stable Operation | Actual API Roots | Schema / UI / Response |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
fs.writeFileSync(path.join(root,'docs/RUNTIME_API_MAPPING.md'),text);
console.log(JSON.stringify({actions:report.actions,distinctRoots:seen.size,unmappedRoots:absent.length}));
