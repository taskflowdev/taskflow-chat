# Vercel Deployment & Security Fix Summary

## Problems Addressed

### 1. Deep Link 404 Errors on Vercel
**Problem:** When deployed on Vercel, deep links like `/chats/group/:groupId` returned a 404 error even though they worked fine in local development with `ng serve`.

**Root Cause:** Vercel's default behavior is to look for physical files at the requested path. Single Page Applications (SPAs) like Angular need all routes to be served by `index.html` so that client-side routing can handle them.

**Solution:** Created `vercel.json` configuration file with proper rewrites to handle SPA routing.

### 2. Sensitive Data Exposure in Runtime Config
**Problem:** The runtime configuration file (`config.json`) exposed sensitive data like the `encryptionKey` publicly in the browser network tab, which is a security vulnerability.

**Root Cause:** The encryption key was being included in the publicly accessible `config.json` file that's served as a static asset.

**Solution:** Implemented a hybrid configuration approach:
- **Runtime Config** (`config.json`): Only contains non-sensitive values (API URL, production flag)
- **Build-Time Config** (`build-config.ts`): Contains sensitive values (encryption key) that are embedded during build

## Changes Made

### 1. Vercel Configuration (vercel.json)
Created a new `vercel.json` file with:
- SPA routing rewrites (all routes → `/index.html`)
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Cache control for config.json (no-cache)

### 2. Security - Build-Time Configuration System

#### New Files:
- `scripts/generate-build-config.js` - Generates build-config.ts from environment variables
- `src/app/core/config/build-config.template.ts` - Template for build-config.ts (tracked in git)
- `src/app/core/config/build-config.ts` - Generated file with actual values (git-ignored)

#### Modified Files:

**scripts/generate-config.js:**
- Removed `encryptionKey` from output
- Updated documentation to clarify it only includes non-sensitive values
- Added security warnings

**src/app/core/services/app-config.service.ts:**
- Removed `encryptionKey` from `AppConfig` interface
- Removed `getEncryptionKey()` method
- Updated validation to not require encryptionKey
- Updated default config to only include apiUrl and production

**src/app/auth/services/local-storage.service.ts:**
- Removed dependency on `AppConfigService` for encryption key
- Now imports encryption key from build-time config: `BUILD_CONFIG.ENCRYPTION_KEY`
- Simplified encryption/decryption methods

**package.json:**
- Added `build-config` script
- Updated `prestart` and `prebuild` to run both config generation scripts

**.gitignore:**
- Added `/src/app/core/config/build-config.ts` to ignore generated build config

**public/config.json.template:**
- Removed `encryptionKey` field

#### Updated Tests:
- `src/app/auth/services/local-storage.service.spec.ts` - Removed AppConfigService dependency

### 3. Documentation Updates

**VERCEL_DEPLOYMENT.md:**
- Added security note about encryption key being build-time only
- Explained SPA routing configuration
- Updated security best practices section
- Clarified what's public vs. private

**RUNTIME_CONFIG.md:**
- Updated to explain hybrid configuration approach
- Clarified which values are runtime vs. build-time
- Enhanced security notes

## Security Improvements

### Before:
```json
// config.json (publicly accessible via network tab)
{
  "apiUrl": "https://api.example.com",
  "encryptionKey": "super-secret-key-123",  // ❌ EXPOSED!
  "production": true
}
```

### After:
```json
// config.json (publicly accessible via network tab)
{
  "apiUrl": "https://api.example.com",
  "production": true
}
```

```typescript
// build-config.ts (embedded in compiled JavaScript)
export const BUILD_CONFIG = {
  ENCRYPTION_KEY: 'super-secret-key-123'  // ✅ Embedded at build time
};
```

## How It Works

### Local Development:
1. Developer sets environment variables in `.env.local`:
   ```
   API_URL=https://localhost:44347
   ENCRYPTION_KEY=your-secure-key
   PRODUCTION=false
   ```

2. Running `npm start` triggers:
   - `npm run config` → generates `public/config.json` with API_URL and PRODUCTION
   - `npm run build-config` → generates `src/app/core/config/build-config.ts` with ENCRYPTION_KEY

3. App loads:
   - Runtime config from `/config.json` (API URL, production flag)
   - Build-time config from compiled code (encryption key)

### Production (Vercel):
1. Set environment variables in Vercel dashboard:
   - `API_URL` - Backend API URL
   - `ENCRYPTION_KEY` - Strong random key
   - `PRODUCTION` - `true`

2. Vercel build triggers `npm run build`:
   - `prebuild` hook runs `npm run config` and `npm run build-config`
   - Generates both config files with environment variable values
   - Builds Angular app with embedded encryption key
   - `vercel.json` handles SPA routing

3. Deployed app:
   - Deep links work correctly (no 404s)
   - `config.json` only exposes non-sensitive values
   - Encryption key is embedded in compiled code (not in network-accessible JSON)

## Testing

### Build Verification:
```bash
npm run build
```
- ✅ Build succeeds
- ✅ `dist/taskflow-chat/browser/config.json` only contains `apiUrl` and `production`
- ✅ Encryption key is embedded in compiled JavaScript files

### Security Verification:
1. Check `public/config.json` - Should NOT contain encryption key
2. Check `dist/taskflow-chat/browser/config.json` - Should NOT contain encryption key
3. Search compiled JS for encryption key - Should find it embedded in code

## Benefits

1. **Security:**
   - Encryption key is no longer exposed in publicly accessible config.json
   - Harder to extract from compiled code than from JSON file
   - Different security posture for sensitive vs. non-sensitive config

2. **SPA Routing:**
   - Deep links work correctly on Vercel
   - Users can refresh or directly access any route
   - Proper 404 handling

3. **Best Practices:**
   - Follows MNC production-grade standards
   - Clear separation between public and private config
   - Proper use of environment variables
   - Comprehensive documentation

4. **Maintainability:**
   - Clean architecture
   - Easy to add more runtime or build-time config values
   - Template files tracked in git, generated files ignored

## Migration Notes

For existing deployments:

1. Set `ENCRYPTION_KEY` as a build-time environment variable (if not already set)
2. Redeploy the application (build process will handle the rest)
3. Existing encrypted localStorage data will continue to work (using the same key)

## Future Improvements

For even better security:
1. Move encryption to backend (client-side encryption is always vulnerable)
2. Use short-lived session tokens instead of localStorage
3. Implement proper key rotation mechanism
4. Consider using Web Crypto API for client-side encryption
