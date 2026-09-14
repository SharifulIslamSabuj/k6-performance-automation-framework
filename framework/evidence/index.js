// CC-06 — Evidence & Threshold (technical-checks slice — Phase 4.7)
//
// P2-D05 §12 / P2-D07 §9: CC-06's responsibility is "metrics, technical
// checks, threshold evaluation, failure classification, evidence
// generation — one cohesive mechanism." Phase 4.7 implements only the
// technical-checks slice of that responsibility (a technical assertion
// about observed behavior, pass/fail). Metrics, threshold evaluation,
// failure classification, and evidence accumulation are separate slices
// of this same CC-06 capability, explicitly deferred to Phase 4.8/4.9 —
// no CC-08 exists, and this is not a new architectural component.
//
// These functions are pure predicates meant for use inside native k6
// check() (AP-06/native-k6-first): they never throw and never return the
// value they inspected — only whether the technical condition holds. This
// is deliberately distinct from CC-04's extract(), which throws and
// returns the value when a REQUIRED value is missing for reuse. A
// technical check is a non-fatal observation; CC-06 must never halt
// execution the way a missing required correlation value does.
export function hasStatus(response, expectedStatus) {
  return !!response && response.status === expectedStatus;
}

export function hasField(response, path) {
  if (!response || typeof response !== 'object' || !path) {
    return false;
  }
  let body;
  try {
    body = JSON.parse(response.body);
  } catch (e) {
    return false;
  }
  const segments = path.split('.');
  let value = body;
  for (const segment of segments) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return false;
    }
    value = value[segment];
  }
  return value !== undefined;
}

export function hasHeader(response, headerName) {
  return !!(response && response.headers && response.headers[headerName] !== undefined);
}
