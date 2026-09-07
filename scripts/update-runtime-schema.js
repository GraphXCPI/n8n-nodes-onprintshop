#!/usr/bin/env node
// Input is an authorized introspection response, never a credential export.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const g = require('graphql');
const root = path.resolve(__dirname, '..');
if (!process.argv[2]) throw new Error('Usage: node scripts/update-runtime-schema.js <introspection.json>');
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const schema = g.buildClientSchema(input.data || input);
const document = g.visit(g.parse(g.printSchema(g.lexicographicSortSchema(schema))), {
  StringValue(node, key) { if (key === 'description') return null; },
});
const sdl = g.print(document) + '\n';
const inputs = {}, enums = {};
for (const type of Object.values(schema.getTypeMap()).sort((a,b) => a.name.localeCompare(b.name))) {
  if (g.isInputObjectType(type)) inputs[type.name] = Object.fromEntries(Object.entries(type.getFields()).sort(([a],[b]) => a.localeCompare(b)).map(([key, field]) => [key, String(field.type)]));
  if (g.isEnumType(type) && !type.name.startsWith('__')) enums[type.name] = type.getValues().map(value => value.name);
}
fs.writeFileSync(path.join(root, 'contracts/ops-schema.graphql'), sdl);
for (const [name, value] of [['Input',inputs],['Enum',enums]]) fs.writeFileSync(path.join(root, `nodes/OnPrintShop${name}Types.json`), JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify({sha256:crypto.createHash('sha256').update(sdl).digest('hex'), queries:Object.keys(schema.getQueryType().getFields()).length,mutations:Object.keys(schema.getMutationType().getFields()).length,inputTypes:Object.keys(inputs).length}));
