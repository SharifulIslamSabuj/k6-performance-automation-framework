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
