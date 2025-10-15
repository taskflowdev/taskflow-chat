# Vercel Deployment Guide

This guide explains how to deploy the TaskFlow Chat application to Vercel with runtime configuration.

## Prerequisites

- A Vercel account
- Your repository connected to Vercel

## Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

### Required Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `API_URL` | Your backend API URL | `https://api.yourdomain.com` |
| `ENCRYPTION_KEY` | Encryption key for localStorage (build-time only) | Generate a secure random string |
| `PRODUCTION` | Production mode flag | `true` |

**IMPORTANT SECURITY NOTE:** The `ENCRYPTION_KEY` is embedded at build time and is NOT exposed in the publicly accessible `config.json` file. Only `API_URL` and `PRODUCTION` flag are included in the runtime config.

### How to Generate a Secure Encryption Key

Use one of these methods to generate a secure encryption key:

**Option 1: OpenSSL (recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
Use a trusted password generator to create a 32+ character random string.

## Deployment Configuration

### Build Settings

Vercel should auto-detect your Angular project. Verify these settings:

- **Framework Preset**: Angular
- **Build Command**: `npm run build`
- **Output Directory**: `dist/taskflow-chat/browser`
- **Install Command**: `npm install`

The `prebuild` script will automatically run before building, generating both the `config.json` file (with non-sensitive runtime config) and `build-config.ts` (with sensitive build-time values like encryption key) from your environment variables.

### SPA Routing Configuration

The `vercel.json` file in the repository root handles Single Page Application (SPA) routing by rewriting all routes to `/index.html`. This ensures that deep links (e.g., `/chats/group/:groupId`) work correctly when accessed directly or refreshed.

### Deploy

1. Push your code to your repository
2. Vercel will automatically deploy
3. The environment variables will be used to generate `config.json` during the build

## Verification

After deployment, verify the configuration:

1. Visit your deployed site
2. Open browser DevTools Console
3. The app should load without configuration errors
4. Check the Network tab - you should see a successful request to `/config.json`

## Troubleshooting

### Config not found

If you see "Failed to load configuration":
1. Check that your environment variables are set in Vercel
2. Verify the build logs show successful config generation
3. Ensure all required variables are present

### API connection issues

If the app can't connect to your API:
1. Verify the `API_URL` environment variable is correct
2. Check CORS settings on your API server
3. Ensure your API is accessible from Vercel's deployment regions

### Build failures

If the build fails:
1. Check the Vercel build logs for error messages
2. Verify all environment variables are set
3. Test the build locally with the same environment variables

## Environment-Specific Configurations

You can set different values for different environments:

1. **Production**: Set in the Production environment variables
2. **Preview**: Set in the Preview environment variables  
3. **Development**: Set in the Development environment variables

## Updating Configuration

To update configuration values:

1. Go to Vercel dashboard → Settings → Environment Variables
2. Update the values
3. Redeploy your application (Vercel will automatically redeploy on new commits, or you can trigger a manual redeploy)

## Security Best Practices

✅ **DO:**
- Use strong, randomly generated encryption keys
- Set different encryption keys for each environment
- Use HTTPS for your API
- Regularly rotate your encryption keys
- Keep sensitive values as build-time environment variables

❌ **DON'T:**
- Commit `.env.local`, `config.json`, or `build-config.ts` to your repository
- Use the same encryption key as in the examples
- Share your production environment variables
- Include sensitive values in `config.json` (it's publicly accessible)

### What's Public vs. Private

**Publicly Accessible (in config.json):**
- `apiUrl` - The backend API URL (not sensitive)
- `production` - Boolean flag for production mode

**Build-Time Only (embedded in compiled code):**
- `encryptionKey` - Used for localStorage encryption, embedded at build time and not in config.json

While the encryption key is embedded in the compiled JavaScript, it's much harder to extract than if it were in a plain JSON file accessible via network requests.

## Advanced: Multiple API Environments

If you have different API URLs for different environments:

1. Set environment-specific `API_URL` values in Vercel
2. Vercel automatically uses the correct values based on the deployment type (production/preview/development)

Example:
- **Production**: `API_URL=https://api.yourdomain.com`
- **Preview**: `API_URL=https://api-staging.yourdomain.com`
- **Development**: `API_URL=https://api-dev.yourdomain.com`

## Support

If you encounter issues:
1. Check the Vercel build logs
2. Review the RUNTIME_CONFIG.md documentation
3. Verify your environment variables are correctly set
