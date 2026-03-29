TEST SUITE: VERITAS v1.0 (18 Tests)
Navigation & UI Tests
Test 1: Tab Switching (Report ↔ Respond)
Steps: Click “📍 Report” then “🗺 Respond”.
Expected: View toggles correctly. On Respond tab you see the toast “Enter access code UNDP2026…”.
Pass/Fail: ________
Test 2: Mobile Hamburger Menu
Steps: Resize browser to <800px → click hamburger icon.
Expected: Mobile nav slides down with all links. Clicking any link closes menu.
Pass/Fail: ________
Test 3: Language Switcher
Steps: Click any language button (AR, ZH, FR, RU, ES).
Expected: All data-i18n texts update instantly.
Pass/Fail: ________
Report Workflow Tests
Test 4: Step 1 – Photo Capture
Steps: Click “TAP TO PHOTOGRAPH DAMAGE”.
Expected: Camera/file picker opens. After selecting image → preview appears, retake button shows, AI status runs, Next button enables.
Pass/Fail: ________
Test 5: Step 2 – Damage & Infrastructure Selection
Steps: Select one damage level + one infrastructure type (including “Other”).
Expected: Buttons highlight, “Other” field appears, Next button enables.
Pass/Fail: ________
Test 6: Step 3 – Details Form
Steps: Fill crisis type (select subtype), debris, electricity, health, needs checkboxes.
Expected: All fields capture correctly. Subtype radio buttons appear dynamically.
Pass/Fail: ________
Test 7: Step 4 – Location (GPS + Manual)
Steps: Allow GPS → or deny and click map. Switch between Precise/Area mode.
Expected: Pin appears, coords display, fuzzy circle shows in Area mode, Next button enables.
Pass/Fail: ________
Test 8: Step 5 – Review Summary
Steps: Reach Step 5.
Expected: All entered data appears correctly in summary table.
Pass/Fail: ________
Test 9: Full Report Submission
Steps: Complete all 5 steps → click SUBMIT REPORT.
Expected: Confirmation screen shows with DCI score, badge, and engagement message.
Pass/Fail: ________
Respond Dashboard Tests
Test 10: Access Gate
Steps: Switch to Respond tab → enter wrong code → enter UNDP2026.
Expected: Wrong code → toast error. Correct code → dashboard appears and populates.
Pass/Fail: ________
Test 11: Live Confidence Dashboard + Map
Steps: Submit 2–3 reports with different DCI tiers, then open Respond dashboard.
Expected: Counts update, markers appear on map with correct colors/popups.
Pass/Fail: ________
Test 12: Timeline Slider
Steps: Move slider from 100 to 0.
Expected: Label changes from “Live — all reports” to “First Xh after event”.
Pass/Fail: ________
Offline & Persistence Tests
Test 13: Offline Mode
Steps: Turn off internet → submit a report.
Expected: Offline banner shows, report saved to IndexedDB, toast confirms.
Pass/Fail: ________
Test 14: Sync Queue
Steps: Go online after offline submission.
Expected: Sync queue appears briefly, then disappears and reports are marked synced.
Pass/Fail: ________
Test 15: Cached Snapshot Export
Steps: In Respond dashboard → click “📥 Download Cached Snapshot”.
Expected: JSON file downloads with all reports + SHA-256.
Pass/Fail: ________
Advanced Features Tests
Test 16: STP Seal
Steps: In Respond dashboard → click “🔒 STP Seal”.
Expected: Calls backend, shows seal display with triple-time stamps, downloadable JSON.
Pass/Fail: ________
Test 17: Export Formats
Steps: Test JSON, CSV, GeoJSON, Shapefile (if library present).
Expected: Each downloads correct file with proper headers/integrity hash.
Pass/Fail: ________
Test 18: Edge Cases & Error Handling
a. Submit without photo → toast warning
b. Submit without damage/infra → toast warning
c. No GPS + manual pin
d. Try to open Respond dashboard without code
e. Resize window (mobile layout)
Expected: All show correct toasts / graceful fallbacks.
Pass/Fail: ________