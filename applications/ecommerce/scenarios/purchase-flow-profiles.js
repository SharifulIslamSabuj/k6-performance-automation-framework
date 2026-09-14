// Ecommerce application — named load-profile definitions for the
// purchase-flow journey. Owned by this application (this is workload
// SHAPE the application considers reasonable to offer, not a framework
// concept) — resolved/selected through framework/execution (CC-07).
// Each entry is a plain native k6 executor configuration; CC-07 assembles
// and validates the structural shape (framework/execution/index.js), k6
// itself validates and executes each executor natively.

export const profiles = {
  constant: {
    executor: 'constant-vus',
    vus: 2,
    duration: '5s',
    exec: 'purchaseFlow',
  },
  ramping: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '3s', target: 2 },
      { duration: '3s', target: 0 },
    ],
    exec: 'purchaseFlow',
  },
  spike: {
    executor: 'constant-arrival-rate',
    rate: 2,
    timeUnit: '1s',
    duration: '5s',
    preAllocatedVUs: 2,
    maxVUs: 4,
    exec: 'purchaseFlow',
  },
};
