# Framework (Layer 2 — Reusable Framework Capability)

This directory holds the reusable, application-independent framework core
approved in P2-D01–P2-D10. It contains reusable *mechanisms* only — never
application-specific business meaning, journey composition, or configuration
values. Application/domain code belongs under [`applications/`](../applications),
never here.

All capabilities below are implemented and baselined (Phase 4.1–4.15; see
the corresponding `P4.x` baselines). This document reflects the actual,
validated implementation — not a pre-implementation structural plan.

| Directory | Capability | Responsibility | Excluded |
|---|---|---|---|
| `configuration/` | CC-01 — Configuration | Resolve environment/execution configuration values and configuration/secret references | Secret storage; secret resolution/value persistence; application-specific values |
| `authentication/` | CC-02 — Authentication | Reusable authentication mechanics; consumes runtime-resolved secret input | Credential persistence beyond the execution flow |
| `request/` | CC-03 — Request | Reusable HTTP/API request mechanics, using native k6 `http` directly | Application-specific endpoint meaning (supplied by `applications/`) |
| `correlation/` | CC-04 — Correlation | Extraction and reuse of dynamic runtime values (including applicable authentication-derived values) | Supplied (non-extracted) test data — that is `test-data/` |
| `test-data/` | CC-05 — Test Data | Static, dynamic, generated, and environment-specific input data | Extracted/correlated values (`correlation/`); actual data content owned by an application |
| `evidence/` | CC-06 — Evidence & Threshold | Metrics, checks, thresholds, failure classification, technical evidence generation/organization/aggregation | Scenario logic; business-readiness interpretation; GO/CONDITIONAL GO/NO-GO decisions |
| `execution/` | CC-07 — Execution Control | Execution coordination mechanics, load-profile/executor assembly, native k6 lifecycle handoff | Business/application scenario orchestration (that is `applications/*/scenarios`) |
| `logging/` | Cross-cutting — Logging (Phase 4.13) | Technical diagnostic logging, safe by construction | A second verbosity system; report/evidence generation |
| `error-handling/` | Cross-cutting — Error Handling (Phase 4.14) | Reading a framework error's failure category back off it | An exception hierarchy; retry/recovery; a new error contract |

## Dependency direction (P2-D05 §14 / P2-D10 §8)

No component here depends on `applications/`. As actually implemented: CC-02
→ CC-03; CC-05 → CC-01. Every other module (CC-01, CC-03, CC-04, CC-06,
CC-07, `logging/`, `error-handling/`) has zero framework-internal
dependencies — each operates on values already supplied to it by its caller
(e.g. CC-04/CC-06 receive a response object rather than fetching one
themselves; CC-07 reads `__ENV` directly, mirroring CC-01's own pattern)
rather than calling another CC module. This is sparser than originally
anticipated pre-implementation, and is the correct, evidence-based
reflection of the approved architecture's minimal-coupling intent (AP-06),
not a deviation from it — each dependency (or lack of one) is justified in
its own Phase 4.x baseline. Layer 3 (native k6 runtime) is used directly
where sufficient and has no dedicated directory here.

## Security note

Security is cross-cutting, not a separate directory. `configuration/` may
carry configuration and secret *references* only — it does not resolve or
store resolved secret values (P2-D08). No `SecretManager`-style component
exists or is planned here.
