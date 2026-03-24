# Deployment Guide: Netlify + Render

This guide covers deploying the Smart Campus application with Netlify (frontend) and Render (backend).

## Architecture

```
Frontend (React/Vite) → Netlify
                      ↓
                      API calls ↓
Backend (Express/Node) → Render
                      ↓
                      MongoDB Atlas (or local MongoDB)
```

## Prerequisites

1. GitHub account with this repository pushed
2. Netlify account (https://netlify.com)
3. Render account (https://render.com)
4. MongoDB Atlas account (https://mongodb.com/cloud/atlas) - for production database

## Step 1: Prepare MongoDB (Production)

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username and password
4. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/smart-campus?retryWrites=true&w=majority
   ```
5. Save this connection string for later

## Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2.2 Create Render Service

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Fill in the settings:
   - **Name**: `smart-campus-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter as needed)

### 2.3 Add Environment Variables

In the Render service dashboard, go to **Environment**:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-campus?retryWrites=true&w=majority
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

Replace:
- `username` and `password` with your MongoDB user credentials
- `your-netlify-domain` with your Netlify app name (you'll get this in Step 3)

### 2.4 Deploy

Click **Deploy** and wait for the deployment to complete. Note your service URL:
```
https://smart-campus-backend.onrender.com
```

## Step 3: Deploy Frontend to Netlify

### 3.1 Create Netlify Site

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Select **GitHub** and authorize
4. Select this repository
5. Fill in the settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 3.2 Add Environment Variables

In the Netlify site dashboard, go to **Site settings** → **Build & deploy** → **Environment**:

```
VITE_API_BASE_URL=https://smart-campus-backend.onrender.com
```

Replace with your actual Render backend URL from Step 2.4.

### 3.3 Deploy

Click **Deploy** and wait for the build to complete. Your app will be live at:
```
https://your-app-name.netlify.app
```

## Step 4: Update Backend CORS (Important)

Go back to your Render service and update the `CORS_ORIGIN` environment variable:

```
CORS_ORIGIN=https://your-app-name.netlify.app
```

Redeploy the backend with this updated value.

## Troubleshooting

### "CORS error" when frontend calls API

1. Check that `VITE_API_BASE_URL` in Netlify matches your Render backend URL
2. Check that `CORS_ORIGIN` in Render matches your Netlify frontend URL
3. Redeploy both services after updating environment variables

### Backend service not responding

1. Go to Render dashboard and check logs
2. Verify MongoDB connection string is correct
3. Check all environment variables are set

### Build fails on Netlify

1. Check the build logs in Netlify dashboard
2. Ensure `package.json` has all required dependencies
3. Verify Node version is compatible (Netlify uses Node 20)

### Database connection fails

1. Whitelist Render IPs in MongoDB Atlas:
   - Go to MongoDB Atlas → Security → Network Access
   - Add `0.0.0.0/0` (Allow from anywhere)
   - Or add specific Render IP
2. Verify connection string format is correct

## Monitoring & Logs

### View Backend Logs (Render)
1. Go to Render service dashboard
2. Click **Logs** tab
3. Check for errors

### View Frontend Build Logs (Netlify)
1. Go to Netlify site dashboard
2. Click **Deploys** tab
3. Click the deployment to see build logs

## Local Development

For local development with the new setup:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Update `frontend/.env.local` if backend is on a different port:
```
VITE_API_BASE_URL=http://localhost:5000
```

## Scaling Considerations

- **Render Free Tier**: Auto-sleeps after 15 minutes of inactivity. Upgrade to Starter tier ($7/month) for always-on service
- **MongoDB Atlas**: Free tier has storage limits. Monitor usage in the Atlas dashboard
- **Netlify**: Free tier includes generous build minutes. Monitor usage

## More Resources

- [Netlify Deploy Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Guide](https://docs.mongodb.com/atlas/)
