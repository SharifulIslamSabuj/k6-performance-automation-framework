// Ecommerce application — Runtime-Controlled entry point for the
// purchase-flow journey (Phase 4.12).
//
// Reuses the unmodified purchase-flow scenario (Layer 1 business logic
// untouched) and selects one of applications/ecommerce/scenarios/
// purchase-flow-profiles.js's predefined workload shapes at runtime via
// PROFILE (and, for constant-vus/constant-arrival-rate, an optional VUS
// and/or DURATION override) — through CC-07's runtime-control mechanism.
// Environment selection (ENVIRONMENT) remains an independent, unrelated
// runtime input resolved by CC-01, exactly as in every prior phase.
//
// Usage:
//   k6 run -e ENVIRONMENT=dev -e PROFILE=constant \
//     -e AUTH_EMAIL=... -e AUTH_PASSWORD=... \
//     applications/ecommerce/scenarios/purchase-flow-runtime.js
//   (optionally add -e VUS=5 and/or -e DURATION=10s)
import { purchaseFlow } from './purchase-flow.js';
import { profiles } from './purchase-flow-profiles.js';
import { resolveRuntimeLoadProfile } from '../../../framework/execution/index.js';
import { buildThresholds } from '../../../framework/evidence/index.js';

export { purchaseFlow };

export const options = {
  scenarios: resolveRuntimeLoadProfile(profiles),
  thresholds: buildThresholds([
    { metric: 'http_req_duration', expression: 'p(95)<8000' },
    { metric: 'checks', expression: 'rate>0.5' },
  ]),
};
