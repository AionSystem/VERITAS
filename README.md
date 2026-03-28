# VERITAS — Community Damage Certification Platform

![License](https://img.shields.io/github/license/AionSystem/VERITAS?color=blue)
![Version](https://img.shields.io/badge/version-v1.0-orange)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)
![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)

> **Certainty engineering dressed as a crisis tool**  
> *UNDP Accelerator Lab Prize — April 8 Webinar*

VERITAS is a community‑operated damage certification platform for sudden‑onset crises.  
It collects reports **offline & online**, scores the **epistemic confidence** of each report using the **CERTUS Engine**, and delivers **confidence‑weighted exports** to responders within the critical 48‑hour window.

**Live Demo:** [veritas.aionsystem.com](https://veritas.aionsystem.com) *(available April 6)*  
**2‑Minute Video:** [Watch on YouTube](https://youtu.be/...)

---

## The Problem UNDP Named (But Didn’t Solve)

> *“In the initial hours after a crisis, responders are often working with incomplete information.”*

Incomplete is the polite word. The real problem is **conflicting information they cannot trust**.  
Two reports at the same address — one says total collapse, one says minor damage. Which one moves the truck?

That’s not a data collection problem.  
That’s a **certainty engineering problem**.

---

## What Others Build (Data Collection)

Most crisis apps collect photos, classify damage, and put pins on a map.  
That’s useful — but it leaves the responder with the impossible job of sorting trustworthy signals from noise.

---

## What VERITAS Builds (Certainty Infrastructure)

VERITAS does all of the above **and** attaches a **Damage Confidence Index (DCI)** to every report — a score from 0.0 to 1.0 that tells responders exactly how much to trust that report, *before* they act on it.

**The CERTUS Engine** scores each submission across four dimensions:

- **Photo Evidence Score** — AI analysis (offline‑capable TensorFlow.js) with a confidence gate.
- **Corroboration Score** — agreement with other reports within 50 meters.
- **Temporal Freshness** — decays over 48 hours.
- **Classification Consistency** — cross‑category logic checks.

**Output:**  
`DCI ≥ 0.70` → **HIGH CONFIDENCE** (green pin)  
`DCI 0.40–0.69` → **WATCH** (amber pin)  
`DCI < 0.40` → **REVIEW REQUIRED** (red pin – human verification required)

---

## How CERTUS Works (One‑Page Overview)

📷 **Photo Evidence** – Client‑side TensorFlow.js model trained on the xBD dataset (850k building polygons, 19 disasters).  
🤝 **Corroboration** – Neutral (0.50) for first report; increases with agreement; penalised for contradictions.  
⏱️ **Freshness** – Linear decay from 1.0 at submission to 0.0 at 48 hours.  
🔍 **Consistency** – Checks that “Total Collapse” on a Road is flagged as suspicious (CCI reduced).

Full formula and thresholds are documented in [`docs/dci-formula.md`](docs/dci-formula.md).

---

## Technical Stack

| Layer               | Technology                             | Why |
|---------------------|----------------------------------------|-----|
| **App Shell**       | PWA (single HTML + Service Worker)     | Offline‑first, installable |
| **Local Storage**   | IndexedDB                              | Survives offline, syncs when back |
| **Maps**            | Leaflet.js + OpenStreetMap / satellite | Free, open source, offline tiles |
| **AI Analysis**     | TensorFlow.js + MobileNet v2 (xBD)     | Client‑side, disaster‑trained |
| **Backend Sync**    | Supabase (free tier)                   | Real‑time, row‑level security |
| **Deployment**      | Vercel (free tier)                     | Public URL, zero cost |
| **License**         | MIT                                    | Open source, UNDP requirement |

---

## Two Interfaces

### `/report` — Community Submission (Mobile‑First)
- Works offline (IndexedDB + Service Worker)
- Photo capture (EXIF stripped automatically)
- 5‑tier damage classification: None / Minor / Moderate / Major / Total Collapse
- Infrastructure type: Residential / Road / Bridge / Utility / Medical / School
- GPS (precise or fuzzy ±100m for conflict zones)
- Anonymous submission (UUID only, no IP logged)
- Confirmation screen shows **DCI score** with a one‑sentence explanation

### `/respond` — Responder Dashboard (Access‑Code Gated)
- Confidence map with color‑coded pins (green / amber / red)
- Live confidence dashboard (High / Watch / Review counts)
- Conflict flags (contradicting reports at same location)
- Timeline slider — replay the first 48 hours
- One‑click export: JSON, CSV, GeoJSON with integrity hash
- **DCI Report Card** — confidence distribution across the dataset
- Offline fallback: cached snapshot when Supabase is unreachable

---

## Export Integrity Header

Every export includes a verifiable SHA‑256 hash:

```text
VERITAS INTEGRITY EXPORT
Generated: 2026-04-06T14:00:00Z
Reports: 147
Powered by: CERTUS Engine v1.0
SHA-256: a3f1c2b8e9d7...
```

hash(payload) === SHA-256 proves the dataset has not been altered.

---

Anonymization & Safety

· No accounts, no emails, no IP logging – UUID generated client‑side.
· EXIF stripped from photos before upload (Canvas API).
· GPS fuzzing – community reporters can choose “Area Report (±100m)” for conflict zones.
· Supabase edge function removes any residual IP headers.

Full protocol: docs/anonymization.md

---

Roadmap

v1.0 (Current – April 2026)

· Offline‑first PWA
· CERTUS Engine with DCI scoring
· Responder dashboard with conflict flags
· Integrity‑verified exports

v2.0 (Planned)

· Satellite imagery overlay for corroboration
· Adaptive model retraining from field feedback
· API endpoint for third‑party integration
· Multi‑language support (Spanish, French, Arabic)

---

Installation & Deployment

1. Clone the repo
   ```bash
   git clone https://github.com/AionSystem/VERITAS.git
   cd VERITAS
   ```
2. Configure Supabase (optional)
   · Create a free Supabase project.
   · Run supabase/schema.sql to create the reports table.
   · In index.html, set:
     ```javascript
     const CONFIG = {
       SUPABASE_URL: 'https://your-project.supabase.co',
       SUPABASE_ANON: 'your-anon-key',
       ACCESS_CODE: 'UNDP2026',   // change this!
       USE_SUPABASE: true,
     };
     ```
3. Deploy to Vercel
   · Push to GitHub.
   · Import project on Vercel.
   · Add the environment variable ACCESS_CODE if desired.
4. Test offline
   · Open the app, go offline, submit a report.
   · Come back online – report syncs automatically.

---

License

MIT © 2026 Sheldon K. Salmon, AionSystem
See LICENSE for full text.

---

Acknowledgments

· xBD Dataset (MIT licensed) – disaster building damage assessment.
· TensorFlow.js – client‑side AI.
· Leaflet.js – maps.
· Supabase – backend sync.

“The code is open source. The architecture is not replicable.”
This is an application of the AION Constitutional Stack (FSVE certainty scoring, ECF tagging, validity thresholds) applied to community crisis data.
