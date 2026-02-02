const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const rawgApiKey = process.env.RAWG_API_KEY || '';
const pocketbaseUrl = process.env.POCKETBASE_URL || '';

if (!rawgApiKey) {
  console.warn('WARNING: RAWG_API_KEY not found in environment variables!');
}
if (!pocketbaseUrl) {
  console.warn('WARNING: POCKETBASE_URL not found in environment variables!');
}

// Check for mode argument (default to dev/false if not specified)
const isProduction = process.argv[2] === 'prod';

// Define the content for the environment file
const envConfigFile = `export const environment = {
  production: ${isProduction},
  rawgApiKey: '${rawgApiKey}',
  pocketbaseUrl: '${pocketbaseUrl}'
};
`;

// Define the target path
const targetPath = path.join(__dirname, '../src/environments/environment.ts');
const environmentsDir = path.join(__dirname, '../src/environments');

// Create the environments directory if it doesn't exist
if (!fs.existsSync(environmentsDir)) {
  fs.mkdirSync(environmentsDir, { recursive: true });
}

// Write the file
fs.writeFileSync(targetPath, envConfigFile);

console.log(`Output generated at ${targetPath} (production: ${isProduction})`);
