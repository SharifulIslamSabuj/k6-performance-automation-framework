// CC-06 — Evidence & Threshold (technical-checks slice — Phase 4.7;
// metrics slice — Phase 4.8; threshold slice — Phase 4.9)
//
// P2-D05 §12 / P2-D07 §9: CC-06's responsibility is "metrics, technical
// checks, threshold evaluation, failure classification, evidence
// generation — one cohesive mechanism." Phase 4.7 implemented the
// technical-checks slice; Phase 4.8 added the metrics slice; Phase 4.9
// adds the threshold slice. Failure classification and evidence
// accumulation remain separate slices of this same CC-06 capability,
// deferred to later phases — no CC-08 exists, and this is not a new
// architectural component.
//
// Threshold decision (Phase 4.9): k6 evaluates thresholds itself, purely
// natively, from the script's options.thresholds object — CC-06 performs
// no evaluation, no percentile math, no sample aggregation of its own.
// buildThresholds only assembles that configuration object from
// caller-supplied criteria, exactly like CC-01's resolveConfig assembles
// a value from a caller-supplied source: a mechanism, not the values or
// the evaluation. Threshold *values* are always Layer-1/execution
// supplied (§14 of the Phase 4.9 governing instructions); environment
// variation is achieved by Layer 1 resolving a value through the
// existing CC-01 mechanism before calling buildThresholds — no second
// configuration or environment system is introduced here.
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

// Threshold slice (Phase 4.9): assembles a native k6 options.thresholds
// object from caller-supplied criteria. Each criterion is
// { metric, expression, operation? } — metric and expression are native
// k6 concepts passed straight through, unvalidated in their own syntax
// (k6's own loader rejects a malformed expression natively — see the
// Phase 4.9 baseline for the captured real behavior); the optional
// `operation` restricts the criterion to the single stable tag dimension
// Phase 4.8 established, never an arbitrary/high-cardinality tag key.
// Missing criteria, or a criterion missing its metric/expression, is an
// Execution/Configuration Failure — distinct from a configured threshold
// that k6 itself later evaluates as failed.
export function buildThresholds(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('Execution/Configuration Failure: at least one threshold criterion is required.');
  }

  const thresholds = {};
  for (const criterion of criteria) {
    if (!criterion || typeof criterion !== 'object') {
      throw new Error('Execution/Configuration Failure: each threshold criterion must be an object.');
    }
    const { metric, expression, operation } = criterion;
    if (!metric || typeof metric !== 'string') {
      throw new Error('Execution/Configuration Failure: a threshold criterion must specify a metric name.');
    }
    if (!expression || typeof expression !== 'string') {
      throw new Error('Execution/Configuration Failure: a threshold criterion must specify an expression.');
    }

    const key = operation ? `${metric}{operation:${operation}}` : metric;
    if (!thresholds[key]) {
      thresholds[key] = [];
    }
    thresholds[key].push(expression);
  }

  return thresholds;
}
