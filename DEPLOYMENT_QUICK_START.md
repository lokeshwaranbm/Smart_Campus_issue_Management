# Quick Deployment Checklist

## Before You Deploy

- [ ] Push all code to GitHub
- [ ] Have MongoDB Atlas connection string ready
- [ ] Have URLs for all services (will get these during deployment)

## Step-by-Step Deployment

### 1. MongoDB Setup (5 minutes)
- [ ] Create free MongoDB Atlas cluster
- [ ] Create database user
- [ ] Copy connection string and save it

### 2. Deploy Backend to Render (5-10 minutes)
- [ ] Go to render.com
- [ ] Create new Web Service from GitHub
- [ ] Set Root Directory: `backend`
- [ ] Add these environment variables:
  ```
  NODE_ENV=production
  PORT=5000
  MONGODB_URI=[your-mongodb-uri]
  CORS_ORIGIN=[you'll update this after Netlify deploy]
  ```
- [ ] Click Deploy
- [ ] ⏱️ Wait for build (usually 2-3 minutes)
- [ ] Copy your Render URL: `https://[your-app-name].onrender.com`

### 3. Deploy Frontend to Netlify (5-10 minutes)
- [ ] Go to netlify.com
- [ ] Create new site from GitHub
- [ ] Set Build command: `npm run build` (from frontend directory)
- [ ] Set Publish directory: `frontend/dist`
- [ ] Add environment variable:
  ```
  VITE_API_BASE_URL=[your Render URL from Step 2]
  ```
- [ ] Click Deploy
- [ ] ⏱️ Wait for build (usually 2-3 minutes)
- [ ] Copy your Netlify URL: `https://[your-app-name].netlify.app`

### 4. Update Backend CORS (2 minutes)
- [ ] Go back to Render dashboard
- [ ] Edit environment variables
- [ ] Update CORS_ORIGIN to your Netlify URL:
  ```
  CORS_ORIGIN=https://[your-app-name].netlify.app
  ```
- [ ] Redeploy backend

### 5. Test the App (5 minutes)
- [ ] Open your Netlify URL
- [ ] Try logging in
- [ ] Try creating/editing data
- [ ] Check browser console for errors
- [ ] Check Render logs for backend errors

## Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=[your-mongodb-atlas-connection-string]
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

### Netlify (Frontend)
```
VITE_API_BASE_URL=https://smart-campus-backend.onrender.com
```

### MongoDB Atlas
- Whitelist all IPs (0.0.0.0/0) if having connection issues
- Or add Render's static IP after Render upgrade to paid plan

## Common Issues

| Issue | Solution |
|-------|----------|
| "CORS error" | Check both CORS_ORIGIN and VITE_API_BASE_URL are set correctly, then redeploy both |
| "Cannot reach backend" | Check MongoDB connection string is correct in Render environment |
| "Database connect timeout" | Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access |
| "Build fails on Netlify" | Check build logs, ensure all package.json dependencies are installed |

## Next Steps

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information.
