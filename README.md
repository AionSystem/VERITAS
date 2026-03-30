![1000008409](https://github.com/user-attachments/assets/38eb9c0c-4591-4d31-987e-db14f8dbfe51)

# VERITAS — Community Damage Certification Platform

[![ORCID — Sheldon K. Salmon](https://img.shields.io/badge/ORCID-0009--0005--8057--5115-a6ce39?style=flat&logo=orcid&logoColor=white)](https://orcid.org/0009-0005-8057-5115)
[![DOI](https://zenodo.org/badge/1194238160.svg)](https://doi.org/10.5281/zenodo.19295266)
[![STP](https://img.shields.io/badge/STP-Integrated-2E7D32?style=flat-square&logo=git&logoColor=white)](https://github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL)
[![Seal](https://img.shields.io/badge/Seal-SHA--256%20Bound-4527A0?style=flat-square&logo=hashnode&logoColor=white)](https://github.com/AionSystem/VERITAS)
[![Status](https://img.shields.io/badge/STATUS-Production-1976D2?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![License](https://img.shields.io/github/license/AionSystem/VERITAS?color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v2.5.0-orange)](#)
[![CERTUS Engine](https://img.shields.io/badge/CERTUS-v2.5-4ade80?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Claude_3.5_Sonnet_+_DeepSeek-4285F4?style=flat-square)](https://openrouter.ai)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Feedback Welcome](https://img.shields.io/badge/Feedback-welcome-brightgreen)](https://github.com/AionSystem/VERITAS/issues/new/choose)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)](#)
[![Made with HTML](https://img.shields.io/badge/Made%20with-HTML-red)](#)
[![Made with TensorFlow.js](https://img.shields.io/badge/Made%20with-TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white)](#)

> **Certainty engineering dressed as a crisis tool**
> UNDP Accelerator Lab Prize — April 8 Webinar

---

## Architect's Note on AI Use

This submission was designed, architected, and directed by Sheldon K. Salmon. AI tools (including large language models) were used as instruments — the same way a carpenter uses a saw. The intellectual core — the CERTUS Engine, the Damage Confidence Index, the four scoring dimensions, the validity thresholds, the STP integration, and the overall architectural vision — is wholly human‑originated.

UNDP explicitly noted that "submissions produced solely with generative AI are not of interest." VERITAS is not a generative AI output; it is a human‑built system where AI serves as one of several tools (OpenRouter for photo analysis, TensorFlow.js for offline capability) under strict human oversight. Every line of code, every design decision, and every formula in the CERTUS Engine reflects human intent.

---

## Quick Start

Get VERITAS running on your machine in under a minute.

```bash
git clone https://github.com/AionSystem/VERITAS.git
cd VERITAS
```

Then simply open public/index.html in your browser.

For offline features (Service Worker, IndexedDB) to work, you may need to serve the files through a local web server:

```bash
# Using Python
cd public
python3 -m http.server 8000
# Then visit http://localhost:8000
```

That's it. You can now submit reports, explore the responder dashboard (access code: UNDP2026), and test the entire platform.

For full Supabase sync and deployment, see Installation & Deployment.

---

Repository Structure

```
VERITAS/
├── public/                         ← All static frontend assets
│   ├── index.html                  ← Main VERITAS interface
│   ├── certus-engine-v2.5.js       ← CERTUS Engine (scoring logic)
│   ├── ai-analysis.js              ← OpenRouter AI integration (Claude + DeepSeek)
│   ├── manifest.json               ← PWA manifest
│   ├── sw.js                       ← Service Worker (offline capability)
│   ├── aion-certify/               ← STP seal tool (permanent record)
│   │   └── index.html
│   ├── certus-ai/                  ← Resource allocation simulator
│   │   └── index.html
│   └── icons/                      ← App icons for PWA
│
├── api/                            ← Vercel serverless functions
│   ├── sync.js                     ← Supabase sync endpoint
│   ├── reports.js                  ← Reports API
│   └── stp-seal.js                 ← STP seal service (GitHub ledger)
│
├── supabase/                       ← Database schema
│   └── schema.sql
│
├── docs/                           ← Documentation
│   ├── scale.md
│   ├── anonymization.md
│   └── dci-formula.md              ← CERTUS Engine formula documentation
│
├── model/                          ← TensorFlow.js model files (offline AI)
│   └── xbd-model/                  ← xBD disaster damage model
│
├── CERTUS.md                       ← CERTUS Engine v2.5 documentation
├── TEST_SUITE_VERITAS.md           ← Test suite documentation
├── VERITAS_UNDP_COMPLIANCE.md      ← Full UNDP compliance audit
├── VERITAS-PROPOSAL.md             ← UNDP submission proposal
├── LICENSE                         ← MIT License
└── README.md                       ← This file
```

---

Overview

Most crisis tools stop at the data. They collect, they pin, they export — and then they hand a responder a map full of pins with no way to know which ones to trust.

VERITAS is a community‑operated damage certification platform for sudden‑onset crises. It collects reports offline and online, scores the epistemic confidence of each report using the CERTUS Engine, and delivers confidence‑weighted exports to responders within the critical 48‑hour window. The difference isn't more data. It's data that tells you exactly how much it's worth.

· Live Demo: aionsystem.github.io/VERITAS (available April 6)
· 2‑Minute Video: Watch on YouTube

---

The CERTUS Engine

The CERTUS Engine is the core of VERITAS — an epistemic scoring system that tells responders how much to trust each report.

Scoring Dimensions

Dimension Weight Description
Photo Evidence Score (PES) 35% AI analysis via OpenRouter (Claude/DeepSeek) with confidence gate
Corroboration Score (COR) 30% Agreement with other reports within 50m
Temporal Freshness (TFR) 20% Linear decay over 48 hours
Classification Consistency (CCI) 15% Cross-category logic checks

Output

DCI Range Validity Status Pin Action
≥ 0.70 VALID 🟢 Green Deploy resources
0.40–0.69 DEGRADED 🟡 Amber Verify locally before acting
< 0.40 SUSPENDED 🔴 Red Must field-verify first

Uncertainty Mass (UM)

Every DCI score carries an Uncertainty Mass (UM) — a measure of how much the score itself is uncertain:

UM Meaning
< 0.35 Score is reliable
0.35–0.60 Score useful but uncertain
0.60 Do not rely on this score

---

AI Photo Analysis — OpenRouter Integration

VERITAS uses OpenRouter to access AI models for damage assessment, with graceful fallback to ensure offline capability.

Model Configuration

Priority Model Purpose
Primary Claude 3.5 Sonnet (Anthropic) High‑accuracy damage assessment
Fallback DeepSeek Backup if primary fails or offline

How It Works

1. User captures photo → Canvas strips EXIF metadata
2. Image sent to OpenRouter API with structured prompt
3. AI returns: damage level, confidence score, description
4. CERTUS Engine uses confidence score for PES dimension
5. If API unavailable → falls back to mock analysis (offline mode)

---

UNDP Compliance Status

VERITAS meets every mandatory requirement of the UNDP Innocentive Challenge. Full audit: VERITAS_UNDP_COMPLIANCE.md

Requirement Status
Deliverable 1 – Written Proposal ✅
Deliverable 2 – Interactable Prototype ✅
Deliverable 3 – Video/Tutorial ✅
Req 1a – Frontend + 6 languages ✅
Req 1a – Map auto‑update ✅
Req 1b – Secure backend + scale ✅
Req 1c – Dashboard ✅
Req 2 – Demonstrated user journey ✅
Req 3 – Non‑monetary incentives ✅
Req 4 – Offline functionality ✅
Req 5 – Multilingual support ✅
Req 6 – Building footprint grid ✅
Req 6 – Text location fallback ✅
Req 7 – Secure data handling ✅
Damage Classification Schema ✅
Core Indicators (4 items) ✅
Infrastructure Type (8 categories + Other) ✅
Nature of Crisis (with subtypes) ✅
Debris Clearing ✅
Electricity Condition ✅
Health Services Functioning ✅
Most Pressing Needs ✅
Versioning – Multiple reports ✅
Export Formats (CSV, GeoJSON, Shapefile, REST) ✅
Modular Architecture ✅
AI‑powered features ✅
Open Source ✅

---

The VERITAS Ecosystem

VERITAS is the field instrument in a three‑tool suite built for end‑to‑end crisis data integrity:

Tool Purpose Location
VERITAS Community damage reporting + DCI scoring /public/index.html
AION.CERTIFY Immutable sealing of any crisis record /public/aion-certify/
CERTUS.AI Resource allocation simulation /public/certus-ai/

All three share the same design language, offline capability, and STP integration.

---

Sovereign Trace Protocol Integration

Every VERITAS dataset can be optionally sealed with the Sovereign Trace Protocol — a permanence infrastructure that stamps the data with a triple‑time cryptographic seal (Gregorian, Hebrew lunisolar, 13‑Moon Dreamspell). The SHA‑256 hash of the full dataset is bound to the seal, making the export tamper‑evident and independently verifiable.

How It Works

1. In the responder dashboard, click STP Seal after exporting
2. The seal is generated via the STP API (/api/stp-seal.js)
3. Creates permanent ledger entry in the STP GitHub repository
4. Download the STP file alongside your export to prove dataset integrity

---

Technical Stack

Layer Technology Why
App Shell PWA (HTML + Service Worker) Offline‑first, installable
Local Storage IndexedDB Survives offline, syncs when back
Maps Leaflet.js + OpenStreetMap Free, open source, offline tiles
AI Analysis OpenRouter (Claude 3.5 + DeepSeek) High accuracy, multiple models
Offline AI TensorFlow.js + xBD model Local inference when offline
Backend Sync Supabase Real‑time, row‑level security
Deployment Vercel + GitHub Pages Static hosting, serverless functions
License MIT Open source, UNDP requirement

---

Two Interfaces

/report — Community Submission (Mobile‑First)

· Works offline (IndexedDB + Service Worker)
· Photo capture (EXIF stripped automatically)
· UNDP 3‑tier damage classification
· All 8 infrastructure types + Other
· GPS (precise or fuzzy ±100m for conflict zones)
· Anonymous submission (UUID only, no IP logged)
· AI‑assisted damage detection (OpenRouter)
· Confirmation screen shows DCI + UM + validity status

/respond — Responder Dashboard (Access‑Code Gated)

· Confidence map with color‑coded pins
· Real‑time updates via Supabase subscription
· Versioned reports — only the latest per location
· Live confidence dashboard with DCI distribution
· Conflict flags (contradicting reports)
· Timeline slider — replay the first 48 hours
· One‑click export: JSON, CSV, GeoJSON, Shapefile with integrity hash
· DCI Report Card with uncertainty breakdown
· STP seal integration for permanent records

---

Anonymization & Safety

· No accounts, no emails, no IP logging — UUID generated client‑side
· EXIF stripped from photos before upload (Canvas API)
· GPS fuzzing — "Area Report (±100m)" for conflict zones
· Sensitive location anonymization (shelters, medical, schools)
· Data retention policy — 365 days, community opt‑out
· Indigenous data sovereignty — UNDRIP Article 31 compliant

---

Installation & Deployment

1. Clone the repo

```bash
git clone https://github.com/AionSystem/VERITAS.git
cd VERITAS
```

2. Configure OpenRouter (for AI analysis)

· Sign up at openrouter.ai
· Get your API key
· On first use, the app will prompt for the key (stored locally)

3. Configure Supabase (optional)

· Create a free Supabase project
· Run supabase/schema.sql to create the reports table
· In public/index.html, set USE_SUPABASE: true

4. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

5. Deploy STP service (separate project)

The STP seal service runs independently:

```bash
cd ../stp-seal-service
vercel --prod
```

---

License

MIT © 2026 Sheldon K. Salmon, AionSystem
See LICENSE for full text.

---

Acknowledgments

· xBD Dataset — disaster building damage assessment
· TensorFlow.js — client‑side AI
· OpenRouter — unified AI API
· Leaflet.js — maps
· Supabase — backend sync
· Claude 3.5 Sonnet — primary damage assessment
· DeepSeek — fallback AI model

---

"The code is open source. The architecture is not replicable."

This is an application of the AION Constitutional Stack — applied to community crisis data. The method travels. The judgment behind it doesn't.

CERTUS Engine v2.5 — Ready for UNDP evaluation.