# Netlify Deployment Guide

## Quick Deployment Steps

### 1. Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/log in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account
4. Select repository: `brand-assets-ecosystem`
5. Select branch: `mcp-advanced-function`

### 2. Configure Build Settings
```
Base directory: interfaces/web-gui
Build command: npm run build:demo  
Publish directory: interfaces/web-gui/out
```

### 3. Environment Variables
Add this environment variable:
```
NEXT_PUBLIC_DEMO_MODE = true
```

### 4. Advanced Settings (Optional)
- **Node Version**: 18 or higher
- **Build Timeout**: 10 minutes (should build in ~2 minutes)

### 5. Deploy
Click "Deploy site" and wait for build completion.

## Expected Build Process
```
npm run build:demo
↓
NEXT_PUBLIC_DEMO_MODE=true next build
↓ 
Static export to /out directory
↓
Netlify serves static files with CDN
```

## Demo Features
- **Search functionality**: Client-side search with bundled data
- **Asset preview**: GitHub CDN serves actual logo files  
- **Download config**: Same color/format/size options as local
- **Pattern matching**: "fuzz" → "fuzzball", "war" → "warewulf"
- **Demo banner**: Clear indication this is demo version

## Troubleshooting

### Build Fails
- Check Node version (18+)
- Verify base directory: `interfaces/web-gui`
- Verify build command: `npm run build:demo`

### Assets Not Loading
- Assets load from GitHub CDN automatically
- No additional configuration needed

### Demo Banner Not Showing  
- Verify environment variable: `NEXT_PUBLIC_DEMO_MODE=true`
- Check build logs for environment variable

## Auto-Deployment
Once connected, Netlify will:
- Auto-deploy on every push to `mcp-advanced-function` branch
- Build using `npm run build:demo` automatically
- Update demo site within 2-3 minutes of push

## Local Testing
Test demo mode locally:
```bash
cd interfaces/web-gui
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```
You should see the demo banner and client-side search in action.