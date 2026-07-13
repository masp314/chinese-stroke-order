# Hanzi Steps

A local-first, installable, child-friendly Chinese character stroke-order and tracing app built with React, TypeScript, Vite, Hanzi Writer, and pinyin-pro.

Full handover documentation: [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md)

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

Practice history is also stored locally, deduplicated, and limited to the latest 30 entries. Saved word sets can retain a manually corrected pinyin reading. Pronunciation uses the browser Web Speech API and requires a Chinese voice installed on the device.

## Image and PDF import

Open **Advanced → Import from Image / PDF** to select PNG, JPG, JPEG, WebP, or PDF files. Image OCR runs in the browser with Tesseract.js using simplified Chinese (`chi_sim`). The OCR language data is downloaded on first use and then may be reused by the browser cache; images are not uploaded to an application backend.

Image OCR offers **Auto detect**, **Word / short phrase** for roughly 1–10 characters on one line, and **Worksheet / full page** for document-style images.

For PDFs, the app checks the first three pages for embedded text first. If no Chinese embedded text is found, those pages are rendered locally and sent through OCR. Extracted text remains editable until **Use this text & show characters** is selected. Long PDFs display a first-three-pages warning.
