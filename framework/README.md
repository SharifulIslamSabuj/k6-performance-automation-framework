# Framework (Layer 2 — Reusable Framework Capability)

This directory holds the reusable, application-independent framework core
approved in P2-D01–P2-D10. It contains reusable *mechanisms* only — never
application-specific business meaning, journey composition, or configuration
values. Application/domain code belongs under [`applications/`](../applications),
never here.

No capability below is implemented yet. Directories exist to give each
approved capability a fixed structural home ahead of Phase 4 implementation.

| Directory | Capability | Responsibility | Excluded |
|---|---|---|---|
| `configuration/` | CC-01 — Configuration | Resolve environment/execution configuration values and configuration/secret references | Secret storage; secret resolution/value persistence; application-specific values |
| `authentication/` | CC-02 — Authentication | Reusable authentication mechanics; consumes runtime-resolved secret input | Credential persistence beyond the execution flow |
| `request/` | CC-03 — Request | Reusable HTTP/API request mechanics, using native k6 `http` directly | Application-specific endpoint meaning (supplied by `applications/`) |
| `correlation/` | CC-04 — Correlation | Extraction and reuse of dynamic runtime values (including applicable authentication-derived values) | Supplied (non-extracted) test data — that is `test-data/` |
| `test-data/` | CC-05 — Test Data | Static, dynamic, generated, and environment-specific input data | Extracted/correlated values (`correlation/`); actual data content owned by an application |
| `evidence/` | CC-06 — Evidence & Threshold | Metrics, checks, thresholds, failure classification, technical evidence generation/organization/aggregation | Scenario logic; business-readiness interpretation; GO/CONDITIONAL GO/NO-GO decisions |
| `execution/` | CC-07 — Execution Control | Execution coordination mechanics, native k6 lifecycle handoff | Business/application scenario orchestration (that is `applications/*/scenarios`) |

## Dependency direction (P2-D05 §14 / P2-D10 §8)

No component here depends on `applications/`. Approved dependencies: CC-02 →
CC-01, CC-03; CC-03 → CC-01; CC-04 → CC-03; CC-05 → CC-01; CC-06 → CC-03
(operational) + conditional failure signals; CC-07 → CC-01. CC-01 has no
framework-component dependency. Layer 3 (native k6 runtime) is used directly
where sufficient and has no dedicated directory here.

## Security note

Security is cross-cutting, not a separate directory. `configuration/` may
carry configuration and secret *references* only — it does not resolve or
store resolved secret values (P2-D08). No `SecretManager`-style component
exists or is planned here.
