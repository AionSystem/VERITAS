# DCI Formula – CERTUS Engine v1.0

---

## The Four Witnesses — A Spatial Guide to What the Engine Actually Does

*You don't need the formula to understand the idea. Start here.*

---

Imagine a courtroom. Not a dramatic one — a quiet one. The only question on the table is simple: **how much should we trust this report?**

A community member just submitted a damage report. They took a photo of a collapsed building. They selected "Completely damaged." They hit send. The report arrives in the CERTUS Engine.

The Engine doesn't just believe it. It doesn't disbelieve it either. It calls four witnesses.

---

**Witness One: The Camera**
*(This is PES_eff — Photo Evidence Score)*

The first witness is the photo itself, analyzed by an AI trained on 850,000 images of disaster damage from 19 real crises around the world. It looks at the picture and asks: does what I see match what the reporter claimed?

If the photo shows a crumbled wall, missing roof, and structural failure — and the reporter said "Completely damaged" — the Camera nods. High score. If the photo is blurry, dark, or shows a building that looks fine while the reporter claimed total collapse — the Camera hesitates. Low score.

But here's the rule: if the Camera isn't sure enough about what it's seeing — if its own confidence drops below 60% — it doesn't vote. It abstains. It gives a neutral score rather than mislead the jury. The Camera only testifies when it's sure enough to be useful.

**What it contributes:** 35% of the final verdict.

---

**Witness Two: The Neighborhood**
*(This is COR — Corroboration Score)*

The second witness looks out the window at the surrounding block. It asks: are other people saying the same thing?

If three other reporters have stood at the same address and said "Completely damaged" — the Neighborhood nods. Consensus. If another reporter stood at the same address and said "Minor damage" — the Neighborhood raises its hand. Contradiction. Something doesn't add up.

If nobody else has reported from that location yet, the Neighborhood doesn't condemn and doesn't endorse. It gives a neutral score — 0.50 — because silence isn't proof of anything. The first report is not automatically wrong. It's just unconfirmed.

**What it contributes:** 30% of the final verdict.

---

**Witness Three: The Clock**
*(This is TFR — Temporal Freshness)*

The third witness checks the timestamp. When was this report submitted?

A report submitted twenty minutes after the earthquake is more likely to reflect current reality than one submitted thirty-six hours later, after roads have been cleared, walls have been shored up, or conversely, more of the structure has collapsed. Damage is not static. The world keeps moving after the crisis hits.

The Clock gives full weight to a fresh report. It begins reducing that weight gradually — not punishing old reports, just reflecting the honest truth that a 47-hour-old report may no longer accurately describe what's standing. At exactly 48 hours, the freshness score reaches zero. The report doesn't disappear. It just stops counting toward triage decisions.

**What it contributes:** 20% of the final verdict.

---

**Witness Four: The Logic Check**
*(This is CCI — Classification Consistency)*

The fourth witness is the quietest. It asks one question: does this make sense?

"Completely destroyed" on a residential building — plausible. "Completely destroyed" on a road — a road can be cracked, buckled, flooded, blocked, but a road doesn't collapse the same way a building does. The Logic Check notices this mismatch. It doesn't throw out the report. It just reduces the confidence slightly — a flag, not a rejection.

Most of the time, the Logic Check is silent. Most reports are internally consistent. When it does speak, it's saying: *a human should look at this before acting on it.*

**What it contributes:** 15% of the final verdict.

---

**The Verdict**

The four witnesses give their testimony. The Engine weights each one — the Camera most heavily, the Logic Check least — and combines them into a single number between 0.0 and 1.0. That number is the **Damage Confidence Index (DCI)**.

A 🟢 green pin on the responder map means the jury reached a strong verdict: trust this report, act on it.

A 🟡 amber pin means the jury is watching: the report is plausible but not yet confirmed.

A 🔴 red pin means the jury is divided: a human needs to look before anything moves.

The Engine doesn't tell responders *what* happened. It tells them *how much to trust what they've been told.* That distinction is the whole point.

---

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
- **0.70** for "Total Collapse" on Road.
- **0.75** for "Total Collapse" on Utility.
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

---

*For implementation details, see [`../CERTUS.md`](../CERTUS.md).*

🔧 Active: VEIN v1.0
