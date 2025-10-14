# Runtime Configuration Architecture

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Developer creates .env.local:                                        │
│     ┌─────────────────────────┐                                          │
│     │ .env.local              │                                          │
│     │ ─────────────────────── │                                          │
│     │ API_URL=https://...     │                                          │
│     │ ENCRYPTION_KEY=xxx      │                                          │
│     │ PRODUCTION=false        │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  2. npm start runs prestart hook:                                        │
│     ┌─────────────────────────┐                                          │
│     │ generate-config.js      │                                          │
│     │ ─────────────────────── │                                          │
│     │ • Reads .env.local      │                                          │
│     │ • Validates values      │                                          │
│     │ • Generates config.json │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  3. Config written to public/:                                           │
│     ┌─────────────────────────┐                                          │
│     │ public/config.json      │                                          │
│     │ ─────────────────────── │                                          │
│     │ {                       │                                          │
│     │   "apiUrl": "...",      │                                          │
│     │   "encryptionKey": "...",│                                         │
│     │   "production": false   │                                          │
│     │ }                       │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  4. Angular dev server serves config.json as static asset                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ENVIRONMENT (Vercel)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Environment variables set in Vercel dashboard:                       │
│     ┌─────────────────────────┐                                          │
│     │ Vercel Env Variables    │                                          │
│     │ ─────────────────────── │                                          │
│     │ API_URL=https://...     │                                          │
│     │ ENCRYPTION_KEY=xxx      │                                          │
│     │ PRODUCTION=true         │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  2. Build process runs prebuild hook:                                    │
│     ┌─────────────────────────┐                                          │
│     │ generate-config.js      │                                          │
│     │ ─────────────────────── │                                          │
│     │ • Reads system env vars │                                          │
│     │ • Validates values      │                                          │
│     │ • Generates config.json │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  3. Config included in build output:                                     │
│     ┌─────────────────────────┐                                          │
│     │ dist/.../config.json    │                                          │
│     │ ─────────────────────── │                                          │
│     │ {                       │                                          │
│     │   "apiUrl": "...",      │                                          │
│     │   "encryptionKey": "...",│                                         │
│     │   "production": true    │                                          │
│     │ }                       │                                          │
│     └─────────────────────────┘                                          │
│              │                                                            │
│              ▼                                                            │
│  4. Vercel CDN serves config.json as static asset                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        ANGULAR APPLICATION STARTUP                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. APP_INITIALIZER runs before app starts:                             │
│     ┌─────────────────────────────────┐                                  │
│     │ appConfigInitializerFactory     │                                  │
│     │ ──────────────────────────────  │                                  │
│     │ return () =>                    │                                  │
│     │   appConfigService.loadConfig() │                                  │
│     └─────────────────────────────────┘                                  │
│              │                                                            │
│              ▼                                                            │
│  2. AppConfigService loads config:                                       │
│     ┌─────────────────────────────────┐                                  │
│     │ AppConfigService.loadConfig()   │                                  │
│     │ ──────────────────────────────  │                                  │
│     │ • HTTP GET /config.json         │                                  │
│     │ • Parse JSON                    │                                  │
│     │ • Validate required fields      │                                  │
│     │ • Store in memory               │                                  │
│     │ • Or use defaults if fails      │                                  │
│     └─────────────────────────────────┘                                  │
│              │                                                            │
│              ▼                                                            │
│  3. Configuration available to all services:                             │
│     ┌─────────────────────────────────┐                                  │
│     │ ApiConfiguration                │                                  │
│     │ ──────────────────────────────  │                                  │
│     │ rootUrl = appConfig.getApiUrl() │                                  │
│     └─────────────────────────────────┘                                  │
│                                                                           │
│     ┌─────────────────────────────────┐                                  │
│     │ LocalStorageService             │                                  │
│     │ ──────────────────────────────  │                                  │
│     │ key = appConfig                 │                                  │
│     │       .getEncryptionKey()       │                                  │
│     └─────────────────────────────────┘                                  │
│              │                                                            │
│              ▼                                                            │
│  4. Auth initializer runs (after config loaded)                          │
│  5. App renders (all config values available)                            │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Points

### ✅ Advantages
1. **No Rebuild Required** - Change config without rebuilding
2. **Environment-Specific** - Different values per environment
3. **Secure** - Secrets not in source code
4. **Type-Safe** - Full TypeScript support
5. **SSR-Safe** - Works with server-side rendering
6. **Fallback Values** - App works even if config fails

### 🔒 Security
- `.env.local` and `config.json` are git-ignored
- Only templates committed to version control
- Encryption key is configurable per environment
- Config.json is public but contains no backend secrets

### 📝 Files Overview

**Runtime Files (git-ignored):**
- `.env.local` - Local environment variables
- `public/config.json` - Generated configuration

**Template Files (committed):**
- `.env.local.example` - Example environment variables
- `public/config.json.template` - Configuration template

**Source Files:**
- `src/app/core/services/app-config.service.ts` - Configuration service
- `src/app/core/config-initializer.ts` - APP_INITIALIZER factory
- `scripts/generate-config.js` - Config generation script

### 🚀 Deployment Checklist

**Local Development:**
- [x] Copy `.env.local.example` to `.env.local`
- [x] Edit `.env.local` with your values
- [x] Run `npm start`

**Production (Vercel):**
- [x] Set environment variables in Vercel dashboard
- [x] Deploy normally (config auto-generated)
- [x] Verify config loads in browser console
