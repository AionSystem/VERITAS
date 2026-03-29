# CERTUS Engine v1.0

> **Certainty Engineering for Crisis Data**

CERTUS is the core scoring engine that powers VERITAS. It computes a **Damage Confidence Index (DCI)** for every report, giving responders an immediate measure of how much to trust that report *before* they act on it.

---

## The Dispatch Desk — What CERTUS Actually Is

*You don't need the formula to understand this. Start here.*

---

Picture a dispatch desk in a crisis operations center. The phones are ringing. Reports are coming in from across a city that just took a direct hit — hundreds of them, then thousands. Each one is a person with a phone, standing somewhere, telling you what they see.

Some of them are right. Some of them are wrong. Some are standing in front of a building that looked fine an hour ago and has since half-collapsed. Some are describing rubble from two blocks away, not the building in the photo. Some are submitting the same location twice because they weren't sure the first one went through.

The operator at the dispatch desk has one job: before a truck moves, before a team deploys, before a resource gets committed — **figure out which reports to trust.**

That operator is CERTUS.

---

Every report that arrives on the desk gets a number. Not a guess. A number built from four separate lines of evidence — the photo, the neighborhood consensus, the timestamp, and an internal logic check. (Those four are explained in full in [The Four Witnesses](dci-formula.md).) CERTUS weighs all four, combines them, and writes a single score on the top of the report: a number between 0.0 and 1.0.

Then it stamps the report with a color and routes it.

🟢 **Green** — the score is 0.70 or above. CERTUS is confident. This report goes to the front of the stack. Responders can act on it.

🟡 **Amber** — the score is between 0.40 and 0.69. Something is uncertain — maybe only one person reported it, maybe the photo was blurry, maybe the report is 30 hours old. Watch it. Don't ignore it. Don't act on it alone.

🔴 **Red** — the score is below 0.40. CERTUS is raising its hand. A human needs to look at this before anything moves. Not because the reporter is lying — they probably aren't — but because the evidence isn't strong enough yet to stake a deployment decision on it.

---

There is one additional rule at the dispatch desk. It fires even before the score is calculated.

If two reports arrive from the same address and they contradict each other — one says "Completely damaged," one says "Minor damage" — CERTUS flags the location as a **conflict**. The whole location goes red immediately, regardless of what the individual scores would have been. Contradicting reports at the same address don't average out. They signal that something is genuinely unknown, and unknown is not a safe basis for action.

A human resolves the conflict. Then the location is re-evaluated.

---

This is the entire purpose of the engine. Not to replace the reporter. Not to replace the responder. To sit between them and do the one thing both of them need: translate raw human signals into a number that honestly represents how much those signals should be trusted.

The trucks move on green. The humans watch amber. The red pins wait for eyes.

---

## Formula

```
DCI = (0.35 × PES_eff) + (0.30 × COR) + (0.20 × TFR) + (0.15 × CCI)
```

Where:

| Component | Description | Range |
|-----------|-------------|-------|
| **PES_eff** | Photo Evidence Score (effective) – AI analysis of image, gated at model confidence ≥0.60 | 0.0 – 1.0 |
| **COR** | Corroboration Score – agreement with other reports within 50m (neutral 0.50 for single) | 0.0 – 1.0 |
| **TFR** | Temporal Freshness – linear decay over 48 hours | 0.0 – 1.0 |
| **CCI** | Classification Consistency – cross‑category logic check | 0.0 – 1.0 |

## Thresholds & Actions

| DCI Range | Tier | Pin Color | Action |
|-----------|------|-----------|--------|
| ≥ 0.70 | High Confidence | 🟢 Green | Trusted, ready for triage |
| 0.40 – 0.69 | Watch | 🟡 Amber | Monitor; may require verification |
| < 0.40 | Review Required | 🔴 Red | **Human verification required before informing deployment** |

## Sub‑Component Details

### 1. Photo Evidence Score (PES_eff)
- **Model**: MobileNet v2 fine‑tuned on xBD dataset (850k building polygons, 19 disaster types).
- **Inference**: TensorFlow.js, runs completely offline in the browser.
- **Confidence Gate**: If model confidence < 0.60, PES_eff = 0.50 (neutral). This prevents low‑confidence AI predictions from skewing the DCI.

### 2. Corroboration Score (COR)
- Single report → 0.50 (neutral, not penalised).
- Multiple reports → `agreement_ratio - (0.15 × contradictions)`, floor 0.0.
- Radius: 50 meters.
- **Why neutral?** The first reporter should not be penalised; "unverified" ≠ "wrong".

### 3. Temporal Freshness (TFR)
```
TFR = max(0, 1 - hours_elapsed / 48)
```
A report submitted at hour 0 scores 1.0; at hour 48 scores 0.0.

### 4. Classification Consistency (CCI)
- Baseline 1.0 if all fields logically consistent.
- Reduced to 0.70–0.80 for suspicious combinations (e.g., "Total Collapse" on a Road or Utility line).
- Future expansions: cross‑reference with infrastructure type, surrounding land use.

## Conflict Detection

When two reports within 50 meters disagree on damage tier, they are flagged as a **conflict** in the responder dashboard.
Conflict = automatic **Review Required** for that location, regardless of individual DCI.

## Roadmap (v2.0)
- Adaptive retraining: use field‑verified reports to improve model.
- Satellite imagery corroboration.
- Cross‑disaster calibration.

---

*CERTUS is an application of the AION Constitutional Stack — specifically FSVE certainty scoring, ECF tagging, and validity threshold enforcement.*

🔧 Active: VEIN v1.0
