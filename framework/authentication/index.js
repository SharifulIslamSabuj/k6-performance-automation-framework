// CC-02 — Authentication
//
// Performs authentication generically using application-supplied inputs
// (P2-D05 §8). Executes the authentication HTTP call through CC-03
// (approved CC-02 -> CC-03 dependency) — no direct k6/http usage here.
// Consumes resolved secret input from its caller; owns no secret source,
// no storage, no SecretManager (P2-D08). Never contains a specific
// application's credential values, target, or auth-protocol assumptions
// beyond a configurable response token field.
//
// Optional fifth `params` argument (Phase 5.6): request-parameter
// pass-through only — e.g. so a caller can apply CC-06's existing
// withOperationTag to this call's own request the same way it already
// does for every other request. Not a new capability: authenticate()
// still only ever sends the caller-supplied credentials as the JSON
// body; `params` never carries credential/secret values itself (nothing
// here reads a "password"/"token" field out of it), and headers are
// merged shallowly with the same default-then-override precedence
// CC-06's withOperationTag/toolshop-shared.js's withToolshopHeaders
// already use elsewhere. Backward compatible: omitted, behavior is
// byte-identical to before this parameter existed.
import { sendRequest } from '../request/index.js';

export function authenticate(method, url, credentials, tokenField, params) {
  if (!method || typeof method !== 'string') {
    throw new Error('Authentication Failure: an authentication request method is required.');
  }
  if (!url || typeof url !== 'string') {
    throw new Error('Authentication Failure: an authentication endpoint URL is required.');
  }
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Authentication Failure: authentication credentials are required.');
  }
  if (!tokenField || typeof tokenField !== 'string') {
    throw new Error('Authentication Failure: a token field name is required to extract authentication state.');
  }

  const extraParams = params && typeof params === 'object' ? params : {};
  const extraHeaders = extraParams.headers && typeof extraParams.headers === 'object' ? extraParams.headers : {};
  const res = sendRequest(method, url, JSON.stringify(credentials), {
    ...extraParams,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Authentication Failure: authentication was rejected (status ${res.status}).`);
  }

  let body;
  try {
    body = JSON.parse(res.body);
  } catch (e) {
    throw new Error('Authentication Failure: authentication response could not be parsed.');
  }

  const token = body ? body[tokenField] : undefined;
  if (!token) {
    throw new Error(
      `Authentication Failure: required authentication state ("${tokenField}") was not present in the response.`
    );
  }

  return { token, status: res.status };
}
