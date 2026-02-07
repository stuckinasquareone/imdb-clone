/**
 * Lighthouse Configuration
 * Defines performance testing configuration and thresholds.
 */

module.exports = {
  extends: 'lighthouse:default',
  settings: {
    // Run Lighthouse in an emulated environment
    emulatedFormFactor: 'desktop',
    
    // Run with JavaScript disabled (optional, depends on needs)
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    
    // Network throttling settings
    throttling: {
      rttMs: 40,
      downloadSpeedKbps: 11024,
      uploadSpeedKbps: 2500
    },
    
    // CPU throttling - 4x slowdown
    cpuSlowdownMultiplier: 4,
    
    // Screenshot settings
    skipAudits: [],
    
    // Maximum time to wait for page load
    maxWaitForLoad: 45000,
    
    // Number of runs
    runs: 1,
    
    // Use local testing
    port: 8080
  }
};
