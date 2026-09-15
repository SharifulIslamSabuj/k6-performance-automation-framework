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
  // EJ-001's threshold is derived from its cold-start-inclusive observed
  // max (1005ms — the session's first-ever request paid a one-time DNS
  // resolution cost, confirmed live during this phase's own pass
  // validation, not merely from the raw observation dataset), not the
  // steady-state-only max (449ms) used for the other three journeys.
  // Since options.iterations:1 is this scenario's actual default
  // invocation pattern, every real execution IS a "first iteration" from
  // a fresh process's perspective, so a cold DNS cache is a realistic
  // condition to size against, not a discardable anomaly.
  EJ001: 2000,
  EJ002: 3000,
  EJ003: 4000,
  EJ004: 5000,
};
