// Ecommerce application — Toolshop Guest Checkout / Invoice Creation
// (EJ-003, Phase 5.5 / P5.3 Business Journeys Baseline).
//
// Business intent: a guest shopper turns a populated cart into an
// invoice via POST /invoices/guest — Toolshop's own terminology is
// preserved throughout ("invoice", never "order"; P5.3 Section 8).
// Payment strategy: cash-on-delivery (P5.4 Section 17 / P5.5 Section 6
// decision) — its CashOnDeliveryDetails schema requires zero fields, the
// simplest and lowest-risk of the two viable strategies identified,
// avoiding any fake-financial-data footprint entirely. Billing address is
// resolved live via toolshop-shared.js's getBillingAddress (see that
// file for the evidence behind this correction to Phase 5.4's original
// STATIC classification). guest_first_name/guest_last_name are required
// by this guest-specific endpoint — confirmed live during Phase 5.5
// validation, a detail Phase 5.2's schema extraction had not surfaced.
// No invoice deletion is implemented: no such endpoint exists in
// Toolshop's API surface at all (P5.4 Section 15/17) — invoice state
// accumulates on whichever instance is targeted, a documented
// application/environment constraint, not solved here.
import { check } from 'k6';
import { resolveConfig } from '../../../framework/configuration/index.js';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { getStaticData, generateTestData } from '../../../framework/test-data/index.js';
import { hasStatus, hasField, buildThresholds } from '../../../framework/evidence/index.js';
import { logOperation } from '../../../framework/logging/index.js';
import { classifyError } from '../../../framework/error-handling/index.js';
import { environments } from '../config/environments.js';
import { staticData, generateGuestEmail, provisionalDurationThresholdsMs, provisionalIterationThresholdsMs } from '../data/catalog.js';
import { buildCart } from './toolshop-cart.js';
import { withToolshopHeaders, getBillingAddress } from './toolshop-shared.js';

// Thresholds (Phase 5.8): PROVISIONAL TECHNICAL VALIDATION CRITERIA, not
// an SLA/SLO — see catalog.js and the P5.8 baseline for the full
// derivation methodology and evidence.
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: buildThresholds([
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_product_search}`, operation: 'toolshop_product_search' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_product_detail}`, operation: 'toolshop_product_detail' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_create}`, operation: 'toolshop_cart_create' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_add_item}`, operation: 'toolshop_cart_add_item' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_view}`, operation: 'toolshop_cart_view' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_postcode_lookup}`, operation: 'toolshop_postcode_lookup' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_invoice_create}`, operation: 'toolshop_invoice_create' },
    { metric: 'iteration_duration', expression: `max<${provisionalIterationThresholdsMs.EJ003}` },
  ]),
};

function createGuestInvoice(apiBaseUrl, cartId, guestEmail) {
  const billingLookup = getStaticData(staticData, 'billingLookup');
  const billingAddress = getBillingAddress(apiBaseUrl, billingLookup.country, billingLookup.postcode);
  const guestName = getStaticData(staticData, 'guestName');
  const paymentMethod = getStaticData(staticData, 'paymentMethod');
  const paymentDetails = getStaticData(staticData, 'paymentDetails');

  const body = {
    ...billingAddress,
    ...guestName,
    payment_method: paymentMethod,
    payment_details: paymentDetails,
    cart_id: cartId,
    guest_email: guestEmail,
  };

  const res = sendRequest(
    'POST',
    `${apiBaseUrl}/invoices/guest`,
    JSON.stringify(body),
    withToolshopHeaders({ headers: { 'Content-Type': 'application/json' } }, 'toolshop_invoice_create')
  );
  const passed = check(res, {
    'guest invoice create: status is 201': (r) => hasStatus(r, 201),
    'guest invoice create: invoice id present': (r) => hasField(r, 'id'),
  });
  logOperation({
    operation: 'toolshop_invoice_create',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

// EJ-003 entry point. Depends on EJ-002 (buildCart) for its cart
// precondition, exactly as approved in P5.3.
export function guestCheckout() {
  const apiBaseUrl = resolveConfig(environments, 'apiBaseUrl');
  const cartId = buildCart();
  const guestEmail = generateTestData(generateGuestEmail);

  const invoiceResponse = createGuestInvoice(apiBaseUrl, cartId, guestEmail);

  try {
    const invoiceId = extract(invoiceResponse, 'id');
    logOperation({ operation: 'toolshop_extract_invoice_id', outcome: 'success' });
    return invoiceId;
  } catch (e) {
    logOperation({
      operation: 'toolshop_extract_invoice_id',
      outcome: 'failure',
      category: classifyError(e),
      detail: e.message,
    });
    throw e;
  }
}

export default guestCheckout;
