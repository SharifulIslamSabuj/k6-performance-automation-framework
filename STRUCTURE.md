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
- No CI/CD, Docker, reporting-engine, load-profile, or second-domain
  implementation — these remain deferred to Phases 6/7/9.
- No generic `utils/`, `common/`, or `helpers/` dumping ground.

## Status

Structure only. No framework capability or scenario is implemented as of
Phase 3.4 — see `framework/README.md` and `applications/README.md` for the
current (empty) state of each directory.
