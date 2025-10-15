#!/usr/bin/env node

/**
 * Script to generate build-config.ts from environment variables
 * 
 * This script replaces the ENCRYPTION_KEY placeholder in build-config.ts with
 * the actual value from the environment variable. This ensures the encryption
 * key is embedded at build time and never exposed in config.json.
 * 
 * SECURITY: The encryption key is embedded in the compiled JavaScript and
 * is not easily accessible via network inspection, unlike config.json values.
 * 
 * Environment variables:
 * - ENCRYPTION_KEY: Encryption key for local storage (default: taskflow-chat-secure-key-2024)
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if it exists (for local development)
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment variables from .env.local for build config');
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

// Get encryption key from environment variable
const encryptionKey = process.env.ENCRYPTION_KEY || 'taskflow-chat-secure-key-2024';

// Path to the build-config template and output
const buildConfigTemplatePath = path.join(__dirname, '..', 'src', 'app', 'core', 'config', 'build-config.template.ts');
const buildConfigPath = path.join(__dirname, '..', 'src', 'app', 'core', 'config', 'build-config.ts');

// Check if template exists
if (!fs.existsSync(buildConfigTemplatePath)) {
  console.error('ERROR: build-config.template.ts not found at:', buildConfigTemplatePath);
  process.exit(1);
}

// Read the template
let buildConfigContent = fs.readFileSync(buildConfigTemplatePath, 'utf-8');

// Replace the placeholder with the actual value
buildConfigContent = buildConfigContent.replace(
  'BUILD_TIME_ENCRYPTION_KEY_PLACEHOLDER',
  encryptionKey
);

// Update comment to indicate it's generated
buildConfigContent = buildConfigContent.replace(
  'Build-time configuration constants - TEMPLATE',
  'Build-time configuration constants - GENERATED'
);
buildConfigContent = buildConfigContent.replace(
  'This is a template file. The actual build-config.ts is generated at build time',
  'This file is auto-generated at build time'
);

// Write the generated file
fs.writeFileSync(buildConfigPath, buildConfigContent, 'utf-8');

console.log('✅ Generated build-config.ts successfully');
console.log(`  - Encryption Key: ${encryptionKey.substring(0, 10)}...`);
console.log('  - Output: ' + buildConfigPath);
console.log('');
console.log('⚠️  SECURITY: Encryption key is embedded at build time and NOT in config.json');
