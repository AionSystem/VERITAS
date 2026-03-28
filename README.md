VERITAS — Community Damage Certification Platform

https://img.shields.io/github/license/AionSystem/VERITAS?color=blue
https://img.shields.io/badge/version-v1.0-orange
https://img.shields.io/badge/build-passing-brightgreen
https://img.shields.io/badge/PRs-welcome-brightgreen
https://img.shields.io/badge/Made%20with-JavaScript-yellow

Certainty engineering dressed as a crisis tool
UNDP Accelerator Lab Prize — April 8 Webinar

---

Architect’s Note on AI Use

This submission was designed, architected, and directed by Sheldon K. Salmon. AI tools (including large language models) were used as instruments — the same way a carpenter uses a saw. The intellectual core — the CERTUS Engine, the Damage Confidence Index, the four scoring dimensions, the validity thresholds, the STP integration, and the overall architectural vision — is wholly human‑originated and manually refined through six rounds of the ADA Red‑Team methodology.

UNDP explicitly noted that “submissions produced solely with generative AI are not of interest.” VERITAS is not a generative AI output; it is a human‑built system where AI serves as one of several tools (like TensorFlow.js for image analysis) under strict human oversight. Every line of code, every design decision, and every formula in the CERTUS Engine reflects human intent, verified through red‑team testing and iterative refinement.

---

VERITAS is a community‑operated damage certification platform for sudden‑onset crises.
It collects reports offline & online, scores the epistemic confidence of each report using the CERTUS Engine, and delivers confidence‑weighted exports to responders within the critical 48‑hour window.

Live Demo: veritas.aionsystem.com (available April 6)
2‑Minute Video: Watch on YouTube

---

The Problem UNDP Named (But Didn’t Solve)

“In the initial hours after a crisis, responders are often working with incomplete information.”

Incomplete is the polite word. The real problem is conflicting information they cannot trust.
Two reports at the same address — one says total collapse, one says minor damage. Which one moves the truck?

That’s not a data collection problem.
That’s a certainty engineering problem.

---

What Others Build (Data Collection)

Most crisis apps collect photos, classify damage, and put pins on a map.
That’s useful — but it leaves the responder with the impossible job of sorting trustworthy signals from noise.

---

What VERITAS Builds (Certainty Infrastructure)

VERITAS does all of the above and attaches a Damage Confidence Index (DCI) to every report — a score from 0.0 to 1.0 that tells responders exactly how much to trust that report, before they act on it.

The CERTUS Engine scores each submission across four dimensions:

· Photo Evidence Score — AI analysis (offline‑capable TensorFlow.js) with a confidence gate.
· Corroboration Score — agreement with other reports within 50 meters.
· Temporal Freshness — decays over 48 hours.
· Classification Consistency — cross‑category logic checks.

Output:
DCI ≥ 0.70 → HIGH CONFIDENCE (green pin)
DCI 0.40–0.69 → WATCH (amber pin)
DCI < 0.40 → REVIEW REQUIRED (red pin – human verification required)

---

How CERTUS Works (One‑Page Overview)

📷 Photo Evidence – Client‑side TensorFlow.js model trained on the xBD dataset (850k building polygons, 19 disasters).
🤝 Corroboration – Neutral (0.50) for first report; increases with agreement; penalised for contradictions.
⏱️ Freshness – Linear decay from 1.0 at submission to 0.0 at 48 hours.
🔍 Consistency – Checks that “Total Collapse” on a Road is flagged as suspicious (CCI reduced).

Full formula and thresholds are documented in docs/dci-formula.md.

---

The VERITAS Ecosystem

VERITAS is the flagship of a three‑tool suite designed for end‑to‑end crisis data integrity:

Tool Purpose Link
VERITAS Community damage reporting + DCI scoring /
AION.CERTIFY Immutable sealing of any crisis record /certify.html
CERTUS.AI Resource allocation simulation /simulator.html

All three share the same design language, offline capability, and STP integration.

---

Sovereign Trace Protocol Integration

Every VERITAS dataset can be optionally sealed with the Sovereign Trace Protocol – a permanence infrastructure that stamps the data with a triple‑time cryptographic seal (Gregorian, Hebrew lunisolar, 13‑Moon Dreamspell). The SHA‑256 hash of the full dataset is bound to the seal, making the export tamper‑evident and independently verifiable using the open‑source STP code.

How it works:

1. In the responder dashboard, click STP Seal after exporting.
2. The seal is generated via the STP API, creating a permanent ledger entry in the SOVEREIGN-TRACE-PROTOCOL GitHub repository.
3. Download the STP file alongside your export to prove the dataset’s existence and integrity at a specific moment in three civilizational time systems.

---

Technical Stack

Layer Technology Why
App Shell PWA (single HTML + Service Worker) Offline‑first, installable
Local Storage IndexedDB Survives offline, syncs when back
Maps Leaflet.js + OpenStreetMap / satellite Free, open source, offline tiles
AI Analysis TensorFlow.js + MobileNet v2 (xBD) Client‑side, disaster‑trained
Backend Sync Supabase (free tier) Real‑time, row‑level security
Deployment GitHub Pages Zero cost, static hosting
License MIT Open source, UNDP requirement

---

Two Interfaces

/report — Community Submission (Mobile‑First)

· Works offline (IndexedDB + Service Worker)
· Photo capture (EXIF stripped automatically)
· UNDP 3‑tier damage classification: Minimal/No damage, Partially damaged, Completely damaged
· Infrastructure type: Residential / Road / Bridge / Utility / Medical / School
· GPS (precise or fuzzy ±100m for conflict zones)
· Anonymous submission (UUID only, no IP logged)
· Additional required fields: crisis type (with dynamic subtypes), debris clearing, electricity condition, health services status, most pressing needs
· Confirmation screen shows DCI score with a one‑sentence explanation and engagement message (corroboration count)

/respond — Responder Dashboard (Access‑Code Gated)

· Confidence map with color‑coded pins (green / amber / red)
· Live confidence dashboard (High / Watch / Review counts)
· Conflict flags (contradicting reports at same location)
· Timeline slider — replay the first 48 hours
· One‑click export: JSON, CSV, GeoJSON with integrity hash
· DCI Report Card — confidence distribution across the dataset
· Offline fallback: cached snapshot when Supabase is unreachable

---

Export Integrity Header

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
· Six UN languages (English, Arabic, Chinese, French, Russian, Spanish)
· Full UNDP Appendix 1 fields
· Non‑monetary engagement incentives

v2.0 (Planned)

· Satellite imagery overlay for corroboration
· Adaptive model retraining from field feedback
· API endpoint for third‑party integration
· Multi‑language support for dynamic elements

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
3. Deploy to GitHub Pages
   · Push to GitHub.
   · Go to repository Settings → Pages → set source to main and root folder.
   · Your site will be live at https://yourusername.github.io/VERITAS/.
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