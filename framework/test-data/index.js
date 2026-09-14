// CC-05 — Test Data
//
// Generic supply mechanism for values intentionally supplied as input to
// an execution (P2-D06 §8) — distinct from correlation (CC-04), which
// supplies values extracted from a response after it occurs. CC-05 never
// contains data content itself; the data source object and any generation
// rule are always supplied by the caller (Layer 1 / data assets).
import { resolveEnvironment } from '../configuration/index.js';
import exec from 'k6/execution';

// Static category (P2-D06 §8.6): a fixed value, identical regardless of
// environment. No CC-01 dependency — static data is environment-independent
// by definition, so consulting environment context here would be
// unnecessary coupling.
export function getStaticData(dataSource, key) {
  if (!dataSource || typeof dataSource !== 'object') {
    throw new Error('Execution/Configuration Failure: a test-data source object is required.');
  }
  if (!key) {
    throw new Error('Execution/Configuration Failure: a test-data key is required.');
  }
  if (!(key in dataSource)) {
    throw new Error(`Execution/Configuration Failure: required test-data key "${key}" is missing.`);
  }
  return dataSource[key];
}

// Environment-specific category (P2-D06 §8.7): consults CC-01's
// environment context only (resolveEnvironment) — the data source itself
// is a separate, CC-05-owned object, never CC-01's configuration source.
export function getEnvironmentData(dataSource, key) {
  if (!dataSource || typeof dataSource !== 'object') {
    throw new Error('Execution/Configuration Failure: a test-data source object is required.');
  }
  if (!key) {
    throw new Error('Execution/Configuration Failure: a test-data key is required.');
  }

  const environment = resolveEnvironment();
  const environmentData = dataSource[environment];
  if (!environmentData) {
    throw new Error(`Execution/Configuration Failure: no test data found for environment "${environment}".`);
  }
  if (!(key in environmentData)) {
    throw new Error(
      `Execution/Configuration Failure: required test-data key "${key}" is missing for environment "${environment}".`
    );
  }
  return environmentData[key];
}

// Dynamic/generated category (P2-D06 §8.8): CC-05 provides only the
// reusable invocation pattern, not a specific generation algorithm — the
// rule itself is supplied by the caller. Native k6 VU/iteration context
// (Layer 3) is passed through so a rule can build collision-free unique
// values without inventing its own uniqueness scheme.
export function generateTestData(generatorFn) {
  if (!generatorFn || typeof generatorFn !== 'function') {
    throw new Error('Execution/Configuration Failure: a data-generation rule function is required.');
  }
  return generatorFn({ vuId: exec.vu.idInTest, iterationInInstance: exec.vu.iterationInInstance });
}
