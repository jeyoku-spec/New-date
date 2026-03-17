# Dating Coach AI - Vercel Deployment Guide

This project is now optimized for deployment on [Vercel](https://vercel.com).

## Deployment Steps

1.  **Push to GitHub**: If you haven't already, push your code to a GitHub repository.
2.  **Import to Vercel**:
    -   Go to the [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click **New Project**.
    -   Import your GitHub repository.
3.  **Configure Environment Variables**:
    -   During the import process, expand the **Environment Variables** section.
    -   Add `GEMINI_API_KEY` with your Google Gemini API key.
4.  **Deploy**: Click **Deploy**. Vercel will automatically detect Vite and build your project.

## Troubleshooting

### "vite: command not found" on Vercel
If you see this error during the build process:
1.  **Node.js Version**: Ensure your Vercel project is set to use **Node.js 18.x or 20.x** (Settings > General > Node.js Version).
2.  **Clean Install**: If the error persists, you can try to trigger a "Redeploy" on Vercel and select **"Clear Build Cache"**.
3.  **Dependencies**: I have moved `vite` to the main `dependencies` list to ensure Vercel always installs it, even if it's running in a strict production mode.
