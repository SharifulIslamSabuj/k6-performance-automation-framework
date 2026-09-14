# Project Structure

Structural home for the architecture approved in P2-D10 (Phase 2.10
Architecture Baseline). This document explains *what belongs where*; it is
not an implementation guide. See `framework/README.md` and
`applications/README.md` for directory-level detail.

## Layer mapping

| Layer | Directory | Notes |
|---|---|---|
| Layer 1 — Application/Domain | `applications/` | One subdirectory per onboarded application; `ecommerce/` is the reference implementation |
| Layer 2 — Reusable Framework Capability | `framework/` | CC-01–CC-07, application-independent |
| Layer 3 — k6 Execution / Native Runtime | *(no directory)* | Native k6 (`http`, `check`, metrics, thresholds, VU/iteration lifecycle) is used directly from within `framework/` and `applications/*/scenarios`; no wrapper directory is introduced |

## What must not be placed here

- No application-specific logic, endpoint meaning, or business journey
  composition inside `framework/` (that belongs under `applications/`).
- No framework mechanics (HTTP handling, correlation, evidence generation)
  inside `applications/` (that belongs under `framework/`).
- No `SecretManager`, credential-storage package, or fourth "security"
  layer — security is cross-cutting (see `framework/README.md`).
- No CI/CD, Docker, reporting-engine, or second-domain implementation —
  these remain deferred to Phases 6/7/9. (Load-profile assembly is
  implemented, as CC-07/`framework/execution/`, per Phase 4.11 — it is
  execution-control mechanics, not one of the deferred items above.)
- No generic `utils/`, `common/`, or `helpers/` dumping ground.

## Status

Phase 4 (all CC-01–CC-07 capabilities, plus the cross-cutting Logging and
Error Handling capabilities, plus the E-commerce reference scenario) is
implemented and baselined — see `framework/README.md` and
`applications/README.md` for current directory-level detail.
