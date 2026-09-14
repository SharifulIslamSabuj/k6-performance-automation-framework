// Cross-cutting failure classification.
//
// NOT a Layer-2 component: no CC-08, no CT-08 contract, not part of the
// CC-01..07 interaction model (P2-D03/P2-D05) — the same architectural
// placement already established for Phase 4.13 logging.
//
// Every CC-01..07 module already throws a plain native Error whose
// message is prefixed with one of the five authoritative failure
// categories (P2-D07) — e.g. "Authentication Failure: ...". That IS the
// framework's existing error contract: explicit classification, a
// technical message, the real native cause (Error.message/.stack), and
// propagation via a normal `throw` (P2-D08's "Do not swallow failures").
// This module does not replace, redefine, or duplicate that contract; it
// provides the one genuinely missing piece — a way to read the category
// a framework error already carries back off it *programmatically*,
// without a caller re-stating the category as a separate literal
// (previously done, ad hoc, at each Phase 4.13 logging call site in
// purchase-flow.js — a duplication that could silently drift out of
// sync with the framework's own message). No exception hierarchy, no
// custom Error subclass: classifyError reads the native Error's own
// .message and returns nothing else — native error semantics are
// completely unchanged.
const CATEGORIES = [
  'Authentication Failure',
  'Request/Execution Failure',
  'Correlation/Data-Dependency Failure',
  'Execution/Configuration Failure',
  'Threshold Failure',
];

export function classifyError(error) {
  if (!error || typeof error.message !== 'string') {
    return undefined;
  }
  return CATEGORIES.find((category) => error.message.indexOf(`${category}:`) === 0);
}
