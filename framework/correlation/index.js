// CC-04 — Correlation
//
// Generic extraction of dynamic values from a response so they can be
// reused by subsequent dependent operations (P2-D05 §10). Mechanism only
// — never assumes response schema or field names; Layer 1 supplies the
// extraction path.
//
// Storage/reuse: CC-04 does not own a value store. The value this
// function returns is an ordinary JavaScript value — the consumer holds
// it in its own local variable and passes it into subsequent CC-02/CC-03
// calls. A local variable inside a k6 default function is already
// execution-scoped (fresh per iteration) and VU-isolated (k6 gives each
// VU its own JS runtime), so no framework-owned store is needed; adding
// one would be unnecessary abstraction (AP-06) and a hidden-global-state
// risk this design avoids entirely. Supersession, coexistence of
// multiple values, and VU isolation are therefore properties of plain
// JavaScript variable scope, not of this module.
export function extract(response, path) {
  if (!response || typeof response !== 'object') {
    throw new Error('Correlation/Data-Dependency Failure: a response object is required for extraction.');
  }
  if (!path || typeof path !== 'string') {
    throw new Error('Correlation/Data-Dependency Failure: an extraction path is required.');
  }

  if (path.indexOf('headers.') === 0) {
    const headerName = path.slice('headers.'.length);
    const value = response.headers ? response.headers[headerName] : undefined;
    if (value === undefined) {
      throw new Error(`Correlation/Data-Dependency Failure: response header "${headerName}" was not found.`);
    }
    return value;
  }

  let body;
  try {
    body = JSON.parse(response.body);
  } catch (e) {
    throw new Error('Correlation/Data-Dependency Failure: response body could not be parsed as JSON for extraction.');
  }

  const segments = path.split('.');
  let value = body;
  for (const segment of segments) {
    if (value === null || value === undefined || typeof value !== 'object') {
      throw new Error(`Correlation/Data-Dependency Failure: field "${path}" was not found in the response.`);
    }
    value = value[segment];
  }
  if (value === undefined) {
    throw new Error(`Correlation/Data-Dependency Failure: field "${path}" was not found in the response.`);
  }

  return value;
}
