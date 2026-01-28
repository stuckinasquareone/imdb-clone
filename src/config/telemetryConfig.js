/**
 * Telemetry Configuration
 * 
 * Customize the telemetry system for your needs
 * Import this and pass config to TelemetryService
 */

export const TELEMETRY_CONFIG = {
  // Backend endpoint URL - update this to your actual endpoint
  BACKEND_URL: process.env.REACT_APP_METRICS_ENDPOINT || '/api/metrics',

  // Enable/disable telemetry per environment
  ENABLED: {
    development: true,
    production: true,
    test: false,
  },

  // Sampling rate (0.0 to 1.0)
  // 0.1 = send 10% of metrics (for high-traffic apps)
  // 1.0 = send 100% of metrics (for low-traffic or critical)
  SAMPLING_RATE: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,

  // Batch settings
  BATCH_SIZE: 10, // Number of metrics before flushing
  FLUSH_INTERVAL: 30000, // Milliseconds between flushes

  // Metric collection
  COLLECT_VITALS: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'],
  COLLECT_EVENTS: true,
  COLLECT_RESOURCES: true,

  // Privacy settings
  PRIVACY: {
    // Don't collect these URLs
    IGNORE_URLS: [
      '/health-check',
      '/ping',
      '/metrics', // Don't track the metrics endpoint itself
    ],
    // Don't track these events
    IGNORE_EVENTS: [
      'internal_',
      'debug_',
    ],
  },

  // Console logging in dev mode
  DEBUG: process.env.NODE_ENV === 'development',

  // Performance thresholds for alerting
  THRESHOLDS: {
    LCP: 2500,      // milliseconds
    FID: 100,       // milliseconds
    CLS: 0.1,       // cumulative shift
    FCP: 1800,      // milliseconds
    TTFB: 800,      // milliseconds
  },

  // Session tracking
  SESSION: {
    TRACK_DURATION: true,
    TRACK_INTERACTIONS: true,
    MAX_SESSION_DURATION: 4 * 60 * 60 * 1000, // 4 hours
  },

  // Retention policy
  RETENTION: {
    MAX_METRICS_IN_MEMORY: 1000,
    MAX_RETRIES: 3,
  },
};

/**
 * Initialize telemetry based on configuration
 */
export function initializeTelemetry() {
  const config = TELEMETRY_CONFIG;
  const env = process.env.NODE_ENV || 'development';

  if (!config.ENABLED[env]) {
    console.log(`[Telemetry] Disabled for ${env} environment`);
    return null;
  }

  console.log(`[Telemetry] Initialized for ${env}`, {
    endpoint: config.BACKEND_URL,
    sampling: `${(config.SAMPLING_RATE * 100).toFixed(0)}%`,
    batchSize: config.BATCH_SIZE,
  });

  return config;
}

export default TELEMETRY_CONFIG;
