const { config } = await import(process.env.N8N_NODE_CLI_ESLINT_CONFIG ?? '@n8n/node-cli/eslint');

export default config;
