![image-20](https://github.com/user-attachments/assets/d5fa7d01-8dce-469d-930b-54cd3ec0e5de)


# VERITAS — Community Damage Certification Platform

<!-- STATUS · VERSION · COMPLIANCE -->
[![Status](https://img.shields.io/badge/STATUS-Production-1976D2?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![Version](https://img.shields.io/badge/version-v2.5.1-orange)](#)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Commercial License](https://img.shields.io/badge/Commercial-License%20Available-orange)](COMMERCIAL-LICENSE.md)
[![ORCID — Sheldon K. Salmon](https://img.shields.io/badge/ORCID-0009--0005--8057--5115-a6ce39?style=flat&logo=orcid&logoColor=white)](https://orcid.org/0009-0005-8057-5115)
[![DOI](https://zenodo.org/badge/1194238160.svg)](https://doi.org/10.5281/zenodo.19295266)
[![DOI](https://zenodo.org/badge/1198800128.svg)](https://doi.org/10.5281/zenodo.19373724)

<!-- CORE ARCHITECTURE -->
[![CERTUS Engine](https://img.shields.io/badge/CERTUS-v2.5-4ade80?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![STP](https://img.shields.io/badge/STP-Integrated-2E7D32?style=flat-square&logo=git&logoColor=white)](https://github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL)
[![STP Templates](https://img.shields.io/badge/STP-16_Templates-2E7D32?style=flat-square)](https://github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL)
[![Seal](https://img.shields.io/badge/Seal-SHA--256%20Bound-4527A0?style=flat-square&logo=hashnode&logoColor=white)](https://github.com/AionSystem/VERITAS)

<!-- TECH STACK -->
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Claude_3.5_Sonnet_+_DeepSeek-4285F4?style=flat-square)](https://openrouter.ai)
[![Made with TensorFlow.js](https://img.shields.io/badge/Made%20with-TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white)](#)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)](#)
[![Made with HTML](https://img.shields.io/badge/Made%20with-HTML-red)](#)
[![Feedback Welcome](https://img.shields.io/badge/Feedback-welcome-brightgreen)](https://github.com/AionSystem/VERITAS/issues/new/choose)

> **Certainty engineering dressed as a crisis tool**
> UNDP Accelerator Lab Prize — April 8 Webinar

---

## Table of Contents

- [Architect's Note on AI Use](#architects-note-on-ai-use)
- [Quick Start](#quick-start)
- [Repository Structure](#repository-structure)
- [STP Template Registry](#stp-template-registry-16-templates)
- [Overview](#overview)
- [The CERTUS Engine](#the-certus-engine)
- [AI Photo Analysis](#ai-photo-analysis--openrouter-integration)
- [UNDP Compliance Status](#undp-compliance-status)
- [The VERITAS Ecosystem](#the-veritas-ecosystem)
- [Sovereign Trace Protocol Integration](#sovereign-trace-protocol-integration)
- [Technical Stack](#technical-stack)
- [Three Core Features](#three-core-features)
- [Anonymization & Safety](#anonymization--safety)
- [Installation & Deployment](#installation--deployment)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Architect's Note on AI Use

This submission was designed, architected, and directed by Sheldon K. Salmon. AI tools (including large language models) were used as instruments — the same way a carpenter uses a saw. The intellectual core — the CERTUS Engine, the Damage Confidence Index, the four scoring dimensions, the validity thresholds, the STP integration, and the overall architectural vision — is wholly human‑originated.

UNDP explicitly noted that "submissions produced solely with generative AI are not of interest." VERITAS is not a generative AI output; it is a human‑built system where AI serves as one of several tools (OpenRouter for photo analysis, TensorFlow.js for offline capability) under strict human oversight. Every line of code, every design decision, and every formula in the CERTUS Engine reflects human intent.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## Quick Start

Get the VERITAS frontend running in under a minute.

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

Note: This starts the frontend only. The api/ serverless functions (Supabase sync, STP seal service) are separate Vercel deployments and will not be active in local mode. All core CERTUS scoring and offline report submission work without them.

That's it. You can now submit reports, explore the responder dashboard, and test the entire platform.

Responder Dashboard Access Code

```
UNDP2026
```

For full Supabase sync and deployment, see Installation & Deployment.

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Repository Structure

Key files for evaluators: public/certus-engine-v2.5.js (scoring logic) · public/index.html (full platform) · CERTUS.md (engine documentation) · VERITAS_UNDP_COMPLIANCE.md (full compliance audit) · docs/dci-formula.md (DCI formula derivation)

```
VERITAS/
├── public/                         ← All static frontend assets
│   ├── index.html                  ← Main VERITAS interface
│   ├── certus-engine-v2.5.js       ← CERTUS Engine (scoring logic)
│   ├── ai-analysis.js              ← OpenRouter AI integration (Claude + DeepSeek)
│   ├── manifest.json               ← PWA manifest
│   ├── sw.js                       ← Service Worker (offline capability)
│   └── icons/                      ← App icons for PWA
│
├── api/                            ← Vercel serverless functions (separate deployment)
│   ├── sync.js                     ← Supabase sync endpoint
│   ├── reports.js                  ← Reports API
│   ├── stp-seal.js                 ← STP seal service (GitHub ledger)
│   └── templates/                  ← STP template registry (16 templates)
│       ├── index.js                ← Template loader & detector
│       ├── 01-ai-failure.json      ← AI Failure (DocuSign, Identity)
│       ├── 02-research-priority.json ← Research Priority
│       ├── 03-evidence-chain.json  ← Evidence Chain
│       ├── 04-creative-priority.json ← Creative Priority
│       ├── 05-clinical-record.json ← Clinical Record (PHI Gate)
│       ├── 06-scope-anchor.json    ← Scope Anchor
│       ├── 07-general-trace.json   ← General Trace (default)
│       ├── 08-foresight-seal.json  ← Foresight Seal
│       ├── 09-webeater-link.json   ← Webeater Link (prior seal req)
│       ├── 10-audit-request.json   ← Audit Request (Stripe)
│       ├── 11-audit-completion.json ← Audit Completion (badge req)
│       ├── 12-auditor-application.json ← Auditor Application
│       ├── 13-integrity-violation.json ← Integrity Violation
│       ├── 14-near-miss.json       ← Near Miss
│       ├── 15-veritas-report.json  ← VERITAS Report Seal (auto)
│       └── 16-veritas-export.json  ← VERITAS Export Seal
│
├── supabase/                       ← Database schema
│   └── schema.sql
│
├── docs/                           ← Documentation
│   ├── scale.md
│   ├── anonymization.md
│   ├── architecture.md
│   └── dci-formula.md              ← CERTUS Engine formula documentation
│
├── model/                          ← TensorFlow.js model files (offline AI)
│   └── xbd-model/                  ← xBD disaster damage model
│
├── CERTUS.md                       ← CERTUS Engine v2.5 documentation
├── NOTICE
├── COMMERCIAL-LICENSE.md
├── TEST_SUITE_VERITAS.md           ← Test suite documentation
├── VERITAS_UNDP_COMPLIANCE.md      ← Full UNDP compliance audit
├── VERITAS-PROPOSAL.md             ← UNDP submission proposal
├── LICENSE                         ← GPL-3.0
└── README.md                       ← This file
```

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

STP Template Registry (16 Templates)

The Sovereign Trace Protocol integrates 16 permanent seal templates for different use cases:

ID Template Requirements Use Case
01 AI Failure DocuSign, Identity Report AI system failures before remediation
02 Research Priority None Seal hypotheses before results are known
03 Evidence Chain None Chain of custody for documents
04 Creative Priority None Proof of authorship and priority
05 Clinical Record PHI Gate De-identified clinical incident records
06 Scope Anchor None Lock agreed scope before work begins
07 General Trace None Default — seal any observation
08 Foresight Seal None Dated professional predictions
09 Webeater Link Prior Seal Cryptographic links between seals
10 Audit Request Stripe Paid AI output audits
11 Audit Completion Auditor Badge File completed audits to ledger
12 Auditor Application None Apply for STP Certified Auditor badge
13 Integrity Violation None Report bribery, coercion, badge misuse
14 Near Miss None AI near-miss before internal review
15 VERITAS Report Auto Every community damage report
16 VERITAS Export Manual Dataset integrity verification

Templates 01–14 are manual submissions via GitHub issues.
Templates 15–16 are integrated with VERITAS for automatic or one-click sealing.

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Overview

Most crisis tools stop at the data. They collect, they pin, they export — and then they hand a responder a map full of pins with no way to know which ones to trust.

VERITAS is a community‑operated platform for sudden‑onset crises that combines damage certification with life‑saving rescue coordination. It collects reports offline and online, scores epistemic confidence using the CERTUS Engine, and delivers confidence‑weighted intelligence to responders within the critical 48‑hour window. The difference isn't more data — it's data that tells you exactly how much it's worth, and a direct channel for those who need rescue.

How it works — three steps:

1. A community member submits a damage report or rescue signal from any device, online or offline. The CERTUS Engine scores it instantly.
2. A responder opens the dashboard and sees a confidence-weighted map — green pins are actionable, red pins need field verification first. Rescue signals appear with critical priority.
3. Every report, every rescue signal, and every export is permanently sealed with a cryptographic timestamp. The data chain is verifiable end-to-end.

· Live Demo: aionsystem.github.io/VERITAS
· 2‑Minute Video: Watch on YouTube

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

The CERTUS Engine

The CERTUS Engine is the core of VERITAS — an epistemic scoring system that tells responders how much to trust each report.

Scoring Dimensions

Dimension Weight Description
Photo Evidence Score (PES) 35% AI analysis via OpenRouter (Claude/DeepSeek) with confidence gate
Corroboration Score (COR) 30% Agreement with other reports within 50m
Temporal Freshness (TFR) 20% Linear decay over 48 hours
Classification Consistency (CCI) 15% Cross-category logic checks

Weight rationale: PES and COR carry the highest weight because they are the two externally-verifiable dimensions — photo evidence can be independently assessed, corroboration requires independent reporters agreeing. TFR and CCI are internally-derived signals and are weighted accordingly. Full derivation: docs/dci-formula.md

DCI Formula (compressed):

```
DCI = (PES × 0.35) + (COR × 0.30) + (TFR × 0.20) + (CCI × 0.15)
UM  = 1 − min(evidence_sources / 3, 1) × (1 − score_variance)
```

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
≥ 0.60 Do not rely on this score

SUSPENDED reports (DCI < 0.40) remain visible on the responder dashboard with a red pin and a field-verify prompt. They are never silently dropped — their presence is itself information.

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

AI Photo Analysis — OpenRouter Integration

VERITAS uses OpenRouter to access state-of-the-art AI models for damage assessment, with graceful fallback to ensure offline capability.

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

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

UNDP Compliance Status

All 27 mandatory requirements met. Full audit with evidence: VERITAS_UNDP_COMPLIANCE.md

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

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

The VERITAS Ecosystem

VERITAS is a unified platform with three core capabilities built into a single interface:

Feature Purpose Access
Report Damage Community damage reporting + DCI scoring Public
I Need Rescue Emergency rescue signals with location tracking Public
Responder Dashboard Confidence-weighted map + rescue coordination Access‑code gated (UNDP2026)

All three share the same design language, offline capability, and STP integration.

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Sovereign Trace Protocol Integration

VERITAS integrates with the Sovereign Trace Protocol — a permanence infrastructure with 16 template types. Every report and every export can be permanently sealed with a triple‑time cryptographic stamp (Gregorian, Hebrew lunisolar, 13‑Moon Dreamspell).

Permanence note: Sealed records are filed as GitHub Issues on the STP ledger repository. This provides immutable timestamping within the constraints of the GitHub platform. If the STP GitHub API is unavailable at the time of submission, the seal is queued locally and filed on next successful connection — the report itself is never blocked.

How It Works

Template Trigger Result
Template 15 (VERITAS Report) Automatic after report submission Every community damage report is permanently sealed
Template 16 (VERITAS Export) Manual via "STP Seal" button Every exported dataset has verifiable integrity

Verification

Anyone can verify a sealed dataset by:

1. Recomputing the SHA-256 hash of the exported file
2. Comparing it to the hash sealed in the STP ledger
3. If they match, the dataset has not been altered since export

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Technical Stack

Layer Technology Why
App Shell PWA (HTML + Service Worker) Offline‑first, installable
Local Storage IndexedDB Survives offline, syncs when back online; unsynced reports persist indefinitely until connection restored
Maps Leaflet.js + OpenStreetMap Free, open source, offline tiles
AI Analysis OpenRouter (Claude 3.5 + DeepSeek) High accuracy, multiple models
Offline AI TensorFlow.js + xBD model Local inference when offline
Backend Sync Supabase Real‑time, row‑level security
STP Ledger GitHub Issues + API Immutable, verifiable, permanent within GitHub platform
Deployment Vercel (api/) + GitHub Pages (public/) Two separate deployments — frontend is fully functional standalone
License GPL-3.0 with Commercial option Open source for humanitarian use, commercial licenses available

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Three Core Features

📍 Report Damage — Community Submission (Mobile‑First)

For a community member in a flood zone with limited connectivity who needs to document and submit damage — without an account, without waiting for signal.

· Works offline (IndexedDB + Service Worker)
· Photo capture (EXIF stripped automatically)
· UNDP 3‑tier damage classification
· All 8 infrastructure types + Other
· GPS (precise or fuzzy ±100m for conflict zones)
· Anonymous submission (UUID only, no IP logged at application layer)
· AI‑assisted damage detection (OpenRouter)
· Confirmation screen shows DCI + UM + validity status
· Automatic STP seal (Template 15) — every report permanently recorded

🆘 I Need Rescue — Emergency Signal

For a person trapped or in immediate danger who needs to send a rescue signal — works offline, tracks last known location, and prioritizes visibility to responders.

· One‑tap emergency button
· Automatic location capture (GPS with fallback to last known)
· Photo capture of surroundings
· Works offline — queues signal for when connectivity returns
· Last known location tracking (saved every 30 seconds when app open)
· High‑visibility red pin on responder map
· Critical urgency flag in export data
· Confirmation screen with location and instructions

🗺 Responder Dashboard — Access‑Code Gated

For a coordination team member at a crisis operations desk who needs to triage incoming reports, rescue signals, and allocate field resources with confidence, not guesswork.

Access code: UNDP2026

· Confidence map with color‑coded pins (VALID/DEGRADED/SUSPENDED)
· Rescue signals highlighted with 🆘 icon and priority status
· Real‑time updates via Supabase subscription
· Versioned reports — only the latest per location
· Live confidence dashboard with DCI distribution
· Conflict flags (contradicting reports)
· Timeline slider — replay the first 48 hours
· One‑click export: JSON, CSV, GeoJSON, Shapefile with integrity hash
· DCI Report Card with uncertainty breakdown
· STP seal integration (Template 16) — one-click dataset integrity sealing

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Anonymization & Safety

· No accounts, no emails, no IP logging at the application layer — UUID generated client‑side
  Note: Infrastructure-layer providers (Vercel, Supabase) may log request metadata per their own policies. Review their privacy documentation for deployment-level considerations.
· EXIF stripped from photos before upload (Canvas API)
· GPS fuzzing — "Area Report (±100m)" for conflict zones
· Sensitive location anonymization (shelters, medical, schools)
· Data retention policy — 365 days, community opt‑out
· Indigenous data sovereignty — UNDRIP Article 31 as design principle; consultation and consent mechanisms are an active development priority

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

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

The STP seal service runs independently with 16 templates:

```bash
cd ../stp-seal-service
vercel --prod
```

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

License

VERITAS is dual-licensed:

· GNU General Public License v3.0 — for humanitarian, non-profit, academic, and open-source use
· Commercial License — for proprietary use, closed-source integration, and OEM applications

User Type License
Humanitarian / NGOs / UNDP GPL-3.0 (Free)
Academic / Research GPL-3.0 (Free)
Government Disaster Agencies GPL-3.0 (Free)
Open-source projects GPL-3.0 (Free)
Commercial (proprietary) Commercial License (Fee)

See LICENSE for GPL terms and COMMERCIAL-LICENSE.md for commercial licensing information.

For commercial licensing inquiries: aionsystem@outlook.com

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

Acknowledgments

· xBD Dataset — disaster building damage assessment
· TensorFlow.js — client‑side AI
· OpenRouter — unified AI API
· Leaflet.js — maps
· Supabase — backend sync
- GPT-4o-mini — primary damage assessment
· Claude 3.5 Sonnet — fallback AI model
· DeepSeek — fallback AI model

https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square

---

"The code is open source. The architecture is not replicable."

This is an application of the AION Constitutional Stack — applied to community crisis data and life‑saving rescue coordination. The method travels. The judgment behind it doesn't.

---

CERTUS Engine v2.5 — Ready for UNDP evaluation.
STP Template Registry — 16 permanent seal types.
VERITAS — Every report sealed. Every rescue signal prioritized. Every export verifiable.

```