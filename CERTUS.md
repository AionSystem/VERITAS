[![DOI](https://zenodo.org/badge/1198800128.svg)](https://doi.org/10.5281/zenodo.19373724)

<div align="center">

# CERTUS Engine v3.2.2

### Calibrated Confidence for Crisis Data — Sovereignty-Hardened

*Author: Sheldon K. Salmon & ALBEDO · AionSystem · May 2026*

---

![Version](https://img.shields.io/badge/VERSION-3.2.2-152238?style=flat-square)
![Audit](https://img.shields.io/badge/AUDIT-4--INSTRUMENT%20COMPLETE-1E4D8C?style=flat-square)
![Findings](https://img.shields.io/badge/FINDINGS-76%20RESOLVED%20·%200%20OPEN-4527A0?style=flat-square)
![Tests](https://img.shields.io/badge/RUNTIME-PARSE%20%2B%2021--CHECK%20SUITE%20PASSING-2E7D32?style=flat-square)
![License](https://img.shields.io/badge/LICENSE-Apache%202.0-B45309?style=flat-square)

</div>

---

<a name="top"></a>

## Table of Contents

| # | Section |
|---|---|
| 1 | [Release Summary — v3.2.1](#release-summary) |
| 2 | [The Dispatch Desk — What CERTUS Actually Is](#dispatch-desk) |
| 3 | [Scoring Formula](#formula) |
| 4 | [Graduated Photo Model Trust](#model-trust) |
| 5 | [Framework Calibration Log (FCL) & Self‑Calibration](#fcl) |
| 6 | [Integrity Seals & Canonical Serialisation](#integrity-seals) |
| 7 | [Abstraction Bargain](#abstraction-bargain) |
| 8 | [Thresholds and Actions](#thresholds) |
| 9 | [Sub-Component Details](#sub-components) |
| 10 | [Signal Intelligence Layer](#signal-intelligence) |
| 11 | [Adversarial Resistance](#adversarial-resistance) |
| 12 | [Reporter Accountability & GDPR](#reporter-accountability) |
| 13 | [Uncertainty Mass (UM)](#uncertainty-mass) |
| 14 | [Constitutional Governance Layer](#constitutional-governance) |
| 15 | [Mock Data Warning](#mock-data) |
| 16 | [Declared Assumptions](#assumptions) |
| 17 | [Initialization](#initialization) |
| 18 | [Output Structure](#output-structure) |
| 19 | [Offline and Field Mode](#offline-mode) |
| 20 | [Accessibility](#accessibility) |
| 21 | [Deployment Readiness](#deployment-readiness) |
| 22 | [Roadmap](#roadmap) |

---

<a name="release-summary"></a>

## 1 · Release Summary — v3.2.2

CERTUS v3.2.2 is the culmination of a full **four‑instrument adversarial audit lineage plus an independent execution-level code review** across seven versions (v2.5.2 → v3.2.2). The stack — **PDE v0.3**, **EAE v0.3**, **ANTI‑FORGE v1.3**, and **CAL v0.3** — ran sequentially, each instrument building on the findings of the previous.

### Audit Ledger — One Reconciled Record

This ledger is the canonical audit arithmetic for the CERTUS engine, and it matches the VERITAS repository README exactly. Any document stating different numbers is stale and superseded by this table.

| Phase | Versions | Findings | Census | Status |
|---|---|---|---|---|
| **Original four‑instrument audit** | ran against v2.5.2, resolved in v3.0.0 | **25** | 1 FATAL · 2 CRITICAL · 7 HIGH · 10 MEDIUM · 5 LOW | ✅ All resolved in v3.0.0 |
| **Enhancement‑cycle findings** | v3.0.1 → v3.2.1 | **32** | 3 CRITICAL · 4 HIGH · 3 MEDIUM · 1 LOW · 21 refinements | ✅ All resolved in v3.2.1 |
| **Independent code review (execution-level)** | ran against v3.2.1, resolved in v3.2.2 | **19** | 2 FATAL · 4 CRITICAL · 4 HIGH · 6 MEDIUM · 3 LOW | ✅ All resolved in v3.2.2, each fix verified by executed test |
| **Cumulative** | v2.5.2 → v3.2.2 | **76** | 3 FATAL · 9 CRITICAL · 15 HIGH · 19 MEDIUM · 9 LOW · 21 refinements | ✅ **76 resolved · 0 open** |

> Stated precisely: **76 findings were found and resolved across the lineage — including 3 FATAL and 9 CRITICAL — and zero findings remain open at v3.2.2.** The audit claim is that everything found was fixed, not that nothing serious was ever found. The serious findings are the evidence the audit worked.

### The v3.2.2 Repair Release — stated at full strength

An independent execution-level review of the v3.2.1 source found what document review cannot: **the file as assembled did not parse** (a stray class-closing brace at an internal part boundary — FATAL), and **four documented mechanisms did not exist in the code** (the epistemic ceiling was defined but never applied; `calibrateWeights()`, the graduated model-trust system, `_extractDamageFromWitness()`, and the cumulative appeal ceiling were documented but unimplemented). v3.2.2 fixes the parse defect, implements every phantom mechanism, corrects a reputation-weighting math error that could produce negative corroboration weights, makes the third-party density lookup opt-in for privacy, and closes twelve further findings. **Every fix is verified by an executed 21-check runtime suite (`tests/`), and `node --check` passes — the first version of this engine proven to run, not merely read.** This paragraph exists because an engine that scores other people's honesty must publish its own worst finding at full strength.

### Key Enhancements (v3.0.1 → v3.2.1)

| Enhancement | Severity | Resolution |
|---|---|---|
| Class instantiation (multi‑tenant, horizontal scaling) | **CRITICAL** | `CERTUSEngine` class; `createForTenant()` factory |
| Canonical JSON seal (cross‑engine tamper‑evidence) | **CRITICAL** | `_canonicalSerialize()` replaces `JSON.stringify()` |
| Safe batch concurrency (error isolation, configurable limit) | **CRITICAL** | `_withConcurrencyLimit()`; batch results segregated |
| Nonlinear event‑aware TFR decay (earthquake, flood, cyclone) | **HIGH** | Event‑type‑specific decay curves; reconciliation gate |
| Infrastructure criticality multiplier | **HIGH** | `dci_priority` (Medical 1.5×, Residential 1.0×) |
| Spatial cluster detection (mass‑casualty events) | **HIGH** | `detectSpatialCluster()` – 2km/20min, 5‑report threshold |
| Multilingual CCI with translation penalty | **HIGH** | `language_mismatch` flag; +0.10 UM penalty; transparency |
| HMAC‑signed photo API calls | **HIGH** | `X-CERTUS-Signature`; configurable secret |
| GDPR data portability (export/delete) | **MEDIUM** | `exportReporterData()`, `deleteReporterData()` |
| Damage progression tracker (time‑series per location) | **MEDIUM** | `recordLocationSnapshot()`, `getProgressionSignal()` |
| Pre‑aggregated EDS cache (O(1) health check) | **MEDIUM** | `_getOrComputeEDS()`; 60‑second TTL |
| Certificate expiry enforcement | **LOW** | `validateCertificate()` called before sharing |

All 57 findings are documented in the journal and resolved in the final merged code. The engine is **reference‑grade, audit‑hardened, and execution‑verified** (parse check + 21-check runtime suite, both in `tests/` and run in CI); production deployment requires the steps in [§21 Deployment Readiness](#deployment-readiness) — mock‑data overrides, HMAC secret configuration, and model calibration accumulation.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="dispatch-desk"></a>

## 2 · The Dispatch Desk — What CERTUS Actually Is

*You don't need the formula to understand this. Start here.*

Picture a dispatch desk in a crisis operations center. The phones are ringing. Reports are coming in from across a city that just took a direct hit — hundreds of them, then thousands. Each one is a person with a phone, standing somewhere, telling you what they see.

Some of them are right. Some of them are wrong. Some are standing in front of a building that looked fine an hour ago and has since half‑collapsed. Some are describing rubble from two blocks away, not the building in the photo. Some are submitting the same location twice because they weren't sure the first one went through. And some — a small number — are submitting deliberately false reports to redirect response resources.

The operator at the dispatch desk has one job: before a truck moves, before a team deploys, before a resource gets committed — **figure out which reports to trust.**

That operator is CERTUS.

---

Every report that arrives on the desk gets a number. Not a guess. A number built from four separate lines of evidence — the photo, the neighbourhood consensus, the timestamp, and an internal logic check. CERTUS weighs all four, combines them, and writes a single score on the report: a number between 0.0 and 1.0.

But that's not all. CERTUS also calculates an **Uncertainty Mass (UM)** — a measure of how much uncertainty is baked into that score. A high‑confidence score with low uncertainty is actionable. A high‑confidence score with high uncertainty is a warning sign. The UM validity bands are defined canonically in [§8 Thresholds and Actions](#thresholds); in short:

| UM Range | Signal |
|---|---|
| < 0.35 | Low uncertainty — score can carry weight |
| 0.35 – 0.60 | Elevated uncertainty — verify locally |
| ≥ 0.60 | Excessive uncertainty — field‑verify before any action |

Then it stamps the report with a colour and routes it.

🟢 **Green** — score ≥ 0.70 AND UM < 0.35. CERTUS is confident. This report goes to the front of the stack. Responders can act on it.

🟡 **Amber** — score between 0.40 and 0.69, OR UM is 0.35–0.60. Something is uncertain — maybe only one person reported it, maybe the photo was blurry, maybe the report is 30 hours old. Watch it. Don't ignore it. Don't act on it alone.

🔴 **Red** — score below 0.40 OR UM ≥ 0.60. CERTUS is raising its hand. A human needs to look at this before anything moves. Not because the reporter is lying — they probably aren't — but because the evidence isn't strong enough yet to stake a deployment decision on it.

---

**The Conflict Rule:** If two reports arrive from the same address and they contradict each other — one says "Completely damaged," one says "Minor damage" — CERTUS flags the location as a **conflict**. The whole location goes red immediately, regardless of individual scores. Contradicting reports at the same address don't average out. They signal that something is genuinely unknown, and unknown is not a safe basis for action. A human resolves the conflict. Then the location is re‑evaluated.

**The Cluster Rule:** When a cluster of reports arrives from the same GPS location, at the same time, with similar photos — CERTUS raises a flag before routing any of them. Evidence from people who were in the same place at the same time, comparing notes, is not five independent confirmations. It may be one shared perception submitted five times. CERTUS knows the difference.

---

The purpose of the engine is not to replace the reporter or the responder. It is to sit between them and do the one thing both of them need: translate raw human signals into a number that honestly represents how much those signals should be trusted — and tell you how sure it is about that number.

**The trucks move on green. The humans watch amber. The red pins wait for eyes.**

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="formula"></a>

## 3 · Scoring Formula

```

DCI = (0.35 × PES_eff) + (0.30 × COR) + (0.20 × TFR) + (0.15 × CCI)

```

| Component | Description | Range |
|---|---|---|
| **PES_eff** | Photo Evidence Score — AI analysis via OpenRouter, gated at model confidence ≥ 0.60, scaled by graduated model trust | 0.0 – 1.0 |
| **COR** | Corroboration Score — agreement with independent reports within dynamic radius (density‑adjusted), weighted by reporter reputation | 0.0 – 1.0 |
| **TFR** | Temporal Freshness — event‑aware decay (earthquake, flood, cyclone, default); reconciliation gate for fresh evidence | 0.0 – 1.0 |
| **CCI** | Classification Consistency — cross‑category logic check, expanded suspicious combinations, multilingual penalty | 0.0 – 1.0 |

> **Epistemic Ceiling:** No DCI score can exceed **0.95**. Field conditions always carry residual uncertainty. This constraint is architectural and not configurable, **enforced in `score()` and in `processAppeal()` as of v3.2.2 and verified by executed test.** The ceiling is **cumulative across all appeals** — sequential appeals cannot bypass it. *(Disclosure: v3.2.1 defined this constant but never applied it; a perfect-input report could score 1.000. Found by the execution review, fixed and test-locked in v3.2.2.)*

> **Self‑Calibrating Weights (implemented v3.2.2):** The engine provides `calibrateWeights(minEntries)` — per-dimension MAE against ground truth, recommended weights, 70/30 dampened blend, renormalized. Human‑in‑the‑loop review is required before applying new weights in production; the engine never auto-updates its own weights. *(Disclosure: documented since v3.1.0, first actually implemented in v3.2.2.)*

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="model-trust"></a>

## 4 · Graduated Photo Model Trust

CERTUS does not assume any AI model is trustworthy without a declaration. Instead, it uses a **graduated model trust score** [0.0–1.0] derived from calibration evidence, which directly and continuously reduces the PES uncertainty penalty as ground truth accumulates.

| Trust Score | Calibration Status | PES UM Penalty | Measurement Class |
|---|---|---|---|
| 0.0 | UNCALIBRATED (no ground truth) | 0.20 | INFERENTIAL |
| 0.01 – 0.59 | PARTIAL (1–249 validated reports) | 0.08 – 0.20 | EVALUATIVE_PARTIAL |
| 0.60 – 0.85 | PARTIAL (250–499 validated reports) | 0.03 – 0.08 | EVALUATIVE_PARTIAL |
| 1.0 | VERIFIED (formally calibrated) | 0.00 | EVALUATIVE_CERTIFIED |

The trust score is declared at initialization via `registerPhotoModel()` (or the `initialize()` options object), logged to the audit trail, and read by `computePES` to scale the uncertainty penalty continuously — `0.20 × (1 − trust)`. No code changes are required as calibration evidence accumulates: call `updateModelCalibration(samples, status)`. **Implemented and execution-verified in v3.2.2** (test: 0 samples → 0.20 penalty; 300 samples → trust 0.65 → 0.07 penalty). *(Disclosure: this entire system was documented but absent from the code before v3.2.2.)*

> **Photo API Security (v3.2.1):** All requests to the photo analysis endpoint are signed with an HMAC‑SHA‑256 timestamp and signature header (`X-CERTUS-Timestamp`, `X-CERTUS-Signature`). Production deployments must set `PRODUCTION.photoApiHmacSecret`. The API call also includes exponential backoff retries (max 3 attempts) and a circuit breaker.

> **Current deployment:** `openrouter/gpt-4o-mini + claude-3.5-sonnet` registered as **UNCALIBRATED**. Full UM penalty applies. Every scored report declares this explicitly.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="fcl"></a>

## 5 · Framework Calibration Log (FCL) & Self‑Calibration

CERTUS records scoring outcomes against ground truth through **FCL entries**. Every scored report where ground truth is available produces an entry recording the predicted DCI, predicted tier, actual outcome, and per‑dimension scores.

```javascript
// Access calibration data
const entries = CERTUS.getFCLEntries();
const count   = CERTUS.getFCLCount();

console.log(
  `FCL entries: ${count} — calibration ${count >= 20 ? 'active' : 'pending (need 20+ entries)'}`
);

// When enough ground truth exists, get recommended weight updates
const calibration = CERTUS.calibrateWeights(20);
if (calibration.calibrated) {
  console.log('Recommended weights:', calibration.recommended_weights);
  // After human review: CERTUS.W = calibration.updated_weights_dampened;
}
```

FCL entries are stored in memory (capped at 500) and persisted to storage (IndexedDB, memory, or Supabase). The `calibrateWeights()` method computes MAE per dimension and returns a 70/30 dampened blend of current and recommended weights. Human review is required before applying — the engine never auto‑updates its weights.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="integrity-seals"></a>

## 6 · Integrity Seals & Canonical Serialisation

Every scored output carries a cryptographic integrity seal generated via `_sealResult()`. The seal uses SHA‑256 (Web Crypto API when available) over the report UUID, DCI score, tier, timestamp, engine version, and tenant ID. The report input is also hashed via `_hashReportInput()` so downstream consumers can verify the report was not modified between submission and scoring.

```javascript
// Every score output includes:
{
  integrity_seal: {
    algorithm: "SHA-256",
    hash:      "a3f2b8c1...",
    payload:   "{...}"          // canonical JSON
  },
  input_hash: "sha256:7d4a2f1c..."
}
```

**Canonical serialisation (v3.2.1):** The seal uses `_canonicalSerialize()` to sort object keys alphabetically, ensuring identical seals across different JavaScript engines (Node.js vs browser). This fixes the cross‑environment tamper‑evidence chain that previously broke seals when moving between runtime environments.

> **Declared engineering priority (next engine revision):** the scoring path (`REAL` vs `MOCK`) will be stamped inside the integrity seal itself, so any sealed dataset is cryptographically self‑identifying about which pipeline produced it — a mock‑scored export becomes detectable by any downstream verifier, not only by reading UI labels. See [§15 Mock Data Warning](#mock-data).

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="abstraction-bargain"></a>

## 7 · Abstraction Bargain

Every computational model discards physical properties to enable formal reasoning. Each discarded property generates a class of failure modes invisible to the model. CERTUS declares its abstraction bargain explicitly via the `MODEL_LIMITATIONS` block — a permanent, auditable declaration of what the DCI model cannot see.

| Discarded Property | Failure Class |
|---|---|
| Sensor reliability | Damaged camera lenses, low‑light noise, sensor artifacts producing false evidence scores |
| Atmospheric interference | Smoke, dust, fog, rain degrading photo quality below detectable threshold |
| Cultural differences in damage reporting | Non‑English descriptions receiving systematically lower CCI scores (now flagged with `language_mismatch`) |
| Language translation fidelity | Semantic drift during automated translation affecting damage‑level signals (+0.10 UM penalty) |
| Independence of nearby reports | Correlated community reports inflating corroboration scores beyond actual independent confirmation |
| Geographic homogeneity | Uniform COR radius applied across all population densities — now dynamically adjusted via OSM building density (ENH‑02) |
| Event‑specific decay | Earthquake, flood, cyclone profiles are hand‑tuned; a tsunami would require its own curve |

**Specification primacy ordering:** When behaviour contradicts expectation, verify whether the specification permits the behaviour before diagnosing an implementation error.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="thresholds"></a>

## 8 · Thresholds and Actions

This table is the **canonical** routing definition. All other tables in this document (including §2's plain‑language summary) reference it.

| DCI Range | Tier | UM Threshold | Pin Color | Action |
|---|---|---|---|---|
| ≥ 0.70 | High Confidence | < 0.35 | 🟢 Green | Trusted — ready for triage |
| 0.40 – 0.69 | Watch | < 0.60 | 🟡 Amber | Monitor — verify locally |
| < 0.40 | Review Required | any | 🔴 Red | Human verification required before action |
| any | any | **≥ 0.60** | 🔴 Red | Do not act — field verification required |

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="sub-components"></a>

## 9 · Sub-Component Details

### 9.1 · Photo Evidence Score (PES_eff)

VERITAS uses OpenRouter to access AI models for damage assessment.

| Priority | Model | Purpose |
|---|---|---|
| Primary | GPT-4o-mini (OpenAI via OpenRouter) | Fast, cost‑efficient damage assessment |
| Fallback | Claude 3.5 Sonnet (Anthropic via OpenRouter) | Higher‑accuracy fallback if primary fails |

Processing pipeline:

1. User captures photo — Canvas API strips EXIF metadata
2. Image sent to OpenRouter with structured prompt
3. AI returns: damage level, confidence score, description
4. CERTUS derives a model trust score from registered calibration data
5. If confidence < 0.60 → PES_eff applies trust‑scaled gate
6. If confidence ≥ 0.60 → PES_eff used directly; UM penalty scaled by trust
7. If API unavailable → falls back to **clearly‑labeled mock analysis** with the full UNCALIBRATED uncertainty penalty applied. *(The bundled TensorFlow.js xBD model is present in the repository but **not yet wired** — offline local inference is a planned capability, not a current fallback. See §19 and the Roadmap.)*

**Resilient API calls (v3.2.1):** The photo analysis endpoint is configurable (`PRODUCTION.photoApiEndpoint`). The engine retries failed requests up to 3 times with exponential backoff (500ms, 1000ms, 2000ms) and a circuit breaker that opens after 3 consecutive failures. Batch scoring runs concurrently with a default limit of 10 simultaneous requests.

---

### 9.2 · Corroboration Score (COR) — Density‑Adjusted & Reputation‑Weighted

| Scenario | Score | Uncertainty Contribution |
|---|---|---|
| No nearby reports | Not evaluable (excluded) | +0.20 UM |
| One nearby report — agrees | 0.55 | +0.05 UM |
| One nearby report — disagrees | 0.40 | +0.05 UM |
| Multiple independent reports — strong agreement | 0.70 | 0 UM |
| Multiple reports — contradiction | < 0.40 | +0.08 UM |

**Dynamic COR radius (ENH‑02, opt‑in as of v3.2.2):** Queries OpenStreetMap for building density in a 500m bounding box and adjusts radius from 20m (extreme density) to 200m (rural). **Disabled by default** (`PRODUCTION.enableDensityRadiusLookup: false`) because the lookup transmits report coordinates to a public third-party API (overpass-api.de); it is never called for anonymized sensitive locations, and privacy-sensitive deployments should enable it only against a self-hosted Overpass instance.

**Reputation weighting (ENH‑04, corrected v3.2.2):** When `reputationFn` is provided, nearby reports from banned reporters are excluded, and agreement weight scales with reputation — integer scores are normalized against the ban threshold and the weight is bounded to [0.5, 1.0]. Good reporters matter more; no reporter can dominate, and negative scores can no longer produce negative weights. *(Disclosure: the pre-v3.2.2 formula applied raw integer scores to a [0,1] formula, allowing runaway and negative weights.)*

**Evidence Independence Detection:** CERTUS detects when multiple reports are likely correlated — same submitter cluster, same time window, same GPS cluster, similar photos. Correlated evidence is down‑weighted before entering the COR calculation.

---

### 9.3 · Temporal Freshness (TFR) — Event‑Aware & Reconciliation Gate

```
TFR = profile.fn(hours_elapsed)
```

| Event Type | Decay Curve | 6h | 12h | 24h | 48h |
|---|---|---|---|---|---|
| Earthquake | Rescue window: high first 6h, then gradual | 1.00 | 0.78 | 0.52 | 0.27 |
| Flood | Stays relevant longer — 120h half‑life | 0.95 | 0.90 | 0.80 | 0.60 |
| Cyclone | Moderate decay, 96h half‑life | 0.94 | 0.88 | 0.75 | 0.50 |
| Default | Linear 48h half‑life | 0.88 | 0.75 | 0.50 | 0.00 |

Use `report.eventType = 'earthquake' | 'flood' | 'cyclone' | 'default'` in the report object.

**Reconciliation Gate:** If the report is stale (TFR EXPIRED) but fresh evidence (e.g., satellite photo) is submitted within 6h, TFR recovers to AGING_RECOVERED (≥0.45). The recovery is noted in `dci_decay_reconciliation`.

---

### 9.4 · Classification Consistency (CCI) — Expanded & Multilingual

| Combination | CCI | Uncertainty | Reason |
|---|---|---|---|
| Any + any (consistent) | 1.0 | 0 | Consistent |
| "Completely damaged" + "Road" | 0.70 | +0.08 | Roads rarely achieve total collapse |
| "Completely damaged" + "Utility" | 0.75 | +0.08 | Utility infrastructure rarely total collapse |
| "Completely damaged" + "Bridge" | 0.80 | +0.08 | Bridge collapse plausible but verify |
| "Minimal/No damage" + "Bridge" | 0.75 | +0.08 | Bridges rarely sustain only cosmetic damage |
| "Completely damaged" + "Medical" | 0.85 | +0.08 | High consequence — verify urgently |
| "Completely damaged" + "Government Building" | 0.80 | +0.08 | Coordination facility — escalate |
| "Minimal/No damage" + "Residential" | 0.95 | +0.08 | Common and plausible |
| Missing classification | 0.80 | 0 | Default applied |

**Multilingual handling (v3.2.1):** When `witnessText` is present and the report language is not English, a +0.10 UM penalty is added and the note `[NLP‑A01]` is attached. The `language_mismatch` flag is set in `dci_flags`. Full multilingual keyword dictionaries are planned for v3.3.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="signal-intelligence"></a>

## 10 · Signal Intelligence Layer

### NLP Witness Statement Analysis

Text fields are analysed to extract damage‑level signals and infer infrastructure type directly from witness descriptions.

**v3.2.1 Note:** Non‑English witness statements receive a +0.10 UM penalty and a `language_mismatch` flag, making the bias transparent. Full multilingual keyword dictionaries are planned for v3.3; the current fallback uses a translation‑uncertainty penalty.

---

### Source Credibility Scoring

Evidence sources are assigned credibility weights before entering the COR calculation.

| Source Type | Credibility Weight |
|---|---|
| First‑hand witness | 0.9 |
| Community‑verified reporter | Bonus applied at COR |
| Unverified secondhand | Reduced weight |

---

### Cross‑Validation

Photo evidence, text description, and GPS location are cross‑checked for internal consistency. A photo showing minor damage submitted with a "complete destruction" classification triggers a CCI penalty.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="adversarial-resistance"></a>

## 11 · Adversarial Resistance

### Adversarial Pattern Detection

Multi‑signal detection via `_detectAdversarialPattern()`:

- Duplicate photo detection via perceptual hashing (dHash in browser · FNV‑1a in Node)
- Temporal clustering analysis
- Submission rate monitoring
- Coordinate proximity clustering

**v3.0.0:** Perceptual hash threshold surfaced to `THRESHOLDS.PERCEPTUAL_HASH_THRESHOLD` (default 0.95).

**Spatial cluster detection (v3.2.1):** `detectSpatialCluster()` scans reports within a 2km radius over a 20‑minute window. When 5+ reports are found, it returns `cluster_detected: true` with severity `MASS_CASUALTY_RISK` if ≥60% are "Completely damaged". The cluster centroid and recommendation are provided for immediate aggregate dispatch.

**Certificate expiry enforcement (v3.2.1):** Verification certificates expire after 48 hours. `validateCertificate()` checks the expiry before sharing; expired certificates return `shareable: false` with action `RE_SCORE_REPORT`.

---

### Reporter Reputation System

Every reporter carries a reputation score updated after field verification.

| Event | Reputation Change |
|---|---|
| Field‑verified accurate report | +10 |
| Confirmed false report | −20 |
| Ban threshold | −100 |

---

### Community Verification Badges

Reporters with consistently verified submissions earn community verification status, which applies a source credibility bonus to all future submissions.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="reporter-accountability"></a>

## 12 · Reporter Accountability & GDPR

### Appeal Workflow

Every reporter may appeal a SUSPENDED or DEGRADED score up to 3 times per report, with new evidence required per appeal.

**Implemented v3.2.2 (`processAppeal()`):** each appeal requires new evidence; boosts are bounded (≤0.15 per appeal, ≤0.45 cumulative) and tracked per report via `_cumulativeAppealBoost`; the epistemic ceiling (0.95) is cumulative across all appeals — sequential appeals cannot drive confidence past it, verified by executed test. *(Disclosure: documented as v3.0.0 hardening, but no appeal-processing logic existed before v3.2.2.)*

---

### Data Correction Workflow

Reporters may submit corrections via `/api/correction`. All corrections are versioned and audited.

---

### GDPR Article 20 — Data Portability Mechanisms (v3.2.1)

The engine ships the Article 20 mechanisms; full GDPR compliance is a property of a deployment (lawful basis, processor agreements, DPO obligations) and is the deploying organization's responsibility.

Any reporter can request all their data in machine‑readable format via `exportReporterData(reporterId)`. The export includes:

- Reputation record
- FCL entries
- Appeals history
- Data recipients

Deletion is available via `deleteReporterData(reporterId, verificationToken)`. After deletion, the reporter's record is redacted (aggregate signal only, no PII).

---

### Whistleblower Channel

Planned endpoint: `/api/whistleblower` · Status: Planned — v3.3

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="uncertainty-mass"></a>

## 13 · Uncertainty Mass (UM)

### UM Components

| Source | Base Contribution | Condition |
|---|---|---|
| No photo | +0.25 | PES excluded |
| UNCALIBRATED model | +0.20 | trust_score = 0.0 |
| VERIFIED model | +0.00 | trust_score = 1.0 |
| No corroboration | +0.20 | COR excluded |
| Weak corroboration | +0.05 | Only one nearby report |
| Contradiction | +0.08 | Multiple reports disagree |
| Aging report | +0.05 – +0.15 | Based on hours elapsed |
| Classification flagged | +0.08 | Suspicious combination |
| Language mismatch | +0.10 | Non‑English, translation penalty |
| Correlated failures | +0.20 – +0.60 | Multiple missing dimensions |

---

### UM Calculation

```
UM = 1 − ∏(1 − pᵢ)
```

---

### UM Validity Thresholds

Canonical joint routing (DCI × UM) is defined in [§8](#thresholds). The UM component thresholds:

| UM Range | Validity Status | Meaning |
|---|---|---|
| < 0.35 | VALID | Score is reliable — act on it |
| 0.35 – 0.60 | DEGRADED | Score useful but uncertain |
| **≥ 0.60** | SUSPENDED | Do not rely on this score |

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="constitutional-governance"></a>

## 14 · Constitutional Governance Layer

Every scored output includes a `constitutional_status` block.

---

### Prohibited Uses — Two Enforcement Layers, Stated Exactly

Enforcement has two layers with different strengths, and this section states which is which so the output field and the documentation cannot contradict each other:

1. **Engine‑level keyword screen (v3.2.1).** When the caller provides `context.stated_purpose`, the engine checks it against the `PROHIBITED_USES` keyword list. A detected blocked use (e.g., "weaponization", "surveillance") refuses the score with a constitutional error. Insurance denial is flagged but not blocked. **This screen is only as good as the honesty of the declared purpose — a caller who omits or falsifies `stated_purpose` is not caught by it.**
2. **Caller responsibility (the governing layer).** Because the engine cannot observe the caller's actual use, ultimate enforcement responsibility rests with the deploying organization. This is why the output block reports `prohibited_uses_enforcement: "CALLER_RESPONSIBILITY"` — the field describes where the *governing* obligation sits, not the absence of the engine screen.

| Prohibited Use | Keywords | Engine Action |
|---|---|---|
| Surveillance | track individual, monitor person, identify individual, locate specific person | Block (Law 4) — when declared |
| Weaponization | target strike, fire solution, weapons coordinates, strike package | Block (Law 6) — when declared |
| Insurance denial | deny claim, reject insurance, coverage denial | Flag only |

---

### Consent Gate

The engine provides `getConsentForm()` but does not block scoring if consent has not been collected. Consent enforcement is the caller's obligation, and the output block reports `consent_gate: "CALLER_RESPONSIBILITY"` accordingly.

---

### Indigenous Data Sovereignty

CERTUS applies the UNDRIP Article 31 FPIC standard:

- Digital signature of community council required
- One‑year validity period
- Revocable at any time
- Community data ownership preserved

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="mock-data"></a>

## 15 · Mock Data Warning

⚠️ **Production deployments must read this section.**

Emergency contact numbers, shelter coordinates, and medical facility locations in CERTUS are mock data for testing only. Production deployments must override `MOCK_EMERGENCY_CONFIG` with live geospatial facility databases.

Every mock‑sourced return object carries:

- `stub: true` — programmatic detection flag
- `stub_warning` — human‑readable warning string

Callers must check for `stub: true` and reject mock data before any operational use.

> **Related silent failure mode:** if the integration wrapper calls `CERTUS.score()` without `await`, every report silently scores via the mock fallback with no error raised — a maximal‑latency failure in which responders could triage on placeholder scores. The single‑line check is documented in the VERITAS README's Critical Integration Note, and stamping `scoring_path: REAL | MOCK` inside the integrity seal (§6) is the declared engineering fix that makes mock‑scored datasets cryptographically self‑identifying.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="assumptions"></a>

## 16 · Declared Assumptions

| Assumption ID | Plain Language |
|---|---|
| COR-A01 | ⚠️ First report in this area. No other reports to confirm damage level. |
| DECAY-A01 | ⏱ Report fresh for 48h; evidence weight decays over 7 days. |
| DECAY-A02 | ⏱ Event‑specific decay active — earthquake/flood/cyclone profiles applied. |
| PES-A01 | 📷 Photo analyzed by placeholder model. Upgrade for higher confidence. |
| PES-A02 | 📷 No photo submitted. Report based on text description only. |
| NLP-A01 | 🌐 This report is not in English. The damage classifier works best in English — confidence may be lower than actual damage. |

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="initialization"></a>

## 17 · Initialization

```javascript
const CERTUS = new CERTUSEngine(); // or use the global singleton

await CERTUS.initialize(supabaseUrl, supabaseKey, {
  photoModel: {
    id:                   'openrouter/gpt-4o-mini+claude-3.5-sonnet',
    type:                 'openrouter',
    calibration_status:   'UNCALIBRATED',
    calibration_samples:  0,
    calibration_dataset:  'Primary: openai/gpt-4o-mini · Fallback: anthropic/claude-3-5-sonnet',
    registered_by:        'certus-deployment'
  },
  production: {
    photoApiHmacSecret: process.env.CERTUS_HMAC_SECRET,   // optional
    enableDensityRadiusLookup: false,                     // v3.2.2 – opt-in OSM density lookup (privacy)
    localEmergencyNumber: '911',                          // v3.2.2 – set per deployment country
    eventDecayProfiles: { /* custom curves */ }           // optional override
  }
});

// As field validation accumulates — no code changes required:
await CERTUS.updateModelCalibration(validatedSampleCount, 'PARTIAL');

// Access FCL calibration data:
const entries = CERTUS.getFCLEntries();

// Self‑calibration (v3.2.1):
const calibration = CERTUS.calibrateWeights(20);
if (calibration.calibrated && confirm('Apply new weights?')) {
  CERTUS.W = calibration.updated_weights_dampened;
}
```

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="output-structure"></a>

## 18 · Output Structure

```javascript
{
  // Core score
  dci:     0.71,
  dci_raw: 0.71,               // unadjusted (for calibration)
  dci_priority: 0.92,          // criticality‑adjusted (Medical=1.5×)
  tier:    "high",
  usable:  true,
  version: "3.2.2",

  // Integrity
  input_hash:     "sha256:7d4a2f1c...",
  integrity_seal: {
    algorithm: "SHA-256",
    hash:      "a3f2b8c1...",
    payload:   "{...}"          // canonical JSON
  },

  // Per-dimension scores
  dci_pes: 0.85,
  dci_cor: 0.60,
  dci_tfr: 0.75,
  dci_cci: 1.0,

  // Uncertainty
  dci_uncertainty_mass:   0.28,
  dci_validity_status:    "VALID",
  dci_um_breakdown: [
    "📷 Photo evidence clear — model UNCALIBRATED, full penalty applied",
    "🔍 No corroboration yet"
  ],

  // Diagnostics
  dci_strengths:   [],
  dci_weaknesses:  [],
  dci_bottleneck:  { dimension: "COR", value: 0.60 },
  dci_assumptions: "⚠️ First report in this area.",
  dci_assumptions_raw: [{ id: "COR-A01", plain_language: "..." }],

  // Field view (responder-facing)
  dci_field_view: {
    action:     "SHARE THIS REPORT",
    confidence: "HIGH",
    what_to_do: "Send this to response coordinators.",
    share_code: "VRT-8A3F-9B2E"
  },

  // Flags (v3.2.1 additions)
  dci_flags: {
    pes_gated:         false,
    cor_no_evidence:   true,
    cor_contradiction: false,
    language_mismatch: true,           // v3.2.1
    language_reported: "ar",           // v3.2.1
    language_nlp_dictionary: "en"      // v3.2.1
  },
  dci_cor_signal:          "NO_EVIDENCE",
  dci_reporter_reputation: { score: 0, banned: false },

  // New in v3.2.1
  dci_criticality_multiplier: 1.5,
  dci_criticality_reason: "Life‑critical — hospital/clinic",
  dci_spatial_cluster: { cluster_detected: false },
  dci_progression: { progression: "INSUFFICIENT_DATA" },
  dci_decay_reconciliation: { reconciled: false },

  // Abstraction bargain
  model_limitations: {
    /* Full declaration — 7+ discarded properties documented */
  },

  // Calibration
  fcl_entry_id: "FCL-1716076800-a3f2",

  // Governance — engine keyword screen active when purpose is declared (§14);
  // governing enforcement obligation rests with the caller, as these fields state:
  constitutional_status: {
    law_4_compliant:             true,
    prohibited_uses_enforcement: "CALLER_RESPONSIBILITY",
    consent_gate:                "CALLER_RESPONSIBILITY"
  },

  // Appeals
  appeal_status: {
    appeals_remaining:        3,
    cumulative_ceiling_active: true
  },

  audit_id: 1847
}
```

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="offline-mode"></a>

## 19 · Offline and Field Mode

| Feature | Implementation | Status |
|---|---|---|
| Offline scoring | Full engine runs in browser — no server required | ✅ Active |
| Offline photo AI | TensorFlow.js + xBD model — bundled in repository, **wiring planned (v3.3)**; current offline path uses clearly‑labeled mock analysis with full uncertainty penalty | ◐ Pending wiring |
| AI API fallback | Clearly‑labeled mock analysis when OpenRouter unavailable | ✅ Active |
| Service worker | Caches app shell for offline use | ✅ Active |
| IndexedDB | Local report storage with sync‑on‑reconnect | ✅ Active |
| Low‑literacy mode | Icon‑based interface with audio guidance | ✅ Active |
| Progress persistence | Survives connectivity interruption mid‑submission | ✅ Active |
| Batch reporting | Family / group multi‑location submissions | ✅ Active |

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="accessibility"></a>

## 20 · Accessibility

| Feature | Status |
|---|---|
| Icon‑based damage classification | ✅ Active |
| Full audio guidance (6 UN languages) | ✅ Active |
| Language fallback flag | ✅ Active |
| Large text mode | ✅ Active |
| Automatic dark mode | ✅ Active |
| Haptic feedback | ✅ Active |
| Batch reporting | ✅ Active |

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="deployment-readiness"></a>

## 21 · Deployment Readiness

The engine is **reference‑grade and audit‑hardened**: 57 findings found and resolved across the audit lineage, zero open. Production deployment is achieved by the deploying organization completing this checklist — the engine states it rather than claiming readiness on the deployer's behalf:

| # | Requirement | Where |
|---|---|---|
| 1 | Override `MOCK_EMERGENCY_CONFIG` with live facility databases; verify no `stub: true` objects reach operational paths | §15 |
| 2 | Set `PRODUCTION.photoApiHmacSecret` for signed photo API calls | §4 |
| 3 | Ensure the integration wrapper `await`s `CERTUS.score()` — verify real scoring path, not mock fallback | §15 note |
| 4 | Begin ground‑truth validation to move the photo model off UNCALIBRATED (full UM penalty applies until then) | §4, §5 |
| 5 | Implement operator‑managed dashboard authentication (see VERITAS README) | VERITAS |
| 6 | Assign the governing prohibited‑use and consent enforcement obligations within the deploying organization | §14 |
| 7 | Confirm GDPR deployment obligations (lawful basis, processor agreements) beyond the built‑in Article 20 mechanisms | §12 |
| 8 | Run `node --check` + the `tests/` smoke suite in CI on every commit — a non-parsing or claim-breaking engine must be unshippable | tests/ |
| 9 | Decide `enableDensityRadiusLookup`: leave off, or enable only against a self-hosted Overpass instance | §9.2 |

An engine with this checklist completed, a calibrated model, and a monitored deployment is production‑operational. Until then, it is a hardened reference implementation — which is the claim this document makes.

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>

---

<a name="roadmap"></a>

## 22 · Roadmap

| Feature | Status |
|---|---|
| Whistleblower channel (`/api/whistleblower`) | 🔵 Planned — v3.3 |
| Satellite imagery corroboration | 🔵 Planned — v3.3 |
| DCI weight recalibration from FCL entries | ✅ Active — `calibrateWeights()` implemented v3.2.2 |
| Multilingual NLP keyword dictionaries | 🔵 Planned — v3.3 |
| Live facility database (replaces mock data) | 🔵 Planned — v3.3 |
| xBD offline model wiring (local inference) | 🔵 Planned — v3.3 |
| `scoring_path` stamped in integrity seal (REAL/MOCK self‑identification) | 🔵 Planned — next engine revision |
| VELA constitutional veil integration | 🔵 Planned — v3.3 |
| Offline voice recognition (real) | 🔵 Planned — v3.3 |

---

<div align="center">

---

CERTUS is an application of the AION Constitutional Stack — specifically FSVE certainty scoring, CAL code governance, ECF epistemic tagging, and validity threshold enforcement.

The v3.2.2 engine is the most advanced version in the stack, having undergone a complete four‑instrument adversarial audit lineage (PDE → EAE → ANTI‑FORGE → CAL) plus an independent execution-level code review, with all 76 findings — including 3 FATAL and 9 CRITICAL — found and resolved, zero open, and every repair locked by an executed test suite. It is horizontally scalable, multi‑tenant, equipped with GDPR Article 20 data‑portability mechanisms, humanitarian‑equity‑conscious, and reference‑grade for enterprise, government, and humanitarian deployment via the §21 readiness checklist.

**Audit‑hardened. Uncertainty‑engineered. Deployment‑ready via §21.**

Sheldon K. Salmon & ALBEDO · AionSystem · May 2026

### License

This project is licensed under the Apache License, Version 2.0.
See the LICENSE file for details.

**Retroactive Notice:** All previous versions of CERTUS Engine (including v2.5.2, v3.0.1, v3.1.0, v3.2.0, and v3.2.1) are also released under the Apache License 2.0.

</div>

---

<div align="right">

[↑ Back to Table of Contents](#top)

</div>
