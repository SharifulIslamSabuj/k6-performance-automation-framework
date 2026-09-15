// Ecommerce application — small Toolshop-specific helpers shared by
// EJ-003 and EJ-004 (Phase 5.5). Not a framework component: both helpers
// wrap existing CC-03/CC-04/CC-06 mechanics with Toolshop-specific
// meaning, exactly like every other Layer-1 function in this
// application — nothing here is reusable outside Toolshop.
//
// withToolshopHeaders: Toolshop's API returns an HTML redirect instead
// of JSON for any request lacking an explicit Accept: application/json
// header — confirmed live during EJ-003 validation (a request without it
// received a 302 redirect to the site root, which itself 404s, rather
// than the documented JSON error response). This is a real,
// Toolshop-specific HTTP contract requirement, not a framework gap.
// Wraps CC-06's existing withOperationTag, adding that one header
// consistently rather than repeating it at every call site.
//
// getBillingAddress: invoice creation validates the submitted billing
// address for internal plausibility against Toolshop's own seeded fake
// address data (confirmed live: GET /postcode-lookup returns
// deterministic-but-fictional street/city/state/country data for a given
// country+postcode, e.g. "Nova Point" / "West Martinstad" / "Northern
// Territory" for AU/2000 — not real geography). Phase 5.4 classified the
// billing address as STATIC test data; live implementation evidence
// disproves that for this specific field group — it must be CORRELATED
// from a live postcode-lookup call, using exactly the values that call
// returns. This finding is documented in the Phase 5.5 baseline as an
// evidence-based deviation from Phase 5.4, resolved entirely in Layer 1
// with existing framework mechanics — no framework change was needed.
import { check } from 'k6';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { hasStatus, hasField, withOperationTag } from '../../../framework/evidence/index.js';
import { logOperation } from '../../../framework/logging/index.js';
import { classifyError } from '../../../framework/error-handling/index.js';

export function withToolshopHeaders(params, operation) {
  const base = params && typeof params === 'object' ? params : {};
  const headers = { Accept: 'application/json', ...(base.headers || {}) };
  return withOperationTag({ ...base, headers }, operation);
}

export function getBillingAddress(apiBaseUrl, country, postcode) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/postcode-lookup?country=${encodeURIComponent(country)}&postcode=${encodeURIComponent(postcode)}`,
    null,
    withToolshopHeaders({}, 'toolshop_postcode_lookup')
  );
  const passed = check(res, {
    'postcode lookup: status is 200': (r) => hasStatus(r, 200),
    'postcode lookup: city present': (r) => hasField(r, 'city'),
  });
  logOperation({
    operation: 'toolshop_postcode_lookup',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });

  try {
    const address = {
      billing_street: `${extract(res, 'street')} ${extract(res, 'house_number')}`,
      billing_city: extract(res, 'city'),
      billing_state: extract(res, 'state'),
      billing_country: extract(res, 'country'),
      billing_postal_code: extract(res, 'postcode'),
    };
    logOperation({ operation: 'toolshop_extract_billing_address', outcome: 'success' });
    return address;
  } catch (e) {
    logOperation({
      operation: 'toolshop_extract_billing_address',
      outcome: 'failure',
      category: classifyError(e),
      detail: e.message,
    });
    throw e;
  }
}
