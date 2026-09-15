// Ecommerce application — Toolshop Authenticated Shopper Checkout
// (EJ-004, Phase 5.5 / P5.3 Business Journeys Baseline).
//
// Business intent: a returning shopper logs in, confirms their identity,
// completes checkout as an authenticated user (POST /invoices, not
// /invoices/guest), and reviews the created invoice. Login credentials
// are runtime-supplied only (__ENV, never hardcoded here), matching the
// existing pattern used throughout Phase 4 for the framework's previous
// authentication target (P5.4 Section 11/18). Cart-building (EJ-002) runs
// BEFORE login — the token's ~5-minute TTL (P5.2 Section 7) therefore
// only starts counting down once login occurs, not during the preceding
// unauthenticated discovery/cart steps, reducing TTL risk beyond what
// P5.3 Section 8 already analyzed. No token refresh, retry, or
// persistence is implemented (explicitly excluded, P4.14 boundary).
// Billing address is resolved live via toolshop-shared.js's
// getBillingAddress (see that file for the evidence behind this
// correction to Phase 5.4's original STATIC classification) — the same
// address-validation behavior confirmed for the guest path (EJ-003)
// applies identically here, confirmed live against this authenticated
// endpoint during Phase 5.5 validation.
import { check } from 'k6';
import { resolveConfig } from '../../../framework/configuration/index.js';
import { authenticate } from '../../../framework/authentication/index.js';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { getStaticData } from '../../../framework/test-data/index.js';
import { hasStatus, hasField } from '../../../framework/evidence/index.js';
import { logOperation } from '../../../framework/logging/index.js';
import { classifyError } from '../../../framework/error-handling/index.js';
import { environments } from '../config/environments.js';
import { staticData } from '../data/catalog.js';
import { buildCart } from './toolshop-cart.js';
import { withToolshopHeaders, getBillingAddress } from './toolshop-shared.js';

export const options = { vus: 1, iterations: 1 };

function login(apiBaseUrl) {
  try {
    const result = authenticate(
      'POST',
      `${apiBaseUrl}/users/login`,
      { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD },
      'access_token'
    );
    logOperation({ operation: 'toolshop_login', outcome: 'success', detail: `status=${result.status}` });
    return result;
  } catch (e) {
    logOperation({ operation: 'toolshop_login', outcome: 'failure', category: classifyError(e), detail: e.message });
    throw e;
  }
}

function getProfile(apiBaseUrl, token) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/users/me`,
    null,
    withToolshopHeaders({ headers: { Authorization: `Bearer ${token}` } }, 'toolshop_profile')
  );
  const passed = check(res, {
    'profile: status is 200': (r) => hasStatus(r, 200),
    'profile: email present': (r) => hasField(r, 'email'),
  });
  logOperation({
    operation: 'toolshop_profile',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

function createAuthenticatedInvoice(apiBaseUrl, token, cartId) {
  const billingLookup = getStaticData(staticData, 'billingLookup');
  const billingAddress = getBillingAddress(apiBaseUrl, billingLookup.country, billingLookup.postcode);
  const paymentMethod = getStaticData(staticData, 'paymentMethod');
  const paymentDetails = getStaticData(staticData, 'paymentDetails');

  const body = {
    ...billingAddress,
    payment_method: paymentMethod,
    payment_details: paymentDetails,
    cart_id: cartId,
  };

  const res = sendRequest(
    'POST',
    `${apiBaseUrl}/invoices`,
    JSON.stringify(body),
    withToolshopHeaders(
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      'toolshop_invoice_create'
    )
  );
  const passed = check(res, {
    'invoice create: status is 201': (r) => hasStatus(r, 201),
    'invoice create: invoice id present': (r) => hasField(r, 'id'),
  });
  logOperation({
    operation: 'toolshop_invoice_create',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

function getInvoice(apiBaseUrl, token, invoiceId) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/invoices/${invoiceId}`,
    null,
    withToolshopHeaders({ headers: { Authorization: `Bearer ${token}` } }, 'toolshop_invoice_retrieve')
  );
  const passed = check(res, { 'invoice retrieve: status is 200': (r) => hasStatus(r, 200) });
  logOperation({
    operation: 'toolshop_invoice_retrieve',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

// EJ-004 entry point. Depends on EJ-002 (buildCart) for its cart
// precondition, exactly as approved in P5.3.
export function authenticatedCheckout() {
  const apiBaseUrl = resolveConfig(environments, 'apiBaseUrl');
  const cartId = buildCart();

  const authResult = login(apiBaseUrl);
  getProfile(apiBaseUrl, authResult.token);

  const invoiceResponse = createAuthenticatedInvoice(apiBaseUrl, authResult.token, cartId);

  let invoiceId;
  try {
    invoiceId = extract(invoiceResponse, 'id');
    logOperation({ operation: 'toolshop_extract_invoice_id', outcome: 'success' });
  } catch (e) {
    logOperation({
      operation: 'toolshop_extract_invoice_id',
      outcome: 'failure',
      category: classifyError(e),
      detail: e.message,
    });
    throw e;
  }

  getInvoice(apiBaseUrl, authResult.token, invoiceId);

  return invoiceId;
}

export default authenticatedCheckout;
