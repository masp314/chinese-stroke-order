# Hanzi Steps

A local-first, installable, child-friendly Chinese character stroke-order and tracing app built with React, TypeScript, Vite, and Hanzi Writer.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Other commands

```bash
npm run build
npm run lint
npm run preview
```

## Stroke data

The app itself runs locally, but version 1 loads character stroke data through Hanzi Writer's default CDN. The loading boundary is isolated in `src/services/characterData.ts` so bundled local data can replace it later without changing the UI.

## PWA installation test

PWA installation requires a production build served from HTTPS or localhost:

```bash
npm run build
npm run preview
```

On desktop Chrome, open DevTools → Application to inspect the manifest and service worker. For Android Chrome, serve the production build from an HTTPS URL reachable by the device, open it in Chrome, then choose **Install app** or **Add to Home screen**.

The service worker caches the app shell. Hanzi Writer stroke data still comes from its CDN and is not guaranteed offline.

## GitHub Pages

Pushes to `main` automatically build and deploy the app through `.github/workflows/deploy-pages.yml`. The workflow sets `VITE_BASE_PATH=/chinese-stroke-order/`; local and Netlify builds continue to use `/`.

## Local data

Saved word sets use browser `localStorage`. They remain only in that browser profile and can be removed by clearing site data.
