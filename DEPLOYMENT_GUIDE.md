# GovRoll Deployment Guide

This guide explains how to deploy the GovRoll application using a split deployment strategy:
- **Frontend**: [Vercel](https://vercel.com) (Optimized for Vite/React)
- **Backend**: [Netlify](https://netlify.com) (Using Serverless Functions)

## Part 1: Deploy Backend to Netlify

The backend has been configured to run as a Netlify Function.

1. **Push to GitHub**: Ensure your latest changes are pushed.
2. **Log in to Netlify**: Go to [app.netlify.com](https://app.netlify.com).
3. **Add New Site**:
   - Click **"Add new site"** > **"Import from an existing project"**.
   - Select **GitHub** and authorize.
   - Pick your `GovRoll` repository.
4. **Configure Build Settings**:
   - **Base directory**: `server`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` (or leave blank, Netlify uses functions)
   - **Functions directory**: Netlify should auto-detect from `netlify.toml`, but if asked, it's `dist/functions` (we set this up in the code). *Actually, for TypeScript builds, Netlify often handles the build automatically if we just point it to the handler.*
   
   **CRITICAL: Environment Variables**
   Add these variable in "Site configuration" > "Environment variables":
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `NODE_VERSION`: `20`

5. **Deploy**: Click **"Deploy site"**.
6. **Get Backend URL**: Once deployed, your backend URL will be something like `https://your-site-name.netlify.app`.

## Part 2: Deploy Frontend to Vercel

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com).
2. **Add New Project**:
   - Click **"Add New..."** > **"Project"**.
   - Import `GovRoll`.
3. **Configure Configuration**:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: `./` (default).
4. **Environment Variables**:
   - Add `VITE_API_URL`.
   - Value: `https://your-site-name.netlify.app/.netlify/functions/lambda` (Replace `your-site-name` with your actual Netlify backend URL).
   > **Note**: The suffix `/.netlify/functions/lambda` is required because we are using a serverless function wrapper.

5. **Deploy**: Click **"Deploy"**.

## Summary of URLs

- **Frontend**: `https://govroll.vercel.app` (example)
- **Backend API**: `https://govroll-server.netlify.app/.netlify/functions/lambda`

## Troubleshooting

- **CORS Errors**: If you see CORS errors in the browser console, ensure the `VITE_API_URL` is correct and implies HTTPS.
- **Upload Limits**: Netlify Functions have a 6MB payload limit. Large PDFs might fail.
- **Timeouts**: Netlify Functions timeout after 10 seconds.
