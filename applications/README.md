# Applications (Layer 1 — Application / Domain)

This directory holds application/domain-specific implementations. Each
subdirectory is one onboarded application/domain (the AC-01 pattern):
scenario/journey composition, application-specific configuration values,
and application-specific test data. Nothing here modifies the reusable
framework core under [`framework/`](../framework) — application code
consumes framework capabilities, it does not alter them.

A new application/domain is added as a new subdirectory beside the existing
ones, without any change to `framework/`. This structural separation is what
`P34-AC-10` (future onboarding without reusable-core modification) depends
on; it is not itself proof that onboarding works — that remains a Phase 9
validation activity.

## `ecommerce/`

The approved reference implementation (P0/P2-D04). Not part of the reusable
core. No scenario, endpoint, or data content is implemented yet — Phase 5.

| Directory | Responsibility |
|---|---|
| `scenarios/` | Application-specific journey/scenario composition (AC-01), consuming `framework/` capabilities |
| `config/` | This application's environment/execution configuration values, resolved via `framework/configuration` (CC-01) |
| `data/` | This application's test data, consumed via `framework/test-data` (CC-05) |
