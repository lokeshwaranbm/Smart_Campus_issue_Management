# Deploy Frontend to Netlify (Local Backend)

This guide covers deploying only the React frontend to Netlify while running the backend and database on your local system.

## Architecture

```
┌──────────────────────┐
│  Netlify (Frontend)  │
│  React/Vite SPA      │
└─────────┬────────────┘
          │ API calls
          ▼
┌──────────────────────┐
│  Your Local System   │
│  Backend (Express)   │
│  Database (MongoDB)  │
└──────────────────────┘
```

## Prerequisites

1. GitHub account with your repository pushed
2. Netlify account (free: https://netlify.com)
3. Backend running locally: `npm run dev` in `backend/` folder
4. MongoDB running locally

## Step 1: Expose Backend to Internet (Optional but Recommended)

### Option A: Using ngrok (Easiest)

If you want the production frontend on Netlify to access your local backend:

1. Install ngrok: https://ngrok.com
2. Expose your backend:
   ```bash
   ngrok http 5000
   ```
3. Copy the HTTPS URL. It will look like: `https://abc123.ngrok.io`
4. Save this for Step 3

### Option B: Use Local IP + Port Forwarding

1. Find your local IP:
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.1.100`)
2. Forward port 5000 from your router to your computer
3. Your backend URL: `http://your-public-ip:5000`

### Option C: Keep It Private

If you only need to access from local network:
- Backend URL: `http://your-local-ip:5000` (e.g., `http://192.168.1.100:5000`)
- Only works on same network

## Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Ready for Netlify frontend deployment"
git push origin main
```

## Step 3: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub and select this repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy**

## Step 4: Set Environment Variable in Netlify

Your frontend needs to know where your backend is.

1. After deployment, go to your Netlify **Site Settings**
2. Go to **Build & deploy** → **Environment**
3. Add environment variable:
   ```
   VITE_API_BASE_URL=http://your-backend-url:5000
   ```
   
   Use one of:
   - **ngrok URL**: `https://abc123.ngrok.io`
   - **Local IP**: `http://192.168.1.100:5000`
   - **Same network only**: `http://your-computer-name:5000`

4. Redeploy (Netlify will rebuild with the new env var)

## Step 5: Test

1. Open your Netlify app URL
2. Try logging in and creating/editing data
3. Check browser console (F12 → Console) for errors
4. Check backend terminal for incoming requests

## Keeping Your Backend Running

Your backend must always be running for the production frontend to work:

```bash
cd backend
npm run dev
```

Or for production on your local system:
```bash
NODE_ENV=production npm start
```

## CORS Configuration

The backend is already configured to accept requests from Netlify. When you set the environment variable in Step 4, the backend CORS will automatically allow it.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot reach backend" from Netlify | Check VITE_API_BASE_URL is set correctly in Netlify environment variables |
| "CORS error" | Make sure backend is running and CORS_ORIGIN env var is set correctly |
| ngrok URL keeps changing | Use ngrok paid plan for static URL, or update Netlify env var each time |
| Can't reach from outside network | Use Option A (ngrok) or set up proper port forwarding |

## Redeploying Frontend

When you make frontend changes:

```bash
git add .
git commit -m "Frontend updates"
git push origin main
```

Netlify automatically rebuilds and deploys.

## Important Notes

⚠️ **Keep Backend Running**: The production app on Netlify requires your local backend to be always running. This means:
- Your computer must stay on
- Backend process must not crash
- Network connection must be stable

💡 **Recommended**: For truly production-ready deployment, eventually move backend to a hosting service like Render (see DEPLOYMENT.md if needed later)

🔐 **Security**: Using ngrok exposes your local backend to the internet. Be cautious with sensitive data.

## Local Development

For local development (everything runs locally):

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

The frontend dev server automatically proxies API calls to `http://localhost:5000` (see `frontend/vite.config.js`).

## Next Steps

1. Make sure backend is running locally
2. Choose how to expose it (ngrok recommended for simplicity)
3. Follow Steps 1-4 above
4. Test the production app

Got any questions? Check the troubleshooting section or refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for the full stack deployment guide.
