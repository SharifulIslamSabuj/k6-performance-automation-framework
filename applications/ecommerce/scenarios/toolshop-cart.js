// Ecommerce application — Toolshop Guest Cart Building (EJ-002,
// Phase 5.5 / P5.3 Business Journeys Baseline).
//
// Business intent: a shopper adds a discovered product to a cart, without
// yet checking out. Fully unauthenticated — POST /carts, POST /carts/{id}
// (add item), and GET /carts/{cartId} all require no Bearer token (P5.2
// Section 7). Exported as a small reusable Layer-1 function (buildCart)
// because EJ-003 and EJ-004 both depend on an already-populated cart as
// their precondition (P5.3 Section 13's dependency model) — reusing this
// function is the same approved "journeys chain into each other"
// relationship, not a new orchestration abstraction invented for this
// phase. No cleanup is implemented: Toolshop's API surface has no cart
// deletion path used by any approved journey, and P5.4 Section 16/20
// confirmed no cart-cleanup endpoint exists at all — cart state
// accumulates on whichever instance is targeted, a documented
// application/environment constraint, not solved here.
import { check } from 'k6';
import { resolveConfig } from '../../../framework/configuration/index.js';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { getStaticData } from '../../../framework/test-data/index.js';
import { hasStatus, hasField, buildThresholds } from '../../../framework/evidence/index.js';
import { logOperation } from '../../../framework/logging/index.js';
import { classifyError } from '../../../framework/error-handling/index.js';
import { resolveRuntimeLoadProfile } from '../../../framework/execution/index.js';
import { environments } from '../config/environments.js';
import { staticData, provisionalDurationThresholdsMs, provisionalIterationThresholdsMs } from '../data/catalog.js';
import { discoverProduct } from './toolshop-discovery.js';
import { withToolshopHeaders } from './toolshop-shared.js';
import { smokeExecutorShape } from './toolshop-profiles.js';

// Execution profile (Phase 6.1): -e PROFILE=smoke selects the sole
// currently-defined profile via the existing, unmodified CC-07
// resolveRuntimeLoadProfile — see toolshop-profiles.js.
const profiles = {
  smoke: { ...smokeExecutorShape, exec: 'buildCart' },
};

// Thresholds (Phase 5.8): PROVISIONAL TECHNICAL VALIDATION CRITERIA, not
// an SLA/SLO — see catalog.js and the P5.8 baseline for the full
// derivation methodology and evidence.
export const options = {
  scenarios: resolveRuntimeLoadProfile(profiles),
  thresholds: buildThresholds([
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_product_search}`, operation: 'toolshop_product_search' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_product_detail}`, operation: 'toolshop_product_detail' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_create}`, operation: 'toolshop_cart_create' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_add_item}`, operation: 'toolshop_cart_add_item' },
    { metric: 'http_req_duration', expression: `max<${provisionalDurationThresholdsMs.toolshop_cart_view}`, operation: 'toolshop_cart_view' },
    { metric: 'iteration_duration', expression: `max<${provisionalIterationThresholdsMs.EJ002}` },
  ]),
};

function createCart(apiBaseUrl) {
  const res = sendRequest('POST', `${apiBaseUrl}/carts`, null, withToolshopHeaders({}, 'toolshop_cart_create'));
  const passed = check(res, {
    'cart create: status is 201': (r) => hasStatus(r, 201),
    'cart create: id present': (r) => hasField(r, 'id'),
  });
  logOperation({
    operation: 'toolshop_cart_create',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

function extractCartId(cartResponse) {
  try {
    const cartId = extract(cartResponse, 'id');
    logOperation({ operation: 'toolshop_extract_cart_id', outcome: 'success' });
    return cartId;
  } catch (e) {
    logOperation({
      operation: 'toolshop_extract_cart_id',
      outcome: 'failure',
      category: classifyError(e),
      detail: e.message,
    });
    throw e;
  }
}

function addProductToCart(apiBaseUrl, cartId, productId, quantity) {
  const res = sendRequest(
    'POST',
    `${apiBaseUrl}/carts/${cartId}`,
    JSON.stringify({ product_id: productId, quantity }),
    withToolshopHeaders({ headers: { 'Content-Type': 'application/json' } }, 'toolshop_cart_add_item')
  );
  const passed = check(res, { 'cart add item: status is 200': (r) => hasStatus(r, 200) });
  logOperation({
    operation: 'toolshop_cart_add_item',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

function getCart(apiBaseUrl, cartId) {
  const res = sendRequest('GET', `${apiBaseUrl}/carts/${cartId}`, null, withToolshopHeaders({}, 'toolshop_cart_view'));
  const passed = check(res, {
    'cart view: status is 200': (r) => hasStatus(r, 200),
    'cart view: id present': (r) => hasField(r, 'id'),
  });
  logOperation({
    operation: 'toolshop_cart_view',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

// EJ-002 entry point. Discovers a product (EJ-001), then builds a cart
// containing it. Returns the cart id for EJ-003/EJ-004 to consume.
export function buildCart() {
  const apiBaseUrl = resolveConfig(environments, 'apiBaseUrl');
  const productId = discoverProduct();
  const quantity = getStaticData(staticData, 'cartItemQuantity');

  const cartResponse = createCart(apiBaseUrl);
  const cartId = extractCartId(cartResponse);
  addProductToCart(apiBaseUrl, cartId, productId, quantity);
  getCart(apiBaseUrl, cartId);

  return cartId;
}

export default buildCart;
