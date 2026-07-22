# Changelog

All notable changes to VERITAS are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Status marks used in this project: **✅ complete** · **◐ partial (architecture present, completion path stated)** · **✗ not met**.

---

## [3.0.0] — 2026-07-22

The largest correctness and honesty pass in the project's history. The CERTUS engine
advanced two generations (v2.5 → v3.2.2) and became the first version proven to run,
not merely read. The photo-to-score pipeline was made honest end to end, a sealed
rescue-acknowledgment capability was added, and every document was reconciled to state
claims at exactly the strength the code supports.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v2.5.3...v3.0.0

### Added
- **Sealed rescue-acknowledgment receipt.** A responder can acknowledge a rescue signal
  on the dashboard; the acknowledgment is STP-sealed (triple-time, tamper-evident) and
  returns to the sender's device, showing "a responder saw your signal at T." Proves the
  signal was *seen* — never that rescue is dispatched — stated in all six UN languages.
  Works cross-device via the shared backend and single-device via local storage (offline-safe).
- Distinct pulsing 🆘 marker for rescue signals on the responder dashboard, rendered above
  damage pins, with an "Acknowledge — seen" action.
- CI workflow (`.github/workflows/certus-ci.yml`): parse check plus a 21-check runtime
  smoke suite on every push and PR, so a non-parsing or claim-breaking engine cannot merge.
- Engine runtime smoke-test suite (`tests/certus-engine.smoke.test.js`).
- Deployment-readiness checklist and "Post-Submission Hardening" record in the docs.

### Changed
- **CERTUS engine v2.5 → v3.2.2**, execution-verified. Now passes `node --check` and the
  runtime suite; async `score()` correctly awaited throughout the frontend.
- Frontend loads `certus-engine-v3.2.2.js` (was the pre-audit `certus-engine-v2.5.js`).
- Photo-to-score pipeline made honest end to end: when AI analysis is unavailable, the
  system records *no* judgment (NOT_EVALUABLE) rather than a fabricated one, and mock
  scores are clearly labeled wherever a user sees them.
- Graduated photo-model trust: real models carry a declared uncertainty penalty until
  ground-truth calibration accumulates; the penalty reduces automatically with no code change.
- Documentation reconciled to a three-state (✅/◐/✗) honesty standard across README,
  CERTUS.md, and the UNDP compliance file. Offline photo AI and AI-features honestly marked
  partial; licence stated consistently as GPL-3.0; engine version consistent across all files.
- Rescue messaging brought inside the boundary in all six languages ("seen," never "help is
  on the way").

### Fixed
Independent execution-level code review — 19 findings resolved (2 FATAL, 4 CRITICAL, 4 HIGH,
6 MEDIUM, 3 LOW); cumulative across the full audit lineage: **76 resolved, 0 open**.
- **FATAL** — engine did not parse (stray class-closing brace); the demo had been loading the
  pre-audit v2.5 engine and silently mock-scoring.
- **FATAL** — epistemic ceiling (0.95) defined but never enforced; now enforced in scoring and appeals.
- **CRITICAL** — four documented-but-absent mechanisms implemented: graduated model trust,
  weight self-calibration (`calibrateWeights`), witness-damage extraction, cumulative appeal ceiling.
- **HIGH** — reputation-weight math corrected (was producing negative/runaway weights).
- **HIGH** — coordinate-schema mismatch that silently killed corroboration; both schemas now accepted.
- **HIGH** — third-party density lookup that leaked report coordinates to a public API is now
  opt-in and never used for anonymized locations.
- AI module fallback no longer fabricates a random damage level/score/confidence; request timeout added.
- Various MEDIUM/LOW: seal-algorithm honesty, input-hash coverage, cluster-severity threshold,
  falsy zero-score handling, canary seal version, health-check accuracy, configurable emergency number.

### Security
- Rescue-signal coordinate handling and the opt-in density lookup reviewed; anonymized locations
  are never sent to third-party services.
- Confirmed the API key remains backend-managed (no key in client code).

### Upgrade notes
- The v3.2.2 engine's `score()` is **async** — integrators must `await CERTUS.score(...)`.
- The frontend must load `certus-engine-v3.2.2.js`; ship the engine and frontend together, or
  every score silently falls back to labeled mock output.

---

## [2.5.3] — 2026

### Added
- Pitch video added and linked in README.

### Changed
- Engine enhanced.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v2.5.2...v2.5.3

---

## [2.5.2] — 2026

### Fixed
- Photo capture function corrected.
- Engine updated; functions that were not firing were repaired.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v2.5.1...v2.5.2

---

## [2.5.1] — 2026

### Changed
- Maintenance and minor fixes.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v2.5.0...v2.5.1

---

## [2.5.0] — 2026

### Added
- Major addition to the STP seal system with new templates.
- Two new companion codes added.

### Changed
- README updated; main index code fixed.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v2.0.0...v2.5.0

---

## [2.0.0] — 2026

### Changed
- Major overhaul of code and documentation.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/1.2.0...v2.0.0

---

## [1.2.0] — 2026

### Changed
- Incremental improvements.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v1.1.0...v1.2.0

---

## [1.1.0] — 2026

### Changed
- Incremental improvements.

**Full Changelog:** https://github.com/AionSystem/VERITAS/compare/v1.0.0...v1.1.0

---

## [1.0.0] — 2026

### Added
- Initial public release of VERITAS: community damage certification platform with the
  CERTUS Engine, offline-first PWA, responder dashboard, STP seal integration, and six-language UI.

---

[3.0.0]: https://github.com/AionSystem/VERITAS/compare/v2.5.3...v3.0.0
[2.5.3]: https://github.com/AionSystem/VERITAS/compare/v2.5.2...v2.5.3
[2.5.2]: https://github.com/AionSystem/VERITAS/compare/v2.5.1...v2.5.2
[2.5.1]: https://github.com/AionSystem/VERITAS/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/AionSystem/VERITAS/compare/v2.0.0...v2.5.0
[2.0.0]: https://github.com/AionSystem/VERITAS/compare/1.2.0...v2.0.0
[1.2.0]: https://github.com/AionSystem/VERITAS/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/AionSystem/VERITAS/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AionSystem/VERITAS/releases/tag/v1.0.0
