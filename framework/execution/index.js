// CC-07 — Execution Control
//
// P2-D05 §13 / P2-D06 §10: CC-07 "coordinates framework configuration and
// execution-lifecycle behavior around the application-composed scenario,
// delegating actual execution to k6's native lifecycle." k6's native
// lifecycle invokes Layer 1's entry point directly — CC-07 is never that
// entry point, and never owns or calls Layer 1; Layer 1 calls into CC-07,
// never the reverse. "Uses native execution-lifecycle hooks directly ...
// no wrapper beyond what's needed for config application."
//
// Load Profile decision (Phase 4.11): a load profile is workload SHAPE —
// which native k6 executor a scenario runs under (constant-vus,
// ramping-vus, constant-arrival-rate, etc.) and that executor's own
// parameters (vus, duration, stages, rate, ...). k6 performs all actual
// VU scheduling and workload generation itself; CC-07 introduces no
// scheduler, no custom executor, no JavaScript-based ramping. No
// framework-invented profile vocabulary ("smoke"/"spike"/"soak") is
// introduced — that would blur into Phase 6 Performance Test Type
// methodology, which this phase explicitly excludes. buildLoadProfile
// only assembles one options.scenarios entry from caller-supplied,
// native k6 executor fields — exactly mirroring how buildThresholds
// (CC-06, Phase 4.9) assembles options.thresholds. Executor-specific
// parameter validity (e.g. a malformed duration string, an invalid
// stage) is left to k6's own native loader, not reimplemented here.
export function buildLoadProfile(name, profile) {
  if (!name || typeof name !== 'string') {
    throw new Error('Execution/Configuration Failure: a load-profile name is required.');
  }
  if (!profile || typeof profile !== 'object') {
    throw new Error('Execution/Configuration Failure: a load-profile configuration object is required.');
  }
  if (!profile.executor || typeof profile.executor !== 'string') {
    throw new Error('Execution/Configuration Failure: a load-profile executor is required.');
  }

  const { tags, exec, ...executorConfig } = profile;
  return {
    [name]: {
      exec: exec || 'default',
      ...executorConfig,
      // Low-cardinality profile identifier only (e.g. profile: 'constant')
      // — never a dynamic/high-cardinality value. Consistent with the
      // stable-tag discipline already established for withOperationTag.
      tags: { profile: name, ...(tags || {}) },
    },
  };
}
