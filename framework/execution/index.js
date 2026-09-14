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

// Runtime Controls (Phase 4.12): selection/override of already-defined
// execution configuration — never a second place where profiles/
// environments/scenarios are DEFINED. Profile definitions remain
// Layer-1-owned (the `profiles` map passed in below); CC-07 only picks
// one by name and, optionally, applies a narrowly-scoped override.
//
// Verified precedence (not assumed): Environment selection (CC-01,
// __ENV.ENVIRONMENT) and load-profile selection are independent runtime
// dimensions — P2-D06 §8.7/§10.4 treat environment and execution
// configuration as separate concerns; nothing in the approved
// architecture makes one dependent on the other. The actual precedence
// implemented here is therefore: (1) the selected profile's own defined
// values, then (2) an explicit supported runtime override for that one
// field only, if supplied — a two-step chain, not the four-step
// illustrative example in this phase's governing prompt, which was
// checked against the architecture and found not to apply as written.
export function selectLoadProfile(profiles, selectedName) {
  if (!profiles || typeof profiles !== 'object') {
    throw new Error('Execution/Configuration Failure: a load-profile definitions map is required.');
  }
  if (!selectedName || typeof selectedName !== 'string') {
    throw new Error(
      'Execution/Configuration Failure: PROFILE is required (pass -e PROFILE=<name> to k6 run) but was not provided.'
    );
  }
  if (!(selectedName in profiles)) {
    throw new Error(
      `Execution/Configuration Failure: unknown load profile "${selectedName}". Supported profiles: ${Object.keys(profiles).join(', ')}.`
    );
  }

  return buildLoadProfile(selectedName, profiles[selectedName]);
}

// A runtime override affects only the one field it names, and only when
// that field is semantically valid for the selected executor — critically,
// a VU override is never silently reinterpreted as an arrival rate (or
// vice versa): for any executor other than constant-vus, a VU override is
// rejected explicitly rather than forced (P2-D05/Phase 4.11's VU vs
// arrival-rate distinction). Duration is a valid scalar field on both
// constant-vus and constant-arrival-rate, so it is supported for both;
// stage-based executors (ramping-vus, ramping-arrival-rate) have no
// single duration/vus field to override and are rejected explicitly too.
export function applyRuntimeOverrides(profileEntry, overrides) {
  if (!profileEntry || typeof profileEntry !== 'object') {
    throw new Error('Execution/Configuration Failure: a selected load-profile entry is required.');
  }
  const name = Object.keys(profileEntry)[0];
  const config = profileEntry[name];
  const updated = { ...config };
  const supplied = overrides || {};

  if (supplied.vus !== undefined) {
    if (config.executor !== 'constant-vus') {
      throw new Error(
        `Execution/Configuration Failure: a VU override is not supported for executor "${config.executor}" (VU overrides apply only to constant-vus; use the profile's own rate/stages for other executors).`
      );
    }
    const vus = Number(supplied.vus);
    if (!Number.isFinite(vus) || vus <= 0) {
      throw new Error(`Execution/Configuration Failure: VU override "${supplied.vus}" must be a positive number.`);
    }
    updated.vus = vus;
  }

  if (supplied.duration !== undefined) {
    if (config.executor !== 'constant-vus' && config.executor !== 'constant-arrival-rate') {
      throw new Error(
        `Execution/Configuration Failure: a duration override is not supported for executor "${config.executor}".`
      );
    }
    if (!supplied.duration || typeof supplied.duration !== 'string') {
      throw new Error('Execution/Configuration Failure: duration override must be a non-empty string.');
    }
    updated.duration = supplied.duration;
  }

  return { [name]: updated };
}

// Ties selection and override together, reading the plain (non-secret)
// runtime inputs directly from k6's native __ENV — mirroring exactly how
// CC-01's resolveEnvironment reads __ENV.ENVIRONMENT. PROFILE/VUS/
// DURATION are never secrets, so — unlike credentials — CC-07 reads them
// itself rather than requiring the caller to.
export function resolveRuntimeLoadProfile(profiles) {
  const selected = selectLoadProfile(profiles, __ENV.PROFILE);
  const overrides = {};
  if (__ENV.VUS !== undefined) {
    overrides.vus = __ENV.VUS;
  }
  if (__ENV.DURATION !== undefined) {
    overrides.duration = __ENV.DURATION;
  }
  return applyRuntimeOverrides(selected, overrides);
}
