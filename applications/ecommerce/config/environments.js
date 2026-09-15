// Ecommerce application — environment-level configuration values.
// Owned by this application (P3.4); resolved through framework/configuration
// (CC-01). Contains only environment/execution-level values — no scenario
// meaning, no credential values.
//
// Phase 5.5: replaces the Phase 4 synthetic validation targets
// (test.k6.io, reqres.in, httpbin.org) with the real Toolshop — Practice
// Software Testing reference application (P5.1). Both environments
// documented in Toolshop's own OpenAPI spec "servers" list (P5.1 Section
// 5, P5.2 Section 4) are mapped here: the shared public sandbox and the
// documented local/self-hosted instance. A single apiBaseUrl suffices per
// environment — unlike the earlier synthetic setup (which split traffic
// across two unrelated public services), every Toolshop capability used
// by the approved journeys (auth, catalog, cart, invoice) lives under one
// base API URL, resolving the ambiguity the Phase 4.16 baseline flagged
// around the previously-unused baseUrl/environmentLabel keys (removed
// here — Toolshop genuinely needs no value distinct from apiBaseUrl).

export const environments = {
  dev: {
    apiBaseUrl: 'http://localhost:8091',
  },
  staging: {
    apiBaseUrl: 'https://api.practicesoftwaretesting.com',
  },
};
