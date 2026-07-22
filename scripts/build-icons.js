#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const nodeIconDirs = [
	'OnPrintShop',
	'OnPrintShopCustomers',
	'OnPrintShopGraphql',
	'OnPrintShopInventory',
	'OnPrintShopMasterOptions',
	'OnPrintShopOrders',
	'OnPrintShopProductBuilder',
	'OnPrintShopProducts',
	'OnPrintShopStoreAdmin',
];

function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(sourcePath, destinationPath) {
	ensureDir(path.dirname(destinationPath));
	fs.copyFileSync(sourcePath, destinationPath);
}

function copyOnPrintShopIcons() {
	const credentialDir = path.join(repoRoot, 'credentials');
	const iconFiles = fs
		.readdirSync(credentialDir)
		.filter((fileName) => /^onprintshop.*\.svg$/i.test(fileName));

	if (!iconFiles.length) {
		throw new Error(`No OnPrintShop SVG files found in ${credentialDir}`);
	}

	for (const fileName of iconFiles) {
		const sourcePath = path.join(credentialDir, fileName);
		copyFile(sourcePath, path.join(repoRoot, 'dist', 'credentials', fileName));

		for (const nodeDir of nodeIconDirs) {
			copyFile(sourcePath, path.join(repoRoot, 'dist', 'nodes', nodeDir, fileName));
		}
	}

	const legacyNodeIcon = path.join(repoRoot, 'nodes', 'onprintshop.svg');
	if (fs.existsSync(legacyNodeIcon)) {
		copyFile(legacyNodeIcon, path.join(repoRoot, 'dist', 'nodes', 'onprintshop.svg'));
	}
}

copyOnPrintShopIcons();
