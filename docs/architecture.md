# VERITAS Architecture

## Overview

VERITAS is a single‑page application (SPA) with two distinct interfaces: **`/report`** (community submission) and **`/respond`** (responder dashboard). It is built as a Progressive Web App (PWA) to function fully offline.

```

┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   /report       │          │   /respond      │           │
│  │ (Community)     │          │ (Responder)     │           │
│  └────────┬────────┘          └────────┬────────┘           │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           IndexedDB (local report store)            │    │
│  └─────────────────────────────────────────────────────┘    │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Service Worker (offline cache)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
│
▼ (when online)
┌─────────────────┐
│    Supabase     │
│   (sync layer)  │
└─────────────────┘

```

## Data Flow

1. **Community submits a report** (offline‑capable)
   - Photo captured → EXIF stripped → stored as base64 in IndexedDB.
   - Metadata (tier, infra, GPS, DCI) stored in IndexedDB.
   - If online, report is synced to Supabase.

2. **CERTUS scoring**
   - PES_eff calculated from TensorFlow.js model (offline) or fallback.
   - COR computed from existing local reports (IndexedDB).
   - TFR from timestamp.
   - CCI from tier/infra logic.
   - DCI stored with report.

3. **Responder dashboard**
   - Fetches reports from Supabase (or falls back to local cache).
   - Displays confidence‑coded map, conflicts, export options.

## Key Files

- `index.html` – Entire application (report & respond views, logic).
- `sw.js` – Service Worker for offline caching.
- `manifest.json` – PWA metadata.
- `supabase/schema.sql` – Database schema for Supabase.

## Offline Strategy

- **IndexedDB** stores all submitted reports (including photos) even when offline.
- **Service Worker** caches the app shell (`index.html`, CSS, JS, map tiles) so the app loads even without network.
- When online, a background sync pushes unsynced reports to Supabase.

## Security & Anonymity

- No user accounts; UUID generated per report.
- EXIF stripped from photos on client side.
- IP addresses not stored; Supabase edge function strips headers.
- GPS fuzzing optional for conflict zones.

---

*Full anonymity protocol in [anonymization.md](anonymization.md).*