// Ecommerce application — test data. Owned by this application (P3.4);
// resolved through framework/test-data (CC-05). Contains only input
// values the purchase-flow journey supplies to requests — no scenario
// orchestration, no correlation (runtime-extracted values are CC-04's
// concern, never duplicated here).

export const staticData = {
  searchTerm: 'performance-test-item',
};

// Generation rule for a synthetic order reference — passed to CC-05's
// generateTestData(), which supplies only the VU/iteration context; this
// rule (the actual generation logic) is application-owned per P2-D06 §8.8.
export function generateOrderReference(ctx) {
  return `order-${ctx.vuId}-${ctx.iterationInInstance}`;
}
