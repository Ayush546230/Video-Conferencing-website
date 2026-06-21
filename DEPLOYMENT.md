# 🚀 Deployment Guide: Vercel (Frontend) & Render (Backend)

Follow these step-by-step instructions to deploy your application to production. Since this project consists of a React frontend and a Node.js/Express backend, we will deploy them as two separate services.

---

## Part 1: Deploy Backend to Render

Deploy the backend first so you have a live API URL to give to your frontend.

### 1. Create a Web Service
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your repository (`Video-Conferencing-website`).

### 2. Configure the Service
Set up the service with the following details:
- **Name**: `airender-backend` (or similar)
- **Region**: Choose the one closest to you (e.g., Singapore / Frankfurt)
- **Branch**: `main`
- **Root Directory**: `backend` *(⚠️ VERY IMPORTANT: Since it's a monorepo, you must tell Render the backend is in this folder)*
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### 3. Add Environment Variables
Scroll down to **Environment Variables** and add everything from your `backend/.env.example`. 

**Crucial Updates for Production:**
- `NODE_ENV`: set to `production`
- `FRONTEND_URL`: Leave this blank or set to `https://your-frontend-domain.vercel.app` (you will update this after step 2).
- `WEBAUTHN_RP_ID`: The domain of your frontend (e.g., `your-frontend.vercel.app` - do NOT include `https://`).
- `WEBAUTHN_ORIGIN`: The full URL of your frontend (e.g., `https://your-frontend.vercel.app`).
- `MONGO_URI`: Your MongoDB Atlas connection string.

### 4. Deploy
Click **Create Web Service**. Render will start building your backend. Once it says "Live", copy the Render URL (e.g., `https://airender-backend.onrender.com`).

---

## Part 2: Deploy Frontend to Vercel

Vercel is optimized for frontend applications like Vite + React.

*(Note: We have already added a `vercel.json` file to the frontend folder to ensure React Router works correctly on Vercel without throwing 404 errors on refresh).*

### 1. Create a New Project
1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`Video-Conferencing-website`).

### 2. Configure the Project
- **Project Name**: `airender-video`
- **Framework Preset**: `Vite`
- **Root Directory**: Click "Edit" and select `frontend`. *(⚠️ VERY IMPORTANT)*

### 3. Add Environment Variables
Expand the **Environment Variables** section and add the keys from your `frontend/.env.example`:
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `VITE_JAAS_APP_ID`: Your JaaS App ID.
- **IMPORTANT**: You also need to tell your frontend where the backend is. If you hardcoded `http://localhost:5000` in your React code, you need to change it to use an environment variable (e.g., `VITE_API_URL=https://airender-backend.onrender.com`).

### 4. Deploy
Click **Deploy**. Vercel will build and launch your frontend. Copy your new `.vercel.app` domain.

---

## Part 3: Final Configuration (Connecting the Two)

Now that both are live, you need to update a few settings to ensure they can talk to each other securely.

### 1. Update Render (CORS & WebAuthn)
1. Go back to your backend service on Render.
2. Go to **Environment**.
3. Update `FRONTEND_URL` to your new Vercel domain (e.g., `https://airender-video.vercel.app`).
4. Update `WEBAUTHN_RP_ID` to your Vercel domain without `https://` (e.g., `airender-video.vercel.app`).
5. Update `WEBAUTHN_ORIGIN` to your full Vercel domain (e.g., `https://airender-video.vercel.app`).
6. Save changes (Render will automatically redeploy).

### 2. Update Google Cloud Console
Your Google Login will block the new domain until you allow it.
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Edit your OAuth 2.0 Client ID.
3. Add your Vercel domain to **Authorized JavaScript origins**.
4. Add your Vercel domain to **Authorized redirect URIs**.
5. Save.

**🎉 Congratulations! Your enterprise application is now live on the internet!**
