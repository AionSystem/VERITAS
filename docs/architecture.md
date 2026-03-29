# VERITAS Architecture

## Overview

VERITAS is a single‑page application (SPA) with two distinct interfaces: **`/report`** (community submission) and **`/respond`** (responder dashboard). It is built as a Progressive Web App (PWA) to function fully offline.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser                                     │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │   /report   │  │   /respond  │  │ CERTUS.AI   │  │ AION.CERTIFY  │  │
│  │ (Community) │  │ (Responder) │  │ /simulator  │  │  /certify     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬────────┘  │
│         │                │                 │                 │           │
│         ▼                ▼                 ▼                 ▼           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                  IndexedDB (local report store)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│         │                │                                               │
│         ▼                ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Service Worker (offline cache)                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼ (when online)
                ┌─────────────────────┐
                │      Supabase       │
                │   (sync + backend)  │
                └──────────┬──────────┘
                           │
             ┌─────────────┴──────────────┐
             │                            │
             ▼                            ▼
    ┌─────────────────┐        ┌──────────────────────┐
    │  Real-time sub  │        │  REST API            │
    │  (map refresh)  │        │  /rest/v1/reports    │
    └─────────────────┘        │  (export + 3rd party)│
                               └──────────────────────┘
```

---

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

4. **REST API export** *(see REST API section below)*
   - Third-party systems and UNDP integrations query `/rest/v1/reports` directly.
   - Supports filtering by damage tier, DCI range, timestamp, and infrastructure type.
   - Returns JSON; GeoJSON and CSV available via query parameters.

---

## REST API

Supabase auto-generates a fully documented REST API from the `reports` table schema. No additional backend code is required.

### Base URL

```
https://<your-project>.supabase.co/rest/v1/reports
```

### Authentication

All requests require the `anon` key in the `apikey` header:

```http
GET /rest/v1/reports
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
```

### Example Queries

**All high-confidence reports (DCI ≥ 0.70):**
```http
GET /rest/v1/reports?dci=gte.0.70
```

**Completely damaged infrastructure, last 48 hours:**
```http
GET /rest/v1/reports?damage_tier=eq.completely_damaged&created_at=gte.2026-04-06T00:00:00Z
```

**GeoJSON-ready export (lat/lng + damage fields):**
```http
GET /rest/v1/reports?select=id,lat,lng,damage_tier,dci,infra_type,created_at
```

### Supported Response Formats

| Format | Method |
|---|---|
| JSON | Default response from all endpoints |
| CSV | Add `Accept: text/csv` header |
| GeoJSON | Use `/respond` dashboard export button (wraps REST response) |
| Shapefile | Use `/respond` dashboard export button (wraps REST response via shp-write) |

### Rate Limits and Scale

Supabase REST API is stateless and horizontally scalable. At Supabase Pro tier (recommended for crisis deployments):

- Read throughput: ~10,000 requests/minute
- Storage: 100GB+ (supports 500,000 photo-bearing reports per crisis)
- Row-level security (RLS) enforced at database level — anonymous writes only; authenticated reads for responders

Full scale tier documentation: [`docs/scale.md`](docs/scale.md)

---

## Ecosystem Tools

VERITAS operates as the field instrument within a three-tool suite. All tools share the same design language, offline capability, and STP integration.

### CERTUS.AI — `/simulator.html`

A standalone resource allocation simulator powered by the CERTUS Engine. Responders input scenario parameters (report count, DCI distribution, infrastructure types) and receive a simulated confidence map and intervention priority ranking. Uses the same DCI formula as the core app — no separate backend required; runs entirely client-side.

**Purpose within architecture:** Demonstrates the CERTUS scoring logic in isolation. Useful for training responders before a crisis and for validating DCI thresholds against historical scenarios.

### AION.CERTIFY — `/certify.html`

An immutable sealing interface for any crisis dataset. After export from the `/respond` dashboard, a responder can drag the export file into AION.CERTIFY to generate a Sovereign Trace Protocol (STP) seal — a SHA-256 hash bound to a triple-time cryptographic timestamp (Gregorian, Hebrew lunisolar, 13-Moon Dreamspell). The seal is written as a permanent ledger entry to the [SOVEREIGN-TRACE-PROTOCOL](https://github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL) GitHub repository.

**Purpose within architecture:** Post-export integrity layer. Proves the dataset existed, was unaltered, and was sealed at a verified moment in time. Relevant for legal handoff, insurance claims, and UNDP archival requirements.

### Tool Interaction Map

```
/report ──► IndexedDB ──► Supabase ──► /respond ──► Export (JSON/CSV/GeoJSON/SHP)
                                                          │
                                                          ▼
                                                   AION.CERTIFY
                                                   (STP seal + hash)

CERTUS.AI ──► standalone simulation ──► DCI output
              (no Supabase dependency)
```

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Entire application (report & respond views, logic) |
| `simulator.html` | CERTUS.AI — standalone resource allocation simulator |
| `certify.html` | AION.CERTIFY — STP seal generation interface |
| `sw.js` | Service Worker for offline caching |
| `manifest.json` | PWA metadata |
| `supabase/schema.sql` | Database schema for Supabase |
| `docs/dci-formula.md` | CERTUS Engine formula and thresholds |
| `docs/scale.md` | Database tier, scale architecture, and upgrade path |
| `docs/anonymization.md` | Full anonymity protocol |

---

## Offline Strategy

- **IndexedDB** stores all submitted reports (including photos) even when offline.
- **Service Worker** caches the app shell (`index.html`, CSS, JS, map tiles) so the app loads even without network.
- When online, a background sync pushes unsynced reports to Supabase.
- REST API is unavailable offline by design; local IndexedDB serves as the fallback data layer for the responder dashboard.

---

## Security & Anonymity

- No user accounts; UUID generated per report.
- EXIF stripped from photos on client side.
- IP addresses not stored; Supabase edge function strips headers.
- GPS fuzzing optional for conflict zones.
- REST API enforces row-level security — write access is anonymous; read access requires the responder access code resolved to a Supabase role.

---

*Full anonymity protocol in [anonymization.md](anonymization.md).*
*Scale architecture in [scale.md](docs/scale.md).*
