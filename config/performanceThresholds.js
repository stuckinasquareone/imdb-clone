/**
 * Performance Thresholds Configuration
 * Defines minimum acceptable scores for different routes and metrics.
 * Blocks merges if scores fall below these thresholds.
 * 
 * Scale: 0-100 (Lighthouse score)
 */

const performanceThresholds = {
  // Global minimum thresholds for all pages
  global: {
    performance: 75,
    accessibility: 90,
    'best-practices': 85,
    seo: 80
  },

  // Per-route thresholds (can be more strict)
  routes: {
    '/': {
      performance: 80,
      accessibility: 95,
      'best-practices': 90,
      seo: 85,
      description: 'Homepage - Critical for first impressions'
    },
    '/watch-progress': {
      performance: 75,
      accessibility: 90,
      'best-practices': 85,
      seo: 75,
      description: 'Watch progress tracking page'
    },
    '/validator': {
      performance: 70,
      accessibility: 90,
      'best-practices': 85,
      seo: 70,
      description: 'URL validator utility - Lower performance requirement'
    }
  },

  // Web Vitals thresholds (optional - for detailed metrics)
  vitals: {
    // Largest Contentful Paint (LCP) - should be <= 2.5s
    lcp: 2500,
    // First Input Delay (FID) - should be <= 100ms
    fid: 100,
    // Cumulative Layout Shift (CLS) - should be <= 0.1
    cls: 0.1
  },

  // Enforce thresholds
  enforce: true,

  // If true, block merge on threshold failure
  blockMerge: true,

  // If true, comment on PRs with results
  commentOnPR: true,

  // Maximum retries if a test fails
  maxRetries: 2,

  // Time between retries (ms)
  retryDelay: 5000,

  // Report settings
  report: {
    // Save detailed JSON reports
    saveJSON: true,
    
    // Save HTML reports
    saveHTML: true,
    
    // Output directory
    outputDir: './lighthouse-reports',
    
    // Keep reports for N days
    retention: 30
  }
};

module.exports = performanceThresholds;
