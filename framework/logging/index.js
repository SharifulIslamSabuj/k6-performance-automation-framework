// Cross-cutting technical diagnostic logging.
//
// NOT a Layer-2 component: no CC-08, no CT-08 contract, not part of the
// CC-01..07 interaction model (P2-D03/P2-D05). Logging is used BY any
// layer, the same way native k6 console/execution APIs are available
// cross-cuttingly without being a "layer" themselves — this module is a
// small, single-purpose wrapper around exactly those native APIs, not a
// new architectural concern.
//
// Native k6 first: severity is delegated entirely to console.info/warn/
// error, which k6 itself already filters and formats (level=..., source=
// console in its own log output). Verbosity/level is NOT reinvented here
// — k6's own -v/--verbose flag already controls whether console.debug()
// output is shown (verified: suppressed by default, visible only with
// -v) — so DEBUG-level detail is available to any caller directly via
// native console.debug(), with no wrapper needed and no second runtime
// configuration system introduced.
//
// Safety by construction: logOperation accepts only four named fields —
// operation, category, outcome, detail — never an arbitrary object to
// serialize. A caller cannot accidentally dump an entire request/response
// body, a token, or a password merely by passing it in; there is no
// parameter shaped to accept one. `category` is informational only — one
// of the five established failure-category names (P2-D07) — this module
// does not define, enforce, or reclassify that taxonomy (CC-06's /
// Phase 4.14's responsibility, unchanged). `detail` is truncated to guard
// against accidental bulk logging, but truncation is not a secret filter:
// callers must never pass secret content here regardless of length.
const MAX_DETAIL_LENGTH = 200;

export function logOperation({ operation, category, outcome, detail } = {}) {
  if (!operation || typeof operation !== 'string') {
    throw new Error('Execution/Configuration Failure: an operation name is required for logging.');
  }
  if (!outcome || typeof outcome !== 'string') {
    throw new Error('Execution/Configuration Failure: an outcome is required for logging.');
  }

  const parts = [`operation=${operation}`, `outcome=${outcome}`];
  if (category) {
    parts.push(`category=${category}`);
  }
  if (detail) {
    const detailText = String(detail);
    const safeDetail = detailText.length > MAX_DETAIL_LENGTH
      ? `${detailText.slice(0, MAX_DETAIL_LENGTH)}...(truncated)`
      : detailText;
    parts.push(`detail=${safeDetail}`);
  }
  const message = parts.join(' ');

  if (outcome === 'error' || outcome === 'failure') {
    console.error(message);
  } else if (outcome === 'warning') {
    console.warn(message);
  } else {
    console.info(message);
  }
}
