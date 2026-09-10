# K6 Performance Automation Framework

**Organization:** QualityForge Technologies

## Purpose

This repository will host a K6-based performance testing automation framework,
used to design, execute, and analyze load and performance test scenarios as
part of QualityForge Technologies' quality assurance practice.

## Current Status

The project is in its initial setup phase. The Git/GitHub operating model,
branching strategy, and repository governance have been established. No test
scenarios, framework code, or K6 scripts have been implemented yet.

## Technology

- [K6](https://k6.io/) — load and performance testing tool

Additional tooling (CI/CD, reporting, containerization) will be introduced
and documented as it is implemented.

## Branching Model

This repository follows the **QualityForge Controlled Release Git Model**:

| Branch | Purpose |
|---|---|
| `main` | Stable, released code. Highest protection. Release tags originate here. |
| `development` | Primary integration branch for ongoing work. |
| `feature/*` | Short-lived branches for new functionality. |
| `fix/*` | Short-lived branches for normal bug fixes. |
| `refactor/*` | Short-lived branches for structural/code-quality improvements. |
| `release/*` | Short-lived branches for release stabilization. |
| `hotfix/*` | Short-lived branches for urgent fixes to released code. |

**Flow:** `feature|fix|refactor` → `development` → `release/*` → `main`.
`hotfix/*` branches from and merges back into both `main` and `development`.

## Commit Convention

This project uses Conventional Commit-style messages:

| Prefix | Use |
|---|---|
| `feat:` | New functionality |
| `fix:` | Bug correction |
| `refactor:` | Structural/code-quality change, no behavior change |
| `test:` | Adding or updating tests/scenarios |
| `docs:` | Documentation changes |
| `ci:` | CI/CD or workflow configuration |
| `chore:` | Project configuration, maintenance, tooling |

Example: `feat: add authentication helper`

## Versioning

Releases follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`),
tagged as `vMAJOR.MINOR.PATCH` on `main`.

## Repository Orientation

The repository structure (`framework/` for the reusable Layer-2 core,
`applications/` for Layer-1 application/domain implementations) is
established per the approved architecture (P2-D10). See
[`STRUCTURE.md`](STRUCTURE.md) for the layer/directory mapping. No
framework capability or scenario logic is implemented yet.

## Contributing

Work happens on short-lived `feature/*`, `fix/*`, or `refactor/*` branches
off `development`, merged via reviewed Pull Requests. `main` and
`development` are protected branches — direct pushes are not permitted.
