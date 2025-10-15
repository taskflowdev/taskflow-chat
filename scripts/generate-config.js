#!/usr/bin/env node

/**
 * Script to generate config.json from environment variables
 * 
 * This script reads environment variables and generates the public/config.json
 * file that will be served with the application. This allows runtime configuration
 * without rebuilding the app.
 * 
 * Environment variables (with defaults):
 * - API_URL: API base URL (default: https://localhost:44347)
 * - PRODUCTION: Production mode flag (default: false)
 * 
 * SECURITY NOTE: This config.json is publicly accessible. DO NOT include sensitive
 * values like encryption keys or API secrets here.
 * 
 * For local development, create a .env.local file with your configuration.
 * For production/Vercel, set these as environment variables in your deployment platform.
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if it exists (for local development)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local');
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

// Get environment variables with defaults
// SECURITY: Only include non-sensitive configuration values
// The encryption key is NOT included here as it would be publicly accessible
const config = {
  apiUrl: process.env.API_URL || 'https://localhost:44347',
  production: process.env.PRODUCTION === 'true' || process.env.NODE_ENV === 'production'
};

// Validate required fields
if (!config.apiUrl) {
  console.error('ERROR: API_URL environment variable is required');
  process.exit(1);
}

// Write config.json to public folder
const outputPath = path.join(__dirname, '..', 'public', 'config.json');
const outputDir = path.dirname(outputPath);

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the configuration file
fs.writeFileSync(
  outputPath,
  JSON.stringify(config, null, 2),
  'utf-8'
);

console.log('✅ Generated config.json successfully');
console.log('Configuration:');
console.log(`  - API URL: ${config.apiUrl}`);
console.log(`  - Production: ${config.production}`);
console.log(`  - Output: ${outputPath}`);
console.log('');
console.log('⚠️  SECURITY: config.json does NOT contain sensitive values like encryption keys.');
console.log('   Encryption key must be set at build time via ENCRYPTION_KEY environment variable.');
