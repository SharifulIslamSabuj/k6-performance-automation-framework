// Ecommerce application — Toolshop execution profile shapes (Phase 6.1
// Smoke). Owned by this application (P3.4); resolved/selected through
// framework/execution (CC-07) — this file supplies workload SHAPE only,
// not a new mechanism: CC-07's buildLoadProfile/selectLoadProfile/
// applyRuntimeOverrides/resolveRuntimeLoadProfile (Phase 4.11/4.12) are
// used entirely unmodified, exactly as already established for the
// (now-superseded) synthetic reference scenario.
//
// Smoke definition (P6.1): a deliberately small, short, deterministic
// technical execution — exactly one VU, exactly one iteration, a native
// k6 maxDuration safety cap — sufficient to exercise the full scenario
// path once with its intended checks/metrics/thresholds, and explicitly
// unsuitable for any capacity/workload inference. This reproduces
// exactly the vus:1/iterations:1 default every Toolshop scenario has
// used since Phase 5.5, now made an explicit, named, runtime-selectable
// profile (-e PROFILE=smoke) rather than an implicit default — no
// scenario BEHAVIOR changes as a result.
export const smokeExecutorShape = {
  executor: 'shared-iterations',
  vus: 1,
  iterations: 1,
  maxDuration: '30s',
};
