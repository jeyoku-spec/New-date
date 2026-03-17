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

## Project Optimizations for Vercel

-   **Tailwind CSS v4**: Switched from CDN to a proper build-time integration using `@tailwindcss/vite`. This reduces bundle size and improves performance.
-   **Client-Side Routing**: Added `vercel.json` with rewrite rules to ensure that refreshing the page on a sub-route (if added in the future) works correctly.
-   **Bundled Dependencies**: Removed the `importmap` from `index.html` to allow Vite to bundle all dependencies from `package.json`, ensuring a more stable and predictable production build.
-   **Build Scripts**: Standardized `package.json` scripts for Vercel's build pipeline.
