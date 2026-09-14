// CC-06 — Evidence & Threshold (technical-checks slice — Phase 4.7;
// metrics slice — Phase 4.8)
//
// P2-D05 §12 / P2-D07 §9: CC-06's responsibility is "metrics, technical
// checks, threshold evaluation, failure classification, evidence
// generation — one cohesive mechanism." Phase 4.7 implemented the
// technical-checks slice; Phase 4.8 adds the metrics slice. Threshold
// evaluation, failure classification, and evidence accumulation remain
// separate slices of this same CC-06 capability, deferred to Phase 4.9+
// — no CC-08 exists, and this is not a new architectural component.
//
// Metrics decision (Phase 4.8): no custom metric (Trend/Counter/Rate/
// Gauge) is introduced. Native k6 already produces http_req_duration,
// http_req_failed, http_reqs, iterations, iteration_duration, and checks
// automatically for every request/check executed via CC-03/CC-06 — zero
// framework code is required to obtain them (verified in §8 of the
// Phase 4.8 baseline). The one genuine gap native k6 leaves is a safe,
// reusable way to *tag* those native metrics by a stable dimension (e.g.
// "operation") so they can be sliced per journey step, without risking
// the high-cardinality tagging (tokens, customer IDs, emails) the
// architecture explicitly prohibits. withOperationTag provides exactly
// that — a request-params helper, not a new metric object.
//
// The technical-checks functions below (hasStatus/hasField/hasHeader)
// are pure predicates meant for use inside native k6 check()
// (AP-06/native-k6-first): they never throw and never return the value
// they inspected — only whether the technical condition holds. This is
// deliberately distinct from CC-04's extract(), which throws and returns
// the value when a REQUIRED value is missing for reuse. A technical
// check is a non-fatal observation; CC-06 must never halt execution the
// way a missing required correlation value does.
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

// Metrics slice (Phase 4.8): merges a stable "operation" tag into a
// request's params so native k6 metrics (http_req_duration,
// http_req_failed, etc.) for that request carry it. Never accepts a
// dynamic/high-cardinality identifier as the operation name's *purpose*
// — CC-06 only validates that a name was supplied; the caller (Layer 1)
// remains responsible for choosing a stable, non-sensitive value (e.g.
// "authenticate", "search"), never a token/customer ID/email.
export function withOperationTag(params, operation) {
  if (!operation || typeof operation !== 'string') {
    throw new Error('Execution/Configuration Failure: an operation tag name is required.');
  }
  const base = params && typeof params === 'object' ? params : {};
  const existingTags = base.tags && typeof base.tags === 'object' ? base.tags : {};
  return { ...base, tags: { ...existingTags, operation } };
}
