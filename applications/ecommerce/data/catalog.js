// Ecommerce application — Toolshop test data. Owned by this application
// (P3.4); resolved through framework/test-data (CC-05). Contains only
// input values the approved journeys (P5.3 EJ-001..004) supply to
// requests — no scenario orchestration, no correlation (runtime-extracted
// values are CC-04's concern, never duplicated here).
//
// Static data (P5.4 Section 7, with one evidence-based correction made
// during Phase 5.5 implementation — see toolshop-shared.js): searchTerm
// is a real catalog term, confirmed live against the Toolshop catalog in
// Phase 5.1/5.2 ("pliers" matches a real "Combination Pliers" product).
// billingLookup is NOT the billing address itself — Phase 5.4 originally
// classified a full fake address as STATIC, but live validation during
// Phase 5.5 disproved that: Toolshop checks the submitted address against
// its own internally-seeded fake geography (GET /postcode-lookup), so an
// arbitrary well-formed address is rejected. The only genuinely static
// input is the lookup KEY (country + postcode); the address values
// themselves are CORRELATED, extracted live from that lookup's response
// (toolshop-shared.js's getBillingAddress). guestName and payment fields
// remain simple static test values — never real personal or payment
// information. paymentMethod/paymentDetails implement the cash-on-delivery
// strategy selected in P5.4 Section 17 / P5.5 Section 6: Toolshop's own
// CashOnDeliveryDetails schema requires zero fields, the simplest and
// lowest-risk of the two viable strategies identified there.
export const staticData = {
  searchTerm: 'pliers',
  cartItemQuantity: 1,
  billingLookup: {
    country: 'AU',
    postcode: '2000',
  },
  guestName: {
    guest_first_name: 'Test',
    guest_last_name: 'Guest',
  },
  paymentMethod: 'cash-on-delivery',
  paymentDetails: {},
};

// Generated/dynamic category (P5.4 Section 9): a guest checkout email
// must be unique per execution to avoid colliding with another guest
// checkout and to keep each created invoice distinguishable (P5.3 Section
// 11 recommendation, carried into P5.4). Native k6 VU/iteration context
// (Layer 3), passed through by CC-05's generateTestData, is sufficient
// for collision-free uniqueness without inventing a separate scheme.
export function generateGuestEmail(ctx) {
  return `guest-${ctx.vuId}-${ctx.iterationInInstance}@example.test`;
}

// PROVISIONAL TECHNICAL VALIDATION CRITERIA (Phase 5.8) — NOT an SLA, SLO,
// production requirement, capacity limit, or business-readiness criterion.
// Basis: controlled observation of the Toolshop reference (staging)
// environment (see P5.8 baseline, Section 8, for the full dataset).
// Derivation rule (applied uniformly, not cherry-picked per operation):
// threshold = ceil(highest steady-state observed value x 1.5), rounded up
// to the nearest 100ms (operation-level) or 500ms (journey/iteration-level).
// Samples from one identified transient sandbox-instability episode and
// one identified k6 first-iteration cold-start effect were excluded from
// the "steady-state" basis — both fully explained and documented in the
// P5.8 baseline, not silently discarded. Centralized here (not restated
// per scenario file) because several operations are shared across
// multiple journeys. Recalibrate when authoritative application
// requirements or representative workload evidence become available.
export const provisionalDurationThresholdsMs = {
  toolshop_product_search: 500,
  toolshop_product_detail: 500,
  toolshop_cart_create: 500,
  toolshop_cart_add_item: 600,
  toolshop_cart_view: 500,
  toolshop_postcode_lookup: 500,
  toolshop_invoice_create: 600,
  toolshop_login: 600,
  toolshop_profile: 500,
  toolshop_invoice_retrieve: 600,
};

export const provisionalIterationThresholdsMs = {
  // EJ-001 — PHASE 6.1 CORRECTION (was 2000ms, Phase 5.8 original).
  // Original Phase 5.8 derivation: cold-start-inclusive observed max
  // 1005ms x1.5 = 1507.5, rounded up to nearest 500ms = 2000ms — the
  // same rule applied to every other value in this object, unchanged
  // below. New evidence (Phase 6.1 Smoke repeatability, 4 additional
  // real single-iteration executions: 880.8ms, 1128.6ms, 1578.2ms,
  // 2060ms) showed 2000ms genuinely fails under ordinary conditions —
  // a technically valid execution (correct request count, all checks
  // passed, http_req_duration itself within its own threshold every
  // time) still exceeded it. Root cause, confirmed via sub-metrics
  // (http_req_blocked/http_req_connecting/http_req_tls_handshaking):
  // fresh TCP+TLS connection-establishment variance against the shared
  // Toolshop sandbox, not application/request slowness — inherent to
  // every real invocation of this scenario (options.iterations:1 means
  // every execution pays this cost, exactly the reasoning the original
  // 2000ms derivation already used, just from a thinner sample).
  // iteration_duration remains the correct metric (P5.6 established it
  // as the native, non-custom measure of complete journey time; the
  // connection cost is a genuine part of real invocation experience,
  // not a reason to switch metrics). Combined 5-sample dataset (1005,
  // 880.8, 1128.6, 1578.2, 2060ms), same Phase 5.8 rule applied
  // unchanged: highest observed 2060ms x1.5 = 3090, rounded up to
  // nearest 500ms = 3500ms. See P6.1 baseline for full evidence table.
  // Still a PROVISIONAL TECHNICAL VALIDATION CRITERION, not an SLA.
  EJ001: 3500,
  EJ002: 3000,
  EJ003: 4000,
  EJ004: 5000,
};
