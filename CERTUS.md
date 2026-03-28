## CERTUS.md

```markdown
# CERTUS Engine v1.0

> **Certainty Engineering for Crisis Data**

CERTUS is the core scoring engine that powers VERITAS. It computes a **Damage Confidence Index (DCI)** for every report, giving responders an immediate measure of how much to trust that report *before* they act on it.

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
- **Why neutral?** The first reporter should not be penalised; “unverified” ≠ “wrong”.

### 3. Temporal Freshness (TFR)
```

TFR = max(0, 1 - hours_elapsed / 48)

```
A report submitted at hour 0 scores 1.0; at hour 48 scores 0.0.

### 4. Classification Consistency (CCI)
- Baseline 1.0 if all fields logically consistent.
- Reduced to 0.70–0.80 for suspicious combinations (e.g., “Total Collapse” on a Road or Utility line).
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