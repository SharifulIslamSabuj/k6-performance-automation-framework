// Ecommerce application — Toolshop Guest Product Discovery (EJ-001,
// Phase 5.5 / P5.3 Business Journeys Baseline).
//
// Business intent: a guest shopper searches the catalog for a term and
// views a matching product's detail. Fully unauthenticated — neither
// GET /products/search nor GET /products/{productId} requires a Bearer
// token (P5.2 Section 7). P5.3 documented two alternative discovery
// paths (search-led and browse-led, both converging on product-detail
// view); this implementation realizes the search-led path, the simpler
// of the two and the one P5.4's static test data (searchTerm) was
// designed for. The browse-led alternative (GET /categories -> GET
// /products) remains a documented, unimplemented option — not a gap,
// a deliberate minimal-implementation choice (P5.5 baseline Section 7).
import { check } from 'k6';
import { resolveConfig } from '../../../framework/configuration/index.js';
import { sendRequest } from '../../../framework/request/index.js';
import { extract } from '../../../framework/correlation/index.js';
import { getStaticData } from '../../../framework/test-data/index.js';
import { hasStatus, hasField } from '../../../framework/evidence/index.js';
import { logOperation } from '../../../framework/logging/index.js';
import { classifyError } from '../../../framework/error-handling/index.js';
import { environments } from '../config/environments.js';
import { staticData } from '../data/catalog.js';
import { withToolshopHeaders } from './toolshop-shared.js';

export const options = { vus: 1, iterations: 1 };

function searchProducts(apiBaseUrl, searchTerm) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/products/search?q=${encodeURIComponent(searchTerm)}`,
    null,
    withToolshopHeaders({}, 'toolshop_product_search')
  );
  const passed = check(res, {
    'product search: status is 200': (r) => hasStatus(r, 200),
    'product search: results present': (r) => hasField(r, 'data'),
  });
  logOperation({
    operation: 'toolshop_product_search',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

function extractFirstProductId(searchResponse) {
  try {
    const productId = extract(searchResponse, 'data.0.id');
    logOperation({ operation: 'toolshop_extract_product_id', outcome: 'success' });
    return productId;
  } catch (e) {
    logOperation({
      operation: 'toolshop_extract_product_id',
      outcome: 'failure',
      category: classifyError(e),
      detail: e.message,
    });
    throw e;
  }
}

function getProductDetails(apiBaseUrl, productId) {
  const res = sendRequest(
    'GET',
    `${apiBaseUrl}/products/${productId}`,
    null,
    withToolshopHeaders({}, 'toolshop_product_detail')
  );
  const passed = check(res, {
    'product detail: status is 200': (r) => hasStatus(r, 200),
    'product detail: name present': (r) => hasField(r, 'name'),
  });
  logOperation({
    operation: 'toolshop_product_detail',
    outcome: passed ? 'success' : 'failure',
    category: passed ? undefined : 'Request/Execution Failure',
    detail: `status=${res.status}`,
  });
  return res;
}

// EJ-001 entry point. Returns the discovered product id so EJ-002 (and,
// through it, EJ-003/EJ-004) can consume it — the same "journeys chain
// into each other" relationship approved in P5.3 Section 13.
export function discoverProduct() {
  const apiBaseUrl = resolveConfig(environments, 'apiBaseUrl');
  const searchTerm = getStaticData(staticData, 'searchTerm');

  const searchResponse = searchProducts(apiBaseUrl, searchTerm);
  const productId = extractFirstProductId(searchResponse);
  getProductDetails(apiBaseUrl, productId);

  return productId;
}

export default discoverProduct;
