// CC-03 — Request
//
// Reusable HTTP/API request execution (CT-03, P2-D03/P2-D05 §9).
// Intentionally thin: a direct pass-through to native k6 http.request,
// generic across HTTP methods (no fixed method set). CC-03 never decides
// which endpoint/method/payload to use (Layer 1's responsibility) and
// never interprets the response (consumer's responsibility) — it only
// executes the request and returns k6's native response object unmodified.
import http from 'k6/http';

export function sendRequest(method, url, body, params) {
  if (!method || typeof method !== 'string') {
    throw new Error('Request/Execution Failure: a request method is required.');
  }
  if (!url || typeof url !== 'string') {
    throw new Error('Request/Execution Failure: a request URL is required.');
  }

  return http.request(method, url, body, params);
}
