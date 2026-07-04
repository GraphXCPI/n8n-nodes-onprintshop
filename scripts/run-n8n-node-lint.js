#!/usr/bin/env node

const { execFileSync, spawnSync } = require('child_process');
const { _initPaths } = require('module');
const path = require('path');
const { pathToFileURL } = require('url');

function resolveN8nNodeBin() {
	const command = process.platform === 'win32' ? 'where' : 'which';
	const output = execFileSync(command, ['n8n-node'], { encoding: 'utf8' }).trim();
	const [firstMatch] = output.split(/\r?\n/).filter(Boolean);

	if (!firstMatch) {
		throw new Error('Unable to resolve n8n-node from PATH');
	}

	return firstMatch;
}

const n8nNodeBin = resolveN8nNodeBin();
const n8nNodeModules = path.resolve(path.dirname(n8nNodeBin), '..');

process.env.NODE_PATH = [n8nNodeModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
_initPaths();

const eslintConfigPath = require.resolve('@n8n/node-cli/eslint');
const lint = spawnSync(n8nNodeBin, ['lint'], {
	env: {
		...process.env,
		N8N_NODE_CLI_ESLINT_CONFIG: pathToFileURL(eslintConfigPath).href,
	},
	stdio: 'inherit',
});

if (lint.error) {
	throw lint.error;
}

process.exit(lint.status ?? 1);
