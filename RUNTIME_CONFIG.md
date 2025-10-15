# Runtime Configuration Setup

This application uses a hybrid configuration approach:

1. **Runtime Configuration** (`config.json`) - Loaded at app startup, contains non-sensitive public configuration
2. **Build-Time Configuration** (`build-config.ts`) - Embedded during build, contains sensitive values

## Configuration Values

The following configuration values are available:

### Runtime Config (Public - in config.json)
- **API_URL**: The base URL for the backend API (default: `https://localhost:44347`)
- **PRODUCTION**: Whether the app is running in production mode (default: `false`)

### Build-Time Config (Private - embedded in code)
- **ENCRYPTION_KEY**: The encryption key used to secure data in localStorage (default: `taskflow-chat-secure-key-2024`)

**SECURITY:** The encryption key is embedded at build time and is NOT served in the publicly accessible `config.json` file.

## Local Development

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your configuration:
   ```bash
   API_URL=https://localhost:44347
   ENCRYPTION_KEY=your-secure-encryption-key
   PRODUCTION=false
   ```

3. The configuration will be automatically generated when you run:
   ```bash
   npm start
   # or
   npm run build
   ```

### Manual Config Generation

You can also generate the config manually:
```bash
npm run config
```

This will read environment variables from `.env.local` (if it exists) or system environment variables, and generate `public/config.json`.

## Production Deployment

### Vercel

1. Set environment variables in your Vercel project settings:
   - `API_URL`: Your production API URL
   - `ENCRYPTION_KEY`: A secure random key for production
   - `PRODUCTION`: `true`

2. Add a build command that generates the config:
   ```json
   {
     "buildCommand": "npm run build"
   }
   ```

3. The `prebuild` script will automatically generate `config.json` from the environment variables before building.

### Other Platforms

For other deployment platforms:

1. Set the required environment variables in your platform's settings
2. Ensure the build command runs `npm run build` (which will run the `prebuild` script automatically)
3. The generated `public/config.json` will be included in the build output

## How It Works

1. **Build Time**: 
   - The `scripts/generate-config.js` script runs before building and generates `public/config.json` from environment variables (API_URL, PRODUCTION only)
   - The `scripts/generate-build-config.js` script runs before building and generates `src/app/core/config/build-config.ts` from environment variables (ENCRYPTION_KEY)

2. **App Startup**: Angular's `APP_INITIALIZER` loads the runtime configuration from `/config.json` using the `AppConfigService` before the app starts.

3. **Runtime**: 
   - Services access the API URL through `AppConfigService.getApiUrl()`
   - The encryption key is accessed directly from the build-time config (`BUILD_CONFIG.ENCRYPTION_KEY`)

## Services Using Configuration

- **ApiConfiguration**: Gets the API base URL from `AppConfigService.getApiUrl()`
- **LocalStorageService**: Gets the encryption key from build-time `BUILD_CONFIG.ENCRYPTION_KEY`

## Security Notes

⚠️ **IMPORTANT**: 

- Never commit `.env.local`, `public/config.json`, or `src/app/core/config/build-config.ts` to version control (they are git-ignored)
- Always use a strong, randomly generated encryption key in production
- Store all configuration values as environment variables in your deployment platform
- The `config.json` file is served publicly and should ONLY contain non-sensitive values (API URL, production flag)
- Sensitive values like encryption keys are embedded at build time in `build-config.ts` and compiled into the application code
- While embedded values are harder to extract than config.json values, true secrets should still be handled server-side

## Troubleshooting

### Config not found error

If you see errors about config.json not being found:
1. Make sure you ran `npm run config` or `npm start`
2. Check that `public/config.json` exists
3. Verify your environment variables are set correctly

### Using default values

If the app logs "Using default configuration values":
1. Check that `public/config.json` exists and is valid JSON
2. Verify the required fields (`apiUrl`, `encryptionKey`) are present
3. Check browser console for more detailed error messages

### Environment variables not loading

If your environment variables aren't being used:
1. Make sure `.env.local` exists and is properly formatted
2. Verify there are no syntax errors in `.env.local`
3. Try running `npm run config` manually to see if there are any errors
