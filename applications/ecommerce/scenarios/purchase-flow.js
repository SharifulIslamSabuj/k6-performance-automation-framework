// Ecommerce application — Purchase Flow scenario (Layer 1 / AC-01).
//
// Application-specific journey: authenticate -> search products ->
// view product details -> submit order. This file owns business/journey
// meaning; it consumes, and never duplicates, the reusable Layer-2
// capabilities (CC-01 configuration, CC-02 authentication, CC-03
// request, CC-04 correlation, CC-05 test data, CC-06 checks/metrics/
// thresholds).
//
// No real E-commerce backend exists yet in this project. Product
// search/details/order endpoints are simulated against httpbin.org (a
// generic JSON echo service) via applications/ecommerce/config's
// apiBaseUrl, and authentication against reqres.in's documented public
// fake-login endpoint — both safe, public, credential-free test
// services already used throughout Phase 4.1-4.9. This is a synthetic
// but technically real, network-executed journey, not a mock.
//
// Scope boundary: vus/iterations below are the minimal single-VU
// default required for the script to run at all — not Phase 4.11 Load
// Profile functionality (no stages, ramping, or executor configuration).
import { check } from 'k6';
import { resolveConfig } from '../../../framework/configuration/index.js';
import { authenticate } from '../../../framework/authentication/index.js';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { getStaticData, generateTestData } from '../../../framework/test-data/index.js';
import { hasStatus, hasField, withOperationTag, buildThresholds } from '../../../framework/evidence/index.js';
import { environments } from '../config/environments.js';
import { staticData, generateOrderReference } from '../data/catalog.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: buildThresholds([
    { metric: 'http_req_duration', expression: 'p(95)<5000' },
    { metric: 'http_req_failed', expression: 'rate<0.5' },
    { metric: 'checks', expression: 'rate>0.5' },
  ]),
};

// Each function below owns one step's application meaning; all HTTP/auth/
// correlation/data mechanics are delegated to the framework capabilities.

function authenticateCustomer(authEndpoint) {
  return authenticate(
    'POST',
    authEndpoint,
    { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD },
    'token'
  );
}

function searchProducts(apiBaseUrl, token, searchTerm) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/get?searchTerm=${searchTerm}`,
    null,
    withOperationTag({ headers: { Authorization: `Bearer ${token}` } }, 'search')
  );
  check(res, {
    'search: status is 200': (r) => hasStatus(r, 200),
    'search: searchTerm echoed': (r) => hasField(r, 'args.searchTerm'),
  });
  return res;
}

function extractFirstProductId(searchResponse) {
  // Synthetic: the echo service has no real catalog, so the "product id"
  // is a value the search response itself carries — extracted via CC-04
  // exactly as a real product id would be from a real search response.
  return extract(searchResponse, 'args.searchTerm');
}

function viewProductDetails(apiBaseUrl, token, productId) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/get?productId=${productId}`,
    null,
    withOperationTag({ headers: { Authorization: `Bearer ${token}` } }, 'product_details')
  );
  check(res, {
    'product details: status is 200': (r) => hasStatus(r, 200),
    'product details: productId echoed': (r) => hasField(r, 'args.productId'),
  });
  return res;
}

function submitOrder(apiBaseUrl, token, productId, orderReference) {
  const res = sendRequest(
    'POST',
    `${apiBaseUrl}/post`,
    JSON.stringify({ productId, orderReference }),
    withOperationTag({ headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }, 'checkout')
  );
  check(res, {
    'checkout: status is 200': (r) => hasStatus(r, 200),
    'checkout: orderReference echoed': (r) => hasField(r, 'json.orderReference'),
  });
  return res;
}

export default function purchaseFlow() {
  const authEndpoint = resolveConfig(environments, 'authEndpoint');
  const apiBaseUrl = resolveConfig(environments, 'apiBaseUrl');

  const authResult = authenticateCustomer(authEndpoint);

  const searchTerm = getStaticData(staticData, 'searchTerm');
  const searchResponse = searchProducts(apiBaseUrl, authResult.token, searchTerm);

  const productId = extractFirstProductId(searchResponse);
  viewProductDetails(apiBaseUrl, authResult.token, productId);

  const orderReference = generateTestData(generateOrderReference);
  submitOrder(apiBaseUrl, authResult.token, productId, orderReference);
}
