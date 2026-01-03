# Runtime Configuration Setup

This application uses runtime configuration loaded from `config.json` at startup. This allows you to configure the application using environment variables without rebuilding the app.

## Configuration Values

The following configuration values are loaded at runtime:

- **API_URL**: The base URL for the backend API (default: `https://localhost:44347`)
- **ENCRYPTION_KEY**: The encryption key used to secure data in localStorage (default: `taskflow-chat-secure-key-2024`)
- **PRODUCTION**: Whether the app is running in production mode (default: `false`)

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

1. **Build Time**: The `scripts/generate-config.js` script runs before building and generates `public/config.json` from environment variables.

2. **App Startup**: Angular's `APP_INITIALIZER` loads the configuration from `/config.json` using the `AppConfigService` before the app starts.

3. **Runtime**: All services access configuration values through `AppConfigService` instead of hardcoded values.

## Services Using Runtime Config

- **ApiConfiguration**: Gets the API base URL from `AppConfigService.getApiUrl()`
- **LocalStorageService**: Gets the encryption key from `AppConfigService.getEncryptionKey()`

## Security Notes

⚠️ **IMPORTANT**: 

- Never commit `.env.local` or `public/config.json` to version control (they are git-ignored)
- Always use a strong, randomly generated encryption key in production
- Store sensitive configuration values as environment variables in your deployment platform
- The `config.json` file is served publicly, so never include secrets that shouldn't be exposed to the client

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
