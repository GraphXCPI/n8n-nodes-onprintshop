#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
buildSync({
  entryPoints: [path.join(root, 'nodes/OnPrintShopGraphqlSyntax.ts')],
  outfile: path.join(root, 'dist/nodes/OnPrintShopGraphqlSyntax.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  legalComments: 'inline',
});
fs.copyFileSync(require.resolve('graphql/LICENSE'), path.join(root, 'dist/nodes/GRAPHQL-LICENSE.txt'));
