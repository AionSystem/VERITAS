# CERTUS Engine v2.5.3

> **Certainty Engineering for Crisis Data**

CERTUS is the core scoring engine that powers VERITAS. It computes a **Damage Confidence Index (DCI)** for every report, along with an **Uncertainty Mass (UM)** that tells responders how much to trust the score itself.

*Author: Sheldon K. Salmon & ALBEDO · AionSystem · April 2026*

---

## The Dispatch Desk — What CERTUS Actually Is

*You don't need the formula to understand this. Start here.*

---

Picture a dispatch desk in a crisis operations center. The phones are ringing. Reports are coming in from across a city that just took a direct hit — hundreds of them, then thousands. Each one is a person with a phone, standing somewhere, telling you what they see.

Some of them are right. Some of them are wrong. Some are standing in front of a building that looked fine an hour ago and has since half-collapsed. Some are describing rubble from two blocks away, not the building in the photo. Some are submitting the same location twice because they weren't sure the first one went through. And some — a small number — are submitting deliberately false reports to redirect response resources.

The operator at the dispatch desk has one job: before a truck moves, before a team deploys, before a resource gets committed — **figure out which reports to trust.**

That operator is CERTUS.

---

Every report that arrives on the desk gets a number. Not a guess. A number built from four separate lines of evidence — the photo, the neighborhood consensus, the timestamp, and an internal logic check. CERTUS weighs all four, combines them, and writes a single score on the top of the report: a number between 0.0 and 1.0.

But that's not all. CERTUS also calculates an **Uncertainty Mass (UM)** — a measure of how much uncertainty is baked into that score. A high-confidence score with low uncertainty is actionable. A high-confidence score with high uncertainty? That's a warning sign. The UM tells you:

| UM | Status | Meaning |
|----|--------|---------|
| < 0.35 | VALID | Score is reliable — act on it |
| 0.35–0.60 | DEGRADED | Score useful but uncertain — verify locally |
| > 0.60 | SUSPENDED | Do not rely — must field-verify first |

Then it stamps the report with a color and routes it.

🟢 **Green** — the score is 0.70 or above AND UM < 0.35. CERTUS is confident. This report goes to the front of the stack. Responders can act on it.

🟡 **Amber** — the score is between 0.40 and 0.69 OR UM is 0.35–0.60. Something is uncertain — maybe only one person reported it, maybe the photo was blurry, maybe the report is 30 hours old. Watch it. Don't ignore it. Don't act on it alone.

🔴 **Red** — the score is below 0.40 OR UM > 0.60. CERTUS is raising its hand. A human needs to look at this before anything moves. Not because the reporter is lying — they probably aren't — but because the evidence isn't strong enough yet to stake a deployment decision on it.

---

There is one additional rule at the dispatch desk. It fires even before the score is calculated.

If two reports arrive from the same address and they contradict each other — one says "Completely damaged," one says "Minor damage" — CERTUS flags the location as a **conflict**. The whole location goes red immediately, regardless of what the individual scores would have been. Contradicting reports at the same address don't average out. They signal that something is genuinely unknown, and unknown is not a safe basis for action.

A human resolves the conflict. Then the location is re-evaluated.

---

One more thing the operator notices. When a cluster of reports arrives from the same GPS cluster, at the same time, with photos that look similar — CERTUS raises a flag before routing any of them. Evidence from people who were all in the same place at the same time, comparing notes, is not five independent confirmations. It may be one shared perception submitted five times. CERTUS knows the difference.

This is the entire purpose of the engine. Not to replace the reporter. Not to replace the responder. To sit between them and do the one thing both of them need: translate raw human signals into a number that honestly represents how much those signals should be trusted, and tell you how sure it is about that number.

The trucks move on green. The humans watch amber. The red pins wait for eyes.

---

## Formula

```
DCI = (0.35 × PES_eff) + (0.30 × COR) + (0.20 × TFR) + (0.15 × CCI)
```

| Component | Description | Range |
|-----------|-------------|-------|
| **PES_eff** | Photo Evidence Score — AI analysis via OpenRouter, gated at model confidence ≥0.60, scaled by graduated model trust | 0.0 – 1.0 |
| **COR** | Corroboration Score — agreement with independent reports within 50m, adjusted for evidence independence | 0.0 – 1.0 |
| **TFR** | Temporal Freshness — linear decay over 48 hours; evidence recency separately weighted over 168-hour window | 0.0 – 1.0 |
| **CCI** | Classification Consistency — cross-category logic check | 0.0 – 1.0 |

**Epistemic Ceiling:** No DCI score can exceed **0.95**. Field conditions always carry residual uncertainty. This constraint is architectural and not configurable.

---

## Graduated Photo Model Trust

CERTUS does not assume any AI model is trustworthy without a declaration. Instead, it uses a **graduated model trust score** [0.0–1.0] derived from calibration evidence, which directly and continuously reduces the PES uncertainty penalty as ground truth accumulates.

| Trust Score | Calibration Status | PES UM Penalty | Measurement Class |
|------------|-------------------|----------------|-------------------|
| 0.0 | UNCALIBRATED (no ground truth) | 0.20 | INFERENTIAL |
| 0.01–0.59 | PARTIAL (1–249 validated reports) | 0.08–0.20 | EVALUATIVE_PARTIAL |
| 0.60–0.85 | PARTIAL (250–499 validated reports) | 0.03–0.08 | EVALUATIVE_PARTIAL |
| 1.0 | VERIFIED (formally calibrated) | 0.00 | EVALUATIVE_CERTIFIED |

The trust score is declared at initialization and logged immutably to the audit trail. No code changes are required as calibration evidence accumulates — the engine reduces its own penalty continuously via `updateModelCalibration()`.

**Current deployment:** `openrouter/gpt-4o-mini+claude-3.5-sonnet` registered as UNCALIBRATED. Full UM penalty applies. Every scored report declares this explicitly.

---

## Thresholds & Actions

| DCI Range | Tier | UM Threshold | Pin Color | Action |
|-----------|------|--------------|-----------|--------|
| ≥ 0.70 | High Confidence | < 0.35 | 🟢 Green | Trusted, ready for triage |
| 0.40 – 0.69 | Watch | < 0.60 | 🟡 Amber | Monitor; verify locally |
| < 0.40 | Review Required | any | 🔴 Red | **Human verification required** |
| any | any | > 0.60 | 🔴 Red | **Do not act — field verification required** |

---

## Sub-Component Details

### 1. Photo Evidence Score (PES_eff)

VERITAS uses **OpenRouter** to access AI models for damage assessment:

| Priority | Model | Purpose |
|----------|-------|---------|
| Primary | GPT-4o-mini (OpenAI via OpenRouter) | Fast, cost-efficient damage assessment |
| Fallback | Claude 3.5 Sonnet (Anthropic via OpenRouter) | Higher-accuracy fallback if primary fails |

**How it works:**
1. User captures photo — Canvas API strips EXIF metadata
2. Image sent to OpenRouter with structured prompt
3. AI returns: damage level, confidence score, description
4. CERTUS derives a model trust score from registered calibration data
5. If confidence < 0.60 → PES_eff applies trust-scaled gate: `max(0.10, 0.30 × (1 − trust_score))`
6. If confidence ≥ 0.60 → PES_eff used directly; UM penalty = `max(0, 0.20 × (1 − trust_score))`
7. If API unavailable → falls back to TensorFlow.js offline model (xBD dataset)

**The `isRealModel` flag is deprecated as of v2.5.3.** All deployments must register a model via `CERTUS.registerPhotoModel(config)` at initialization. The binary flag is retained for backward compatibility only and issues a deprecation warning.

### 2. Corroboration Score (COR) — With Evidence Independence

| Scenario | Score | Uncertainty Contribution |
|----------|-------|--------------------------|
| No nearby reports | Not evaluable (excluded) | +0.35 UM |
| One nearby report, agrees | 0.55 | +0.05 UM |
| One nearby report, disagrees | 0.40 | +0.05 UM |
| Multiple independent reports, strong agreement | > 0.70 | 0 UM |
| Multiple reports, contradiction | < 0.40 | +0.08 UM |
| Correlated reports detected | Down-weighted | Treated as fewer independent sources |

**Evidence Independence Detection.** CERTUS detects when multiple reports are likely correlated — same submitter cluster, same time window, same GPS cluster, similar photos. Correlated evidence is down-weighted before entering the COR calculation. Three reports from the same WhatsApp group at the same moment are not three independent confirmations.

**Why "Not evaluable" instead of neutral?** Absence of evidence is not evidence of absence. When no other reports exist, CERTUS declares the dimension unevaluable rather than assigning a false neutral score.

### 3. Temporal Freshness (TFR)

```
TFR = max(0, 1 - hours_elapsed / 48)
```

| Hours | TFR | Status | Uncertainty |
|-------|-----|--------|-------------|
| 0 | 1.0 | FRESH | 0 |
| 12 | 0.75 | FRESH | 0 |
| 24 | 0.50 | AGING | +0.05 |
| 36 | 0.25 | STALE | +0.10 |
| 48+ | 0.0 | EXPIRED | +0.15 |

Evidence recency is separately weighted over a **168-hour (7-day) window** for evidence that may remain relevant beyond the 48-hour crisis peak.

### 4. Classification Consistency (CCI)

| Combination | CCI | Uncertainty | Reason |
|-------------|-----|-------------|--------|
| Any + any | 1.0 | 0 | Consistent |
| "Completely damaged" + "Road" | 0.70 | +0.08 | Roads rarely achieve total collapse |
| "Completely damaged" + "Utility" | 0.75 | +0.08 | Utility infrastructure rarely total collapse |
| Missing classification | 0.80 | 0 | Default |

---

## Signal Intelligence Layer

CERTUS does not treat submitted data as atomic facts. v2.5.3 adds active signal interrogation before any dimension is scored.

**NLP Witness Statement Analysis.** Text fields are analyzed to extract damage-level signals and infer infrastructure type directly from descriptions. A reporter who writes "the school on the corner has no roof left" contributes a structured inference, not just free text.

**Source Credibility Scoring.** Evidence sources are assigned credibility weights before entering the COR calculation:

| Source Type | Credibility Weight |
|-------------|-------------------|
| First-hand witness | 0.9 |
| Community-verified reporter | Bonus applied at COR |
| Unverified secondhand | Reduced weight |

**Cross-Validation.** Photo evidence, text description, and GPS location are cross-checked for consistency. A photo showing minor damage submitted with a "complete destruction" classification triggers a CCI penalty. Inconsistencies are named explicitly in the scored output.

---

## Adversarial Resistance

CERTUS was designed from the start to be gamed, and built to resist it.

**Adversarial Pattern Detection.** Multi-signal detection runs on every batch: duplicate photo detection via perceptual hashing (dHash in browser, FNV-1a in Node), temporal clustering analysis, submission rate monitoring, coordinate proximity clustering.

**Reporter Reputation System.** Every reporter carries a reputation score updated after field verification:

| Event | Reputation Change |
|-------|------------------|
| Field-verified accurate report | +10 |
| Confirmed false report | −20 |
| Ban threshold | −100 |

Banned reporters are blocked at the scoring layer. Blocks are logged to the audit trail as `BANNED_REPORTER_BLOCKED` — not silently rejected.

**Community Verification Badges.** Reporters with consistently verified submissions earn community verification status. Their submissions carry a source credibility bonus and are surfaced with a badge in the responder dashboard.

---

## Reporter Accountability

**Appeal Workflow.** Every reporter may appeal a SUSPENDED or DEGRADED score up to **3 times per report**, with new evidence required per appeal. Appeals are rate-limited (1 per report per hour; 10 per IP per hour).

**Data Correction Workflow.** Reporters may submit corrections to filed reports via `/api/correction`. Corrections are versioned and audited.

**Whistleblower Channel** *(planned).* An anonymous channel for reporting bribery, coercion, or badge misuse. Architectural specification is complete — one-time tracking code, no identity storage. Endpoint: `/api/whistleblower`. Status: planned for v2.6.

---

## Uncertainty Mass (UM) — How It Works

The Uncertainty Mass (UM) is a composite measure of how much uncertainty is embedded in the DCI score. It aggregates contributions from all four dimensions plus the photo model trust score, with special handling for correlated failures.

### UM Components

| Source | Base Contribution | Condition |
|--------|-------------------|-----------|
| No photo | +0.25 | PES excluded |
| UNCALIBRATED model | +0.20 | trust_score = 0.0 |
| PARTIAL calibration | +0.03–0.20 | trust_score 0.01–0.85 |
| VERIFIED model | +0.00 | trust_score = 1.0 |
| AI confidence gated | Scaled by trust | Model confidence < 60% |
| No corroboration | +0.35 | COR excluded |
| Weak corroboration | +0.05 | Only one nearby report |
| Contradiction | +0.08 | Multiple reports disagree |
| Correlated evidence | Down-weighted | Sources not independent |
| Aging report | +0.05–0.15 | Based on hours elapsed |
| Classification flagged | +0.08 | Suspicious combination |
| Correlated failures | +0.20–0.60 | Multiple missing dimensions |

### UM Calculation

```
UM = 1 − ∏(1 − p_i)
```

Where `p_i` are the uncertainty contributions from each dimension. If correlated failures are detected (e.g., both photo and corroboration missing), an additional penalty is applied.

### UM Thresholds

| UM Range | Validity Status | Meaning |
|----------|-----------------|---------|
| < 0.35 | VALID | Score is reliable |
| 0.35–0.60 | DEGRADED | Score useful but uncertain |
| > 0.60 | SUSPENDED | Do not rely on this score |

---

## Constitutional Governance Layer

Every scored output includes a `constitutional_status` block — a governance instrument declared on every report.

**Prohibited Uses** (declared, caller-enforced):
- Community profiling
- Political targeting
- Discriminatory resource allocation
- Facial recognition
- Individual identification

> These prohibitions are a contract, not a circuit breaker. The engine surfaces them on every output. Enforcement is the caller's responsibility — treating them as a technical gate would be false assurance.

**Consent Gate.** The engine provides `getConsentForm()` but does not block scoring if consent has not been collected. Consent enforcement is the caller's obligation.

**Use Monitoring.** Every deployment records `last_review` timestamp and reviewer identity. Use monitoring is enabled by default.

**Indigenous Data Sovereignty.**

| Governance Layer | Implementation |
|-----------------|----------------|
| Consent Standard | UNDRIP Article 31 — FPIC |
| Consent Proof | Digital signature of community council |
| Consent Validity | One year, revocable at any time |
| Data Ownership | Community |
| Enforcement | Smart contract registry |
| Audit Trail | Blockchain-immutable |
| Traditional Knowledge | Protected |

---

## Conflict Detection

When two reports within 50 meters disagree on damage tier, they are flagged as a **conflict** in the responder dashboard.

- Conflict = automatic Review Required for that location
- Individual DCI scores still shown but flagged
- Human must resolve before resources are deployed

---

## Declared Assumptions

CERTUS explicitly declares its assumptions rather than hiding them in the score:

| Assumption | Plain Language |
|------------|----------------|
| No nearby reports exist | ⚠️ First report in this area. No other reports to confirm damage level. |
| No photo submitted | 📷 No photo submitted. Report based on text description only. |
| Model UNCALIBRATED | 📷 Photo analyzed by uncalibrated model. Full uncertainty penalty applied. |
| Correlated evidence detected | ⚠️ Multiple reports appear related. Independent corroboration needed. |

Every assumption carries an identifier (`COR-A01`, `PES-A01`) and appears in the output so downstream systems can reason about it.

---

## Output Structure

```javascript
{
  dci: 0.71,                       // Damage Confidence Index (max 0.95)
  tier: "high",                    // high / watch / review
  usable: true,                    // false if SUSPENDED + no human review

  // Dimensional scores
  dci_pes: 0.85,
  dci_cor: 0.60,
  dci_tfr: 0.75,
  dci_cci: 1.0,

  // Uncertainty infrastructure
  dci_uncertainty_mass: 0.28,
  dci_validity_status: "VALID",
  dci_um_breakdown: [
    "✅ Photo evidence clear — model UNCALIBRATED, full penalty applied",
    "⚠️ No corroboration yet — share to improve"
  ],

  // Signal intelligence
  dci_nlp_inferences: { damage_level: "COMPLETE", infrastructure_type: "RESIDENTIAL" },
  dci_source_credibility: 0.9,
  dci_evidence_independent: true,

  // Reporter accountability
  dci_reporter_reputation: 0,
  appeal_status: {
    appeals_remaining: 3,
    requires_new_evidence: true,
    appeal_endpoint: "/api/appeal"
  },
  correction_endpoint: "/api/correction",

  // Assumptions (plain language)
  dci_assumptions: "⚠️ First report in this area. No other reports to confirm damage level.",

  // Actionable guidance
  dci_field_view: {
    action: "SHARE THIS REPORT",
    confidence: "HIGH",
    what_to_do: "Send this to response coordinators. Your report is verified.",
    share_code: "VRT-8A3F-9B2E"
  },

  // Constitutional status
  constitutional_status: {
    law_4_compliant: true,
    prohibited_uses: ["community profiling", "political targeting", "facial_recognition"],
    prohibited_uses_enforcement: "CALLER_RESPONSIBILITY",
    consent_gate: "CALLER_RESPONSIBILITY",
    use_monitoring: "enabled",
    last_review: "2026-04-01",
    reviewer: "Polymath Council"
  }
}
```

---

## Offline & Field Mode

CERTUS is designed for low-connectivity environments:

| Feature | Implementation |
|---------|---------------|
| Offline scoring | Full engine runs in browser |
| Offline AI | TensorFlow.js + xBD dataset — local inference, no API required |
| AI API fallback | Mock analysis (neutral scores) when OpenRouter unavailable |
| Service worker | Caches app shell for offline use |
| IndexedDB | Stores reports locally, syncs when back online |
| Low-literacy mode | Icon-based interface, audio guidance |
| Progress persistence | Partial reports survive connectivity interruption |
| Family/group reporting | Batch submission for multiple locations in one session |

---

## Accessibility

| Feature | Status |
|---------|--------|
| Icon-based damage classification | Active |
| Full audio guidance (6 UN languages) | Active |
| Language fallback flag | Active |
| Large text mode | Active |
| Automatic dark mode | Active |
| Haptic feedback (confidence confirmation) | Active |
| Family/group batch reporting | Active |

---

## Roadmap (v2.6+)

| Feature | Status |
|---------|--------|
| Whistleblower channel (`/api/whistleblower`) | Planned |
| Satellite imagery corroboration layer | Planned |
| Cross-disaster calibration from field feedback | Active — begins with first deployment |
| Expanded audio guidance | Active |

---

## Initialization

```javascript
await CERTUS.initialize(supabaseUrl, supabaseKey, {
  photoModel: {
    id: 'openrouter/gpt-4o-mini+claude-3.5-sonnet',
    type: 'openrouter',
    calibration_status: 'UNCALIBRATED',
    calibration_samples: 0,
    calibration_dataset: 'Primary: openai/gpt-4o-mini, Fallback: anthropic/claude-3-5-sonnet',
    registered_by: 'certus-deployment'
  }
});

// As field validation accumulates — no code changes required:
await CERTUS.updateModelCalibration(validatedSampleCount, 'PARTIAL');
```

---

CERTUS is an application of the AION Constitutional Stack — specifically FSVE certainty scoring, ECF tagging, and validity threshold enforcement. The engine underwent systematic adversarial review across multiple attack surfaces before v2.5.3 was finalized. It is production-ready.
