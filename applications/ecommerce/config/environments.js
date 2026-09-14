// Ecommerce application — environment-level configuration values.
// Owned by this application (P3.4); resolved through framework/configuration
// (CC-01). Contains only environment/execution-level values — no scenario
// meaning, no credential values. baseUrl points to k6's own public
// validation endpoint (test.k6.io), matching Phase 3.6's minimal-validation
// target; no production system or credential is referenced.

export const environments = {
  dev: {
    baseUrl: 'https://test.k6.io',
    environmentLabel: 'dev-environment',
  },
  staging: {
    baseUrl: 'https://test.k6.io',
    environmentLabel: 'staging-environment',
  },
};
