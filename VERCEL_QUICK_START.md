# Quick Start: Deploying to Vercel

## Prerequisites
- [ ] Vercel account created
- [ ] Repository pushed to GitHub
- [ ] Backend API deployed and accessible

## Step 1: Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Angular configuration

## Step 2: Configure Build Settings
Verify these settings (should be auto-detected):
- **Framework Preset**: Angular
- **Build Command**: `npm run build`
- **Output Directory**: `dist/taskflow-chat/browser`
- **Install Command**: `npm install`

## Step 3: Set Environment Variables
Add these environment variables in Vercel:

### Required:
```
API_URL=https://your-api-url.com
ENCRYPTION_KEY=<generate-using-command-below>
PRODUCTION=true
```

### Generate Secure Encryption Key:
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important:** Use a different encryption key for each environment (production, staging, development).

## Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a deployment URL

## Step 5: Verify Deployment

### ✅ Check Deep Links Work:
1. Visit your deployment URL
2. Navigate to a chat group (e.g., `/chats/group/123`)
3. Refresh the page - should NOT get 404

### ✅ Check Security:
1. Open browser DevTools → Network tab
2. Find the request to `/config.json`
3. Verify response ONLY contains:
   ```json
   {
     "apiUrl": "https://your-api-url.com",
     "production": true
   }
   ```
4. Should NOT contain `encryptionKey`

## Troubleshooting

### 404 on Deep Links
- ✅ Verify `vercel.json` exists in repository root
- ✅ Check Vercel logs for any errors during build
- ✅ Try redeploying

### Config Not Loading
- ✅ Check all environment variables are set in Vercel
- ✅ Check build logs show "✅ Generated config.json successfully"
- ✅ Visit `https://your-app.vercel.app/config.json` to see actual config

### API Connection Issues
- ✅ Verify `API_URL` is correct and accessible
- ✅ Check CORS settings on your backend
- ✅ Ensure backend accepts requests from your Vercel domain

### Build Failures
- ✅ Check build logs in Vercel dashboard
- ✅ Verify all environment variables are set
- ✅ Try building locally first: `npm run build`

## Environment-Specific Configurations

Vercel supports different environment variables for:
- **Production** - Your main deployment
- **Preview** - PR deployments and branches
- **Development** - Local development

Set different `API_URL` and `ENCRYPTION_KEY` for each environment for better security and isolation.

## Updating Configuration

To update environment variables:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update the values
3. Trigger a new deployment (push to main or manual redeploy)

## Security Checklist

- [x] Different encryption keys for each environment
- [x] API URL uses HTTPS
- [x] Backend CORS configured for Vercel domain
- [x] No sensitive data committed to repository
- [x] `.env.local` and `build-config.ts` in `.gitignore`

## What's Different from Local Development?

| Aspect | Local (`ng serve`) | Production (Vercel) |
|--------|-------------------|---------------------|
| Routing | Dev server handles | `vercel.json` rewrites |
| Config | `.env.local` file | Vercel environment variables |
| Encryption Key | In code/config | Embedded at build time |
| Build | JIT compilation | AOT compilation |
| API URL | localhost | Production API |

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure analytics (optional)
3. Set up monitoring
4. Test all functionality
5. Update DNS (if using custom domain)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- Check `VERCEL_FIX_SUMMARY.md` for detailed technical information
