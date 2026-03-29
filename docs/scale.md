# VERITAS — Scale Architecture

## Overview

VERITAS is designed to operate across the full range of crisis scales UNDP specified — from local sub-national events to large national disasters — without architectural changes. Scaling is a configuration and tier decision, not a rebuild.

The client-side PWA shell runs entirely in the browser. The server bears sync and query load only, not rendering. This separation means VERITAS scales horizontally by upgrading the backend tier, not by rewriting the application.

---

## Scale Tiers

| Crisis Scale | Estimated Reports | Supabase Tier | Monthly Cost | Notes |
|---|---|---|---|---|
| Local / sub-national | Up to 50,000 | Free | $0 | 500MB storage, 50k MAU |
| Medium / regional | Up to 250,000 | Pro | $25 | 8GB storage, unlimited MAU |
| Large / national | Up to 500,000 | Pro + read replicas | ~$100 | Horizontal read scaling |
| Multi-crisis / sustained | Hundreds of crises/year | Pro + partitioning | ~$100–200 | Crisis-ID partitioning (see below) |

---

## Database Structure

Each report is a single row in the `reports` table. Fields:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Client-generated, never server-assigned |
| `created_at` | Timestamptz | ISO 8601, set at submission |
| `damage_tier` | Text | Exact UNDP 3-tier wording |
| `infra_type` | Text | One of 8 UNDP categories + Other |
| `infra_name` | Text | Free text |
| `crisis_type` | Text | Natural / Technological / Human-made |
| `crisis_subtype` | Text | Earthquake, Flood, Conflict, etc. |
| `lat` | Float | May be fuzzed ±100m |
| `lng` | Float | May be fuzzed ±100m |
| `location_text` | Text | Landmark-based fallback |
| `debris` | Boolean | Yes / No |
| `electricity` | Text | Exact UNDP wording (6 options) |
| `health_services` | Text | Exact UNDP wording (5 options) |
| `pressing_needs` | Text[] | Array, all UNDP options |
| `photo_hash` | Text | SHA-256 of stripped photo |
| `photo_b64` | Text | EXIF-stripped base64 (nullable if storage used) |
| `dci_score` | Float | 0.0–1.0 composite |
| `pes_eff` | Float | Photo evidence sub-score |
| `cor_score` | Float | Corroboration sub-score |
| `tfr_score` | Float | Temporal freshness sub-score |
| `cci_score` | Float | Classification consistency sub-score |
| `synced` | Boolean | False until confirmed sync to Supabase |
| `crisis_id` | Text | For multi-crisis partitioning (optional) |

Full schema: [`supabase/schema.sql`](../supabase/schema.sql)

---

## Multi-Crisis Architecture

UNDP deploys across hundreds of crises per year. Two strategies are supported:

**Strategy 1 — Isolated projects (recommended for large crises)**
Each major crisis gets its own Supabase project with its own URL and anon key. The deployment coordinator updates `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON` before distributing the QR code. Data is fully isolated. Projects are archived after the active response window closes.

**Strategy 2 — Shared instance with `crisis_id` partitioning**
A single Supabase project handles multiple concurrent crises. Each report includes a `crisis_id` field (e.g., `"earthquake-turkey-2026-04"`). Responder dashboard queries filter by `crisis_id`. Suitable for medium-scale events or sustained monitoring operations.

---

## Storage Strategy for Photos

Photos are EXIF-stripped and stored as base64 in IndexedDB locally. For Supabase sync, two options:

**Option A — Base64 in the reports table (current default)**
Simple. Works at small to medium scale. At 500,000 reports with average 50KB photo, storage requirement is ~25GB — within Pro tier limits.

**Option B — Supabase Storage bucket (recommended for national scale)**
Photos stored as objects in a Supabase Storage bucket. The `reports` table stores only the storage path and `photo_hash`. Reduces row size significantly and enables CDN delivery. Row-level security on the bucket mirrors the reports table policy.

---

## Read Performance at Scale

At 500,000 reports, three optimizations keep the responder dashboard responsive:

1. **Geospatial index** on `(lat, lng)` — map queries by bounding box return in milliseconds.
2. **DCI index** on `dci_score` — confidence filtering (High/Watch/Review) runs on indexed column.
3. **Timestamp index** on `created_at` — timeline slider queries are index-only scans.

All three indexes are defined in `supabase/schema.sql`.

---

## Row-Level Security

Supabase RLS enforces the access model at the database layer:

- **Anonymous writes** — any request with the anon key can INSERT a new report. No read access on insert.
- **Authenticated reads** — the responder access code resolves to a Supabase role with SELECT access. Reports are never readable by the submitting client after submission.
- **No updates or deletes** — reporters cannot modify submitted reports. Versioning is additive only; newer reports supersede older ones by timestamp, not by overwrite.

---

## Offline-to-Online Sync

Reports submitted offline are held in IndexedDB with `synced: false`. When connectivity returns, the background sync service worker (`sync` event tag: `veritas-sync-reports`) reads all unsynced reports and POSTs each to Supabase via the REST API. On success, the report is marked `synced: true` in IndexedDB. On failure, the browser retries automatically on the next sync event.

The sync queue is unbounded — reports submitted during extended outages (days, not hours) will sync correctly when connectivity returns.

---

## Upgrade Path

| Trigger | Action |
|---|---|
| Free tier storage approaching 500MB | Upgrade to Supabase Pro ($25/month) |
| Response time degrading above 250k reports | Add read replica in same region |
| Multi-crisis concurrent load | Enable `crisis_id` partitioning or spin new project |
| Photo storage approaching 25GB | Migrate to Supabase Storage bucket (Option B) |
| UNDP enterprise deployment | Migrate to self-hosted Supabase on dedicated infrastructure |

Self-hosted Supabase is open source and runs on any PostgreSQL-capable server. Migration is a schema export and import — no application code changes required.

---

*Scale architecture designed by Sheldon K. Salmon · AionSystem · April 2026*
*VERITAS v1.1.0 · CERTUS Engine v1.0*
