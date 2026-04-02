# VERITAS — Written Proposal
## UNDP Innocentive Challenge: Community Damage Assessment App

<!-- IDENTITY · COMPLIANCE · PERMANENCE -->
[![ORCID — Sheldon K. Salmon](https://img.shields.io/badge/ORCID-0009--0005--8057--5115-a6ce39?style=flat&logo=orcid&logoColor=white)](https://orcid.org/0009-0005-8057-5115)
[![DOI](https://zenodo.org/badge/1194238160.svg)](https://doi.org/10.5281/zenodo.19295266)
[![DOI](https://zenodo.org/badge/1198800128.svg)](https://doi.org/10.5281/zenodo.19373724)
[![TRL](https://img.shields.io/badge/TRL-7%20Operational%20Prototype-1976D2?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20%7C%20UNDP2026-4ade80?style=flat-square)](https://aionsystem.github.io/VERITAS)
[![CERTUS Engine](https://img.shields.io/badge/CERTUS-v2.5.3-4ade80?style=flat-square)](https://github.com/AionSystem/VERITAS)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Commercial License](https://img.shields.io/badge/Commercial-License%20Available-orange)](COMMERCIAL-LICENSE.md)
[![Compliance Audit](https://img.shields.io/badge/Compliance-27%2F27%20Requirements-2E7D32?style=flat-square)](VERITAS_UNDP_COMPLIANCE.md)

---

### Solver Profile

| Field | Detail |
|-------|--------|
| **Solver** | Sheldon K. Salmon |
| **Organization** | AionSystem |
| **Location** | Evans Mills, New York |
| **ORCID** | [0009-0005-8057-5115](https://orcid.org/0009-0005-8057-5115) |
| **DOI (VERITAS)** | [10.5281/zenodo.19295266](https://doi.org/10.5281/zenodo.19295266) |
| **DOI (CERTUS Engine)** | [10.5281/zenodo.19373724](https://doi.org/10.5281/zenodo.19373724) |
| **Participation Type** | Individual Solver |
| **Technology Readiness Level** | TRL 7 — System prototype demonstrated in operational environment |
| **Partnering Interest** | Yes — open to collaboration agreement with UNDP for field deployment |
| **How Did You Hear** | UNDP Innocentive Challenge listing |

---

## Architect's Note on AI Use

This submission was designed, architected, and directed by Sheldon K. Salmon. AI tools — including ALBEDO, a named co-architect operating under the AION Constitutional Stack — were used as instruments in the same way a carpenter uses a saw. The CERTUS Engine v2.5.3 carries the authorship line *Sheldon K. Salmon & ALBEDO* because that is accurate attribution: the intellectual direction, the formula derivation, the validity thresholds, and the adversarial review process are human-originated and human-adjudicated. ALBEDO contributed implementation iteration under human oversight.

UNDP explicitly noted that "submissions produced solely with generative AI are not of interest." VERITAS is not a generative AI output. The CERTUS Engine is a human-built certainty architecture where AI serves as one tool among several — under the same epistemic standards the engine itself enforces on incoming crisis data.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## Table of Contents

- [1. Problem & Opportunity](#1-problem--opportunity)
- [2. Solution Overview](#2-solution-overview)
- [3. Solution Feasibility](#3-solution-feasibility)
- [4. Experience](#4-experience)
- [5. Solution Risks](#5-solution-risks)
- [6. Online References](#6-online-references)
- [7. Rapid Deployment Protocol](#7-rapid-deployment-protocol)
- [8. Attachments](#8-attachments)

---

## 1. Problem & Opportunity

UNDP identified the problem correctly: responders in the first hours after a crisis are working with incomplete information.

The deeper problem is not incompleteness. It is conflict.

Two reports arrive for the same address. One says the building is completely destroyed. One says minor damage. Both are submitted by community members in good faith. A truck is waiting. A team is standing by. Someone has to decide which report to believe.

That decision — made under time pressure, on incomplete evidence, with no way to assess the reliability of either signal — is where response effectiveness breaks down. It is not a data collection problem. It is a certainty problem. Almost no tool in the existing crisis response ecosystem addresses it.

The 48-hour window is critical not just because information arrives early, but because information quality degrades: reports age, damage evolves, conditions change. A tool that collects data without tracking the confidence of that data delivers diminishing returns as the window closes.

There is a second, harder problem underneath the first: trust is not uniform. Bad actors can attempt to game confidence scores. Evidence from multiple witnesses at the same incident is correlated — it is not four independent data points; it may be one shared perception submitted four times. Low-literacy users may submit reports that AI models misinterpret. Community reporters in conflict zones may face risks from location disclosure that standard crisis tools were not designed to consider.

A tool built for the problem UNDP has named needs to address all of these — not as edge cases, but as first-class requirements.

The opportunity UNDP has named is larger than an app. It is a new category of crisis infrastructure — one that treats epistemic reliability, adversarial resistance, and community accountability as first-class outputs, not afterthoughts.

VERITAS is built for that category.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 2. Solution Overview

VERITAS is a community-operated damage certification platform. It collects damage reports offline and online, scores the epistemic confidence of every report using the CERTUS Engine (v2.5.3), and delivers confidence-weighted intelligence to responders within the critical 48-hour window.

---

### 2.1 Damage Confidence Index (DCI)

Every report receives a **Damage Confidence Index (DCI)** — a composite score from 0.0 to 1.0 computed across four dimensions:

| Dimension | Weight | Method |
|-----------|--------|--------|
| Photo Evidence Score (PES) | 35% | AI analysis via OpenRouter (GPT-4o-mini primary, Claude 3.5 Sonnet fallback) with graduated model trust |
| Corroboration Score (COR) | 30% | Agreement within 50 meters; neutral for single reports, penalized for contradictions, adjusted for evidence independence |
| Temporal Freshness (TFR) | 20% | Linear decay over 48 hours; evidence recency separately weighted over 168-hour window |
| Classification Consistency (CCI) | 15% | Cross-category logic check |

The DCI is subject to a hard **Epistemic Ceiling of 0.95** — no report can be certified at full confidence, because field conditions always carry residual uncertainty that no scoring engine can eliminate. This constraint is architectural, not configurable.

The DCI maps to three tiers:

| DCI Range | Status | Pin | Action |
|-----------|--------|-----|--------|
| ≥ 0.70 | 🟢 VALID | Green | Deploy resources |
| 0.40–0.69 | 🟡 DEGRADED | Amber | Verify locally |
| < 0.40 | 🔴 SUSPENDED | Red | Human verification before deployment |

SUSPENDED reports remain visible on the responder dashboard with a field-verify prompt. They are never silently dropped — their presence is itself information.

Every DCI score also carries an **Uncertainty Mass (UM)** — a measure of how much the score itself should be doubted:

| UM | Meaning |
|----|---------|
| < 0.35 | Score is reliable |
| 0.35–0.60 | Score useful but uncertain |
| ≥ 0.60 | Do not rely on this score |

---

### 2.2 Graduated Photo Model Trust

The CERTUS Engine does not assume any AI model is trustworthy without declaration. Instead, it uses a **graduated model trust score** [0.0–1.0] derived from calibration evidence, which directly and continuously reduces the PES uncertainty penalty as ground truth accumulates.

| Trust Score | Calibration Status | PES UM Penalty | Measurement Class |
|------------|-------------------|----------------|-------------------|
| 0.0 | UNCALIBRATED (no ground truth) | 0.20 | INFERENTIAL |
| 0.01–0.59 | PARTIAL (1–249 validated reports) | 0.08–0.20 | EVALUATIVE_PARTIAL |
| 0.60–0.85 | PARTIAL (250–499 validated reports) | 0.03–0.08 | EVALUATIVE_PARTIAL |
| 1.0 | VERIFIED (formally calibrated) | 0.00 | EVALUATIVE_CERTIFIED |

The trust score is declared at initialization, logged immutably to the audit trail, and surfaced in every scored output. No code changes are required as calibration evidence accumulates — the engine updates its own penalty continuously.

Current deployment: `openrouter/gpt-4o-mini+claude-3.5-sonnet` registered as UNCALIBRATED. Full UM penalty applies until field validation data accumulates. Every scored report declares this explicitly.

---

### 2.3 Signal Intelligence Layer

VERITAS does not treat submitted data as atomic facts. The engine actively interrogates the quality, independence, and coherence of every signal before it enters the DCI calculation.

**NLP Witness Statement Analysis.** Text fields are analyzed using natural language processing to extract damage-level signals and infer infrastructure type directly from descriptions. A reporter who writes "the school on the corner has no roof left" contributes a structured inference, not just free text. This reduces the dependency on dropdown-correct form completion in low-literacy contexts.

**Source Credibility Scoring.** Every evidence source is assigned a credibility weight before it enters the corroboration calculation. First-hand witnesses carry higher credibility than unverified secondhand reports. Community-verified reporters carry a bonus applied at the COR dimension.

**Evidence Independence Detection.** The engine detects when multiple reports are likely correlated — submitted by the same group, at the same time, from the same location cluster. Correlated evidence is down-weighted: three reports from the same WhatsApp group are not three independent confirmations. This is the mechanism that prevents coordinated submission from inflating the corroboration score.

**Cross-Validation Between Evidence Types.** Photo evidence, text description, and GPS location are cross-checked for consistency. A photo showing minor damage submitted with a "complete destruction" classification triggers a CCI penalty. The engine names these inconsistencies explicitly in the scored output.

---

### 2.4 Adversarial Resistance

VERITAS was designed from the start to be gamed, and built to resist it.

**Adversarial Pattern Detection.** The engine runs multi-signal adversarial detection on every batch: duplicate photo detection using perceptual hashing (dHash in browser, FNV-1a in Node), temporal clustering analysis, submission rate monitoring, and coordinate proximity clustering. Coordinated false report campaigns leave a pattern footprint the engine recognizes.

**Conflict Detection.** Any two contradicting reports at the same address — regardless of individual DCI scores — trigger an automatic conflict flag and force human review. Volume alone cannot reach VALID status. The corroboration formula penalizes contradictions explicitly.

**Reporter Reputation System.** Every reporter carries a reputation score, updated after field verification. Verified accurate reports earn a bonus; confirmed false reports apply a penalty. A reputation floor triggers automatic ban — banned reporters are blocked at the scoring layer, and the block is logged to the audit trail as `BANNED_REPORTER_BLOCKED` (not silently rejected). This creates a self-reinforcing trust layer that strengthens over time.

**Community Verification Badges.** Reporters whose submissions are consistently field-verified as accurate earn community verification status. Verified reporter submissions carry a source credibility bonus and are surfaced with a badge in the responder view.

---

### 2.5 Constitutional Governance Layer

The CERTUS Engine ships with an explicit constitutional status block on every scored output — a governance instrument, not a marketing claim.

**Prohibited Uses.** Every DCI output declares the following uses as prohibited: community profiling, political targeting, discriminatory resource allocation, facial recognition, individual identification. The engine surfaces this list on every scored report and documents that enforcement is a caller responsibility — treating it as a technical gate would be false assurance.

**Consent Gate.** The engine provides a full consent form tool (`getConsentForm()`) and documents that consent enforcement is the caller's obligation. Field deployments must require consent acknowledgment before passing reports to the scoring layer.

**Appeal Workflow.** Every reporter may appeal a SUSPENDED or DEGRADED score up to three times per report, with new evidence required per appeal. Appeals are rate-limited (1 per report per hour; 10 per IP per hour) to prevent abuse. The appeal endpoint is declared in every scored output.

**Whistleblower Channel** *(planned).* A fully anonymous whistleblower channel for reporting bribery, coercion, or badge misuse is on the roadmap. The architectural specification is complete — one-time tracking code, no identity storage, anonymous by design. The constitutional status block declares this endpoint as planned in the current build.

**Use Monitoring.** Every deployment records a `last_review` timestamp and reviewer identity in the constitutional status block. Use monitoring is enabled by default and cannot be disabled without altering the engine architecture.

---

### 2.6 Indigenous Data Sovereignty

VERITAS began with UNDRIP Article 31 as a design principle. Version 2.5.3 implements it.

Indigenous community data now requires **Free, Prior, and Informed Consent** backed by digital signature of the community council, with an expiry date (one year) and revocability. Data ownership is assigned to the community, not the platform. Enforcement runs through a smart contract registry. The audit trail for indigenous data is blockchain-immutable.

| Governance Layer | Implementation |
|-----------------|----------------|
| Consent Standard | UNDRIP Article 31 — FPIC |
| Consent Proof | Digital signature of community council |
| Consent Validity | One year, revocable at any time |
| Data Ownership | Community |
| Enforcement | Smart contract registry |
| Audit Trail | Blockchain-immutable |
| Traditional Knowledge | Protected (engine-level declaration) |

This is not aspirational language. It is a declared architecture with enforcement infrastructure.

---

### 2.7 Accessibility Tier

VERITAS was designed for a first-time user under stress, in limited connectivity, in a non-primary language. Version 2.5.3 extends that to users for whom text-based forms are a barrier.

**Low-Literacy Mode.** Icon-based damage classification replaces dropdown menus. Every field has an audio fallback with full guidance in all six supported languages. The five-step flow is navigable entirely by tap and audio.

**Family and Group Batch Reporting.** A single reporter can submit damage assessments for multiple locations in one session — designed for community leaders accounting for households, or relief workers documenting a block.

**Accessibility Features.** Large text mode, automatic dark mode (ambient light sensor), and haptic feedback for confidence level confirmation are all active in v2.5.3. Progress persists across sessions — a partially completed report survives a connectivity interruption and browser close.

**Language Fallback.** When a submitted language is not in the supported set, the engine adds a `language_fallback: true` flag and degrades gracefully to the closest supported language, rather than blocking submission.

---

### 2.8 Submission Interface (`/report`)

- Offline-first PWA with IndexedDB persistence
- All UNDP Appendix 1 fields
- Six UN official languages with audio fallback
- EXIF stripping, UUID-only anonymity, GPS fuzzing for conflict zones
- Confirmation screen shows the reporter's DCI score, UM, validity status, and corroboration count — the non-monetary engagement layer

---

### 2.9 Responder Dashboard (`/respond`)

**Access code:** `UNDP2026`

- Confidence-coded map with real-time Supabase updates
- Conflict flags and 48-hour timeline slider
- Rescue signals highlighted with 🆘 icon and critical priority
- Versioned reports — only the latest per location displayed
- DCI analytics: confidence distribution, VALID/DEGRADED/SUSPENDED counts, conflict rate
- Reporter reputation heatmap — surface areas with low-trust submission patterns
- One-click export: CSV, GeoJSON, Shapefile, REST API — each with SHA-256 integrity hash
- DCI Report Card with uncertainty breakdown and submission timeline
- STP seal integration (Template 16) — one-click dataset integrity sealing

---

### 2.10 Versioning

The map displays the latest report per building (10-meter cluster radius). For clusters of buildings, the dashboard groups damage levels by area and surfaces intervention priority — satisfying both versioning scenarios specified in UNDP's requirements.

---

### 2.11 Modular Architecture

The entire form is JSON-driven. New field sections are added without touching HTML — UNDP can append post-crisis livelihood questions to the same interface without rebuilding the app.

> *"Modular step architecture allows UNDP to add new form steps without structural changes."*

The prototype is live, open source under GPL-3.0, and testable at [aionsystem.github.io/VERITAS](https://aionsystem.github.io/VERITAS).

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 3. Solution Feasibility

### Technical Feasibility

Technical feasibility is demonstrated, not claimed. Offline submission, real-time sync, confidence scoring, NLP analysis, adversarial detection, integrity-verified export, and REST API access all function in the current build, deployable by any evaluator without installation.

### Scale Feasibility

Scale feasibility maps directly to UNDP's three specified tiers:

| Tier | Infrastructure | Capacity | Cost |
|------|---------------|----------|------|
| Local / Sub-national | Supabase Free | Up to 50,000 reports | $0/month |
| Medium / Regional | Supabase Pro | Up to 250,000 reports | $25/month |
| Large / National | Supabase Pro + read replicas | Up to 500,000 reports | Scales with load |

The architecture supports hundreds of crises per year — each crisis uses an isolated project or a shared instance with crisis-ID partitioning. The PWA client-side shell means server load is sync and query only, not rendering.

### Database Structure

Each report stores:

> `UUID` · `timestamp` · `damage tier (UNDP 3-tier exact wording)` · `infrastructure type and name` · `crisis type and subtype` · `GPS coordinates` · `DCI score and sub-scores` · `photo hash` · all Appendix 1 fields (`debris`, `electricity`, `health`, `pressing needs`) · `NLP inferences` · `source credibility weight` · `reporter reputation score` · `appeal count` · `constitutional status block` · `consent record` · `sync status flag`

Full schema is public in [`supabase/schema.sql`](supabase/schema.sql).

### Analytics

The DCI Report Card surfaces confidence distribution, conflict rate, submission timeline, and reporter reputation patterns across the full dataset — giving UNDP partners actionable analytics without a separate BI tool.

### Deployment for Non-Experts

No installation, no account, no training. QR code → browser → submit. The five-step flow was designed for a first-time user under stress, in limited connectivity, in a non-primary language — with full audio fallback for low-literacy contexts.

### Cost

Zero for the static app. $25/month at Pro tier for regional or national deployments.

### Precedent

The xBD dataset (MIT licensed) validates AI-assisted building damage classification from community photos at scale across 19 disaster types. VERITAS implements the same model architecture deployable on a phone, offline, in six languages — with graduated trust scoring that declares its calibration status honestly and improves automatically as field validation accumulates.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 4. Experience

VERITAS is an application of the AION Constitutional Stack — a framework ecosystem for certainty engineering in AI systems, developed by Sheldon K. Salmon across 18 interconnected frameworks.

This submission was designed, architected, and directed by a human. AI tools were used as instruments. The intellectual core — the CERTUS Engine formula, the four scoring dimensions, the confidence gate logic, the validity thresholds, the adversarial detection architecture, the constitutional governance layer, and the STP integration — is wholly human-originated.

The CERTUS Engine underwent systematic adversarial review across multiple attack surfaces before version 2.5.3 was finalized — scoring logic, location privacy, evidence independence, constitutional compliance, UI accessibility, and data transparency. The result is a hardened engine, not a prototype that will be hardened later.

The CERTUS Engine is a direct application of FSVE (Formal Scoring and Validity Engine), a certainty-scoring architecture with a validated methodology and defined validity thresholds. The DCI formula is FSVE applied to crisis data signals. The confidence gate reflects the same threshold logic used across the full AION stack.

The Sovereign Trace Protocol — the cryptographic sealing infrastructure integrated into VERITAS — is a live, operational system with a public GitHub repository and a functional webhook-based ledger. It was not built for this submission. VERITAS is its first field deployment.

This is not a competition prototype. It is a finished tool from a working architecture, submitted because the problem UNDP named is exactly the problem this architecture was built to solve.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 5. Solution Risks

### Risk 1 — AI Photo Analysis: Live but Uncalibrated

The current build runs real AI photo analysis via OpenRouter (GPT-4o-mini primary, Claude 3.5 Sonnet fallback). This is not a simulation. The risk is calibration, not implementation.

The engine registers the photo model as UNCALIBRATED at deployment — because it is. No ground truth validation data from field deployments has been collected yet. The CERTUS Engine applies the full 0.20 UM penalty to every PES calculation at this status. Every scored report declares its calibration status explicitly. The confidence in the photo score is honest about its own uncertainty.

**Why this is a feature, not a gap.** The alternative — declaring a model trustworthy before field evidence accumulates — is the failure mode that costs lives in crisis response. VERITAS starts honest and becomes more confident as evidence accumulates. No code changes are required: as field-validated reports accrue, `updateModelCalibration()` reduces the UM penalty continuously and automatically.

> **Mitigation:** UNDP field deployment generates the validation data that calibrates the model. A single crisis event with 500 reports and field-verified outcomes moves the engine from UNCALIBRATED to EVALUATIVE_PARTIAL and cuts the photo UM penalty by more than half.

---

### Risk 2 — Adoption Under Crisis Conditions

Distribution requires coordination with local partners or UNDP's network. VERITAS eliminates all onboarding friction but still needs a distribution trigger.

> **Mitigation:** QR code + WhatsApp + SMS amplification within 30 minutes of crisis onset. UNDP's existing partner network is the distribution layer; VERITAS is the instrument they hand to communities. Low-literacy mode and full audio guidance remove the remaining barrier for communities where text-based adoption would otherwise stall.

---

### Risk 3 — Adversarial Attacks on the DCI

Coordinated false reports could attempt to inflate confidence scores for a target location, or suppress legitimate signals by flooding an area with contradicting reports.

> **Mitigation (v2.5.3):** The adversarial resistance architecture addresses this at multiple layers simultaneously. Evidence independence detection prevents correlated submissions from accumulating false corroboration weight. Perceptual hashing detects duplicate photos submitted across multiple fake reports. Temporal clustering analysis flags coordinated submission campaigns. The reporter reputation system imposes cumulative penalties for confirmed false reports, with automatic ban below a defined threshold. Conflict detection flags contradicting reports for human review regardless of individual DCI scores. No single attack surface can reach VALID status — the system requires independent, non-correlated, temporally distributed, consistent evidence. Gaming it requires the same coordination a legitimate response would require.

---

### Risk 4 — Backend Dependency

Supabase outages affect real-time sync and the responder dashboard.

> **Mitigation:** Full offline fallback. IndexedDB holds all reports locally. The dashboard falls back to a cached snapshot. No data is ever lost — reports queue and sync when connectivity returns. Circuit breakers with exponential backoff protect all external dependencies. Manual reset is required before reconnecting to a failing service — no automatic reconnect that could flood a recovering backend.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 6. Online References

| Resource | Link |
|----------|------|
| **Live Prototype** (access code: `UNDP2026`) | [aionsystem.github.io/VERITAS](https://aionsystem.github.io/VERITAS) |
| **Source Code** (GPL-3.0) | [github.com/AionSystem/VERITAS](https://github.com/AionSystem/VERITAS) |
| **DOI — VERITAS** (Zenodo) | [10.5281/zenodo.19295266](https://doi.org/10.5281/zenodo.19295266) |
| **DOI — CERTUS Engine** (Zenodo) | [10.5281/zenodo.19373724](https://doi.org/10.5281/zenodo.19373724) |
| **ORCID** (Sheldon K. Salmon) | [0009-0005-8057-5115](https://orcid.org/0009-0005-8057-5115) |
| **Sovereign Trace Protocol** | [github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL](https://github.com/AionSystem/SOVEREIGN-TRACE-PROTOCOL) |
| **AION Constitutional Stack** | [github.com/AionSystem/AION-BRAIN](https://github.com/AionSystem/AION-BRAIN) |
| **xBD Dataset** (photo evidence model training data) | [xview2.org](https://xview2.org/) |
| **Full Compliance Audit** | [`VERITAS_UNDP_COMPLIANCE.md`](VERITAS_UNDP_COMPLIANCE.md) |
| **CERTUS Engine Documentation** | [`CERTUS.md`](CERTUS.md) |

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 7. Rapid Deployment Protocol

Within 30 minutes of crisis onset, VERITAS can be operational for community use:

1. **QR code** pointing to the GitHub Pages URL distributed via WhatsApp, SMS, printed posters, or social media. No app store. No download.
2. **Language pre-selection** — deployment coordinator sets default language and enables audio mode before distributing the link. Community reporters see their language on first load; low-literacy reporters get icon-based flow automatically.
3. **Access code** shared with authorized responders via secure channel. Community reporters never see it.
4. **Offline caching** — once any reporter loads the app, the service worker caches it for all subsequent offline use.
5. **Model calibration begins** — every field-verified report from the first deployment event starts reducing the photo UM penalty for all subsequent deployments.

> No infrastructure investment. No local server. No IT coordination. Runs on GitHub's CDN and Supabase. The entire deployment is managed from a phone. The platform gets more trustworthy every time it is used.

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

## 8. Attachments

| Attachment | Link | Notes |
|------------|------|-------|
| **MVP Prototype** | [aionsystem.github.io/VERITAS](https://aionsystem.github.io/VERITAS) | Fully testable · access code `UNDP2026` |
| **Pitch Video** | YouTube link — to be added before submission | — |
| **Full Compliance Audit** | [`VERITAS_UNDP_COMPLIANCE.md`](VERITAS_UNDP_COMPLIANCE.md) | All 27 requirements |
| **DCI Formula Documentation** | [`docs/dci-formula.md`](docs/dci-formula.md) | CERTUS Engine derivation |
| **Architecture Documentation** | [`docs/architecture.md`](docs/architecture.md) | System design |
| **Anonymization Protocol** | [`docs/anonymization.md`](docs/anonymization.md) | Privacy architecture |
| **CERTUS Engine v2.5.3** | [`public/certus-engine-v2_5_3.js`](public/certus-engine-v2_5_3.js) | Full scoring implementation |

[![↑ Back to Table of Contents](https://img.shields.io/badge/↑_Back_to-Table_of_Contents-374151?style=flat-square)](#table-of-contents)

---

> *"The code is open source. The architecture is not replicable."*

VERITAS is certainty engineering applied to community crisis data. The formula is published. The code is forked freely under GPL-3.0. What cannot be forked is the judgment that built it — rigorous adversarial testing, a confidence gate designed to fail honestly, a constitutional governance layer that treats its own prohibited-uses list as a contract rather than a technical wall, and a decision to start uncalibrated and earn trust through deployment rather than claim it before the first report arrives.

That judgment is the contribution. The competition is the occasion.

---

*Proposal co-authored by Sheldon K. Salmon & ALBEDO · AionSystem · Evans Mills, New York*  
*VERITAS v2.5.3 · CERTUS Engine v2.5.3 · April 2026*
