// CC-01 — Configuration
//
// Pull-based configuration resolution mechanism (CT-01, P2-D03/P2-D05).
// Mechanism only — this module never contains configuration values itself.
// Environment selection uses k6's native __ENV (Layer 3); no default
// environment is assumed, so a missing selection fails clearly rather than
// silently resolving against the wrong environment.

export function resolveEnvironment() {
  const environment = __ENV.ENVIRONMENT;
  if (!environment) {
    throw new Error(
      'Execution/Configuration Failure: ENVIRONMENT is required (pass -e ENVIRONMENT=<name> to k6 run) but was not provided.'
    );
  }
  return environment;
}

export function resolveConfig(configSource, key) {
  if (!configSource || typeof configSource !== 'object') {
    throw new Error('Execution/Configuration Failure: a configuration source object is required.');
  }
  if (!key) {
    throw new Error('Execution/Configuration Failure: a configuration key is required.');
  }

  const environment = resolveEnvironment();
  const environmentConfig = configSource[environment];
  if (!environmentConfig) {
    throw new Error(
      `Execution/Configuration Failure: no configuration found for environment "${environment}".`
    );
  }
  if (!(key in environmentConfig)) {
    throw new Error(
      `Execution/Configuration Failure: required configuration key "${key}" is missing for environment "${environment}".`
    );
  }

  return environmentConfig[key];
}
