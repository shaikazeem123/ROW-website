# Outcome Evaluation Report — Phase 0 Alignment Doc

**Status:** CONFIRMED — all decisions locked in
**Confirmed on:** 2026-04-16

---

## Confirmed Decisions

| # | Decision | Answer |
|---|---|---|
| 1a | Baseline rule | One baseline per patient (`clinical_assessments`); re-baselining is manual admin action |
| 1b | Comparison target | Baseline vs most recent follow-up in selected date range; one row per beneficiary |
| 2a | VAS baseline field | `vas_pre` (pain before first session) |
| 2b | VAS follow-up field | `vas_current` (latest reported pain) |
| 2c | VAS direction | Lower = better |
| 3 | All scale directions | MMT, FIM Loco, FIM Mobility, ROM, Balance, Coordination, Weight Bearing, AMP → higher = better. Dyspnea → lower = better |
| 4a | EI Communication ranking | Delayed speech (worst) → Cooing → Babbling → Single words (best) |
| 4b | All 12 EI domain rankings | Confirmed — see outcomeScales.ts for exact ordinals |
| 5a | EI reporting path | Path C — `ei_outcome` field in v1, per-domain drill-down in Phase 4 |
| 5b | EI bucket mapping | Improved + Slight Improvement → Improved, No Change → Same, Needs Referral → separate bucket |
| 6 | Thresholds | None for v1; any change counts as improved/declined |
| 7 | v1 scope | VAS + EI Outcome only |
| 8 | Permissions | Everyone can access |
| 9 | EI Declined bucket | Present on UI, stays 0 in v1, populated from Phase 4 per-domain comparison |

---

## v1 Summary Buckets

**VAS:** Total | Improved | Declined | Same | Baseline only
**EI Outcome:** Total | Improved | Declined (0 in v1) | Same | Needs Referral | Baseline only
