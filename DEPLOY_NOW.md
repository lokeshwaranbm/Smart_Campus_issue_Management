# 🚀 Frontend-Only Deployment - Quick Start

Deploy your React app to Netlify while keeping backend & database on your local machine.

## 3-Step Setup (10 minutes)

### Step 1️⃣ : Make Backend Accessible

Choose ONE option:

**A) ngrok (Easiest - Recommended)**
```bash
# Install from https://ngrok.com
ngrok http 5000
# Copy the HTTPS URL shown (e.g., https://abc123.ngrok.io)
```

**B) Local Network**
```bash
# Find your IP (Windows)
ipconfig
# Use: http://192.168.1.100:5000 (replace with your IP)
```

### Step 2️⃣ : Push Code & Deploy to Netlify

```bash
# Push to GitHub
git add .
git commit -m "Deploy frontend to Netlify"
git push origin main
```

Then on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. **New site from Git** → Select repo
3. Build settings:
   - Base: `frontend`
   - Command: `npm run build`
   - Publish: `dist`
4. Click **Deploy** (waits 2-3 minutes)

### Step 3️⃣ : Add Backend URL to Netlify

1. In Netlify dashboard: **Site Settings** → **Build & deploy** → **Environment**
2. Add new variable:
   ```
   VITE_API_BASE_URL=https://abc123.ngrok.io
   ```
   (Use your ngrok URL or local IP from Step 1)
3. Redeploy (Netlify rebuilds automatically)

## ✅ Done!

Your app is live at: `https://[your-site].netlify.app`

**Keep backend running**: Your computer must stay on with:
```bash
cd backend
npm run dev
```

## 📋 Env Variable Cheat Sheet

| Environment | VITE_API_BASE_URL | Notes |
|-------------|-------------------|-------|
| Local dev | `http://localhost:5000` | (Automatic via vite proxy) |
| ngrok | `https://abc123.ngrok.io` | Change if ngrok restarts |
| Local IP | `http://192.168.1.100:5000` | Only works on same network |

## ❌ Issues?

| Problem | Fix |
|---------|-----|
| "Can't connect to API" | Check VITE_API_BASE_URL in Netlify matches your backend URL |
| CORS error | Backend is running and CORS_ORIGIN matches Netlify URL |
| ngrok keeps disconnecting | Use paid ngrok ($5/mo) for stable URL |

## 📚 Full Guide

See [DEPLOYMENT_FRONTEND_ONLY.md](./DEPLOYMENT_FRONTEND_ONLY.md) for complete details.

---

**Status**: Deployment files ready ✅ | Backend config updated ✅ | Ready to deploy 🚀
