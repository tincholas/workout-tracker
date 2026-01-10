import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Increment patch version
const versionParts = packageJson.version.split('.').map(Number);
versionParts[2]++;
const newVersion = versionParts.join('.');

packageJson.version = newVersion;

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`Updated version to ${newVersion}`);

// Optional: You could allow vite.config.js to just read package.json,
// but if we want to ensure the date is "build time", we can pass it via env or define.
// We'll rely on vite.config.js reading the updated package.json.
