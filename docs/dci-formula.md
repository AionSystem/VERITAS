# DCI Formula – CERTUS Engine v1.0

## Definition

**Damage Confidence Index (DCI)** is a composite score that measures the epistemic reliability of a community damage report. It ranges from 0.0 to 1.0, with higher values indicating greater confidence.

## Formula

```

DCI = (w₁ × PES_eff) + (w₂ × COR) + (w₃ × TFR) + (w₄ × CCI)

```

Where:

| Symbol | Weight | Component | Description |
|--------|--------|-----------|-------------|
| PES_eff | 0.35 | Photo Evidence Score (effective) | AI confidence that photo matches reported damage; gated at model confidence ≥0.60 |
| COR | 0.30 | Corroboration Score | Agreement with other reports within 50m (neutral 0.50 for single) |
| TFR | 0.20 | Temporal Freshness | Linear decay over 48 hours |
| CCI | 0.15 | Classification Consistency | Cross‑category logic check |

## Thresholds

| DCI | Tier | Meaning |
|-----|------|---------|
| ≥ 0.70 | High Confidence | Trusted for triage |
| 0.40 – 0.69 | Watch | Monitor; may require verification |
| < 0.40 | Review Required | **Human verification required before informing deployment** |

## Detailed Sub‑Components

### PES_eff (Photo Evidence Score – effective)

```

if (model_confidence >= 0.60):
PES_eff = model_PES
else:
PES_eff = 0.50

```

- **model_PES** = confidence of TensorFlow.js model (trained on xBD) that the photo contains damage consistent with the selected tier.
- **model_confidence** = overall model confidence in its prediction.
- **Gate value 0.60** chosen as a conservative threshold to avoid using low‑confidence predictions.

### COR (Corroboration Score)

```

if (total_reports_nearby == 0):
COR = 0.50
else:
COR = agreement_ratio - (0.15 × contradictions)
COR = max(0, min(1, COR))

```

- **agreement_ratio** = number of reports with same tier / total reports within 50m.
- **contradictions** = number of reports with different tiers.
- **Why neutral for single?** First report is not automatically wrong; unverified ≠ wrong.

### TFR (Temporal Freshness)

```

TFR = max(0, 1 - (hours_since_submission / 48))

```

- Reports submitted in the first hour = 0.98; at 48 hours = 0.0.

### CCI (Classification Consistency)

- **1.0** if no logical contradiction detected.
- **0.70** for “Total Collapse” on Road.
- **0.75** for “Total Collapse” on Utility.
- Otherwise **1.0**.

Future versions will incorporate more complex cross‑category logic.

## Example Calculation

**Report:**  
- PES_eff = 0.85 (AI high confidence)  
- COR = 0.80 (3 reports nearby, all same tier)  
- TFR = 0.95 (submitted 2 hours ago)  
- CCI = 1.0 (consistent)

```

DCI = (0.35×0.85) + (0.30×0.80) + (0.20×0.95) + (0.15×1.0)
= 0.2975 + 0.24 + 0.19 + 0.15
= 0.8775 → High Confidence


```


*For implementation details, see [`../CERTUS.md`](../CERTUS.md).*