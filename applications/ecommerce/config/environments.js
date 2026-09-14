// Ecommerce application — environment-level configuration values.
// Owned by this application (P3.4); resolved through framework/configuration
// (CC-01). Contains only environment/execution-level values — no scenario
// meaning, no credential values. baseUrl points to k6's own public
// validation endpoint (test.k6.io), matching Phase 3.6's minimal-validation
// target; no production system or credential is referenced.
//
// authEndpoint / apiBaseUrl (added Phase 4.10): no real E-commerce backend
// exists yet in this project. These point to the same safe, public,
// credential-free test services already used throughout Phase 4.1-4.9
// validation (reqres.in's documented fake-auth endpoint; httpbin.org as a
// generic JSON echo API) as a synthetic stand-in so the reference
// scenario (applications/ecommerce/scenarios/purchase-flow.js) can be
// exercised with real HTTP calls. No production system is referenced.

export const environments = {
  dev: {
    baseUrl: 'https://test.k6.io',
    environmentLabel: 'dev-environment',
    authEndpoint: 'https://reqres.in/api/login',
    apiBaseUrl: 'https://httpbin.org',
  },
  staging: {
    baseUrl: 'https://test.k6.io',
    environmentLabel: 'staging-environment',
    authEndpoint: 'https://reqres.in/api/login',
    apiBaseUrl: 'https://httpbin.org',
  },
};
