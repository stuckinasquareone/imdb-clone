#!/usr/bin/env node

/**
 * Lighthouse Performance Test Runner
 * Runs Lighthouse audits on specified URLs and enforces thresholds.
 * Used in CI/CD pipeline to gate merges based on performance scores.
 */

const fs = require('fs');
const path = require('path');
const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');
const performanceThresholds = require('../config/performanceThresholds');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Format console output with colors
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Launch Chrome for Lighthouse
 */
async function launchChrome() {
  try {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    return chrome;
  } catch (error) {
    log(`⚠️  Failed to launch Chrome, trying without headless mode...`, 'yellow');
    try {
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--no-sandbox', '--disable-gpu']
      });
      return chrome;
    } catch (innerError) {
      throw new Error(`Failed to launch Chrome: ${innerError.message}`);
    }
  }
}

/**
 * Run Lighthouse audit on a URL
 */
async function runLighthouse(url, chrome, options = {}) {
  try {
    const lighthouseOptions = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
      emulatedFormFactor: 'desktop',
      skipAudits: ['uses-http2'],
      ...options
    };

    const runnerResult = await lighthouse(url, lighthouseOptions);
    return runnerResult.lhr;
  } catch (error) {
    throw new Error(`Lighthouse audit failed for ${url}: ${error.message}`);
  }
}

/**
 * Check if scores meet thresholds
 */
function checkThresholds(scores, thresholds) {
  const results = {
    passed: true,
    violations: [],
    warnings: []
  };

  for (const [category, minScore] of Object.entries(thresholds)) {
    const actualScore = Math.round(scores[category] * 100);
    
    if (actualScore < minScore) {
      results.passed = false;
      results.violations.push({
        category,
        actual: actualScore,
        minimum: minScore,
        gap: minScore - actualScore
      });
    } else if (actualScore < minScore + 10) {
      results.warnings.push({
        category,
        actual: actualScore,
        minimum: minScore,
        gap: actualScore - minScore
      });
    }
  }

  return results;
}

/**
 * Format report for console output
 */
function formatReport(url, scores, thresholds) {
  let report = `\n${colors.bold}📊 Lighthouse Audit Results${colors.reset}\n`;
  report += `${colors.cyan}URL: ${url}${colors.reset}\n`;
  report += `Time: ${new Date().toLocaleString()}\n\n`;

  // Show each category
  for (const [category, score] of Object.entries(scores)) {
    const threshold = thresholds[category] || 0;
    const actualScore = Math.round(score * 100);
    let scoreColor = 'green';
    let symbol = '✅';

    if (actualScore < 50) {
      scoreColor = 'red';
      symbol = '❌';
    } else if (actualScore < 75) {
      scoreColor = 'yellow';
      symbol = '⚠️ ';
    }

    const gauge = createScoreGauge(actualScore);
    report += `${symbol} ${category.padEnd(20)} ${colors[scoreColor]}${actualScore.toString().padStart(3)}/100${colors.reset} ${gauge}`;
    
    if (threshold > 0) {
      report += ` (min: ${threshold})`;
    }
    report += '\n';
  }

  return report;
}

/**
 * Create a simple gauge visualization
 */
function createScoreGauge(score) {
  const segments = 20;
  const filled = Math.round((score / 100) * segments);
  const empty = segments - filled;
  
  let color = 'green';
  if (score < 50) color = 'red';
  else if (score < 75) color = 'yellow';
  
  return `${colors[color]}[${'▓'.repeat(filled)}${'░'.repeat(empty)}]${colors.reset}`;
}

/**
 * Save report to file
 */
function saveReport(url, lhr, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const urlSafe = url.replace(/[/:]/g, '_');
  
  // Save JSON report
  const jsonFile = path.join(outputDir, `lighthouse_${urlSafe}_${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(lhr, null, 2));
  log(`📄 Detailed report saved to: ${jsonFile}`, 'blue');

  return jsonFile;
}

/**
 * Generate summary report
 */
function generateSummaryReport(results) {
  let summary = '\n' + colors.bold + '═══════════════════════════════════════' + colors.reset + '\n';
  summary += colors.bold + '📋 AUDIT SUMMARY' + colors.reset + '\n';
  summary += colors.bold + '═══════════════════════════════════════' + colors.reset + '\n\n';

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    summary += `${status} ${result.url}\n`;

    if (result.passed) {
      passCount++;
    } else {
      failCount++;
      summary += colors.red + `   ${result.violations.length} threshold violation(s)\n` + colors.reset;
      for (const v of result.violations) {
        summary += `   - ${v.category}: ${v.actual}/100 (min: ${v.minimum})\n`;
      }
    }
  }

  summary += `\n${colors.bold}Results: ${passCount} passed, ${failCount} failed${colors.reset}\n`;

  return { summary, passCount, failCount };
}

/**
 * Main test runner
 */
async function runPerformanceTests(urls = []) {
  log('🚀 Starting Lighthouse Performance Tests', 'cyan');
  
  // Default to homepage if no URLs provided
  if (!urls || urls.length === 0) {
    urls = ['http://localhost:3000/'];
  }

  const results = [];
  let chrome;

  try {
    // Launch Chrome once for all tests
    log('📍 Launching Chrome browser...', 'blue');
    chrome = await launchChrome();
    log(`✅ Chrome launched on port ${chrome.port}`, 'green');

    // Run Lighthouse for each URL
    for (const url of urls) {
      log(`\n🔍 Auditing: ${url}`, 'cyan');

      const routeThresholds = performanceThresholds.routes[url] || performanceThresholds.global;

      const lhr = await runLighthouse(url, chrome);
      const scores = {
        performance: lhr.categories.performance.score,
        accessibility: lhr.categories.accessibility.score,
        'best-practices': lhr.categories['best-practices'].score,
        seo: lhr.categories.seo.score
      };

      const thresholds = {
        performance: routeThresholds.performance,
        accessibility: routeThresholds.accessibility,
        'best-practices': routeThresholds['best-practices'],
        seo: routeThresholds.seo
      };

      const check = checkThresholds(scores, thresholds);

      // Print report
      console.log(formatReport(url, scores, thresholds));

      // Save report if configured
      if (performanceThresholds.report.saveJSON) {
        saveReport(url, lhr, performanceThresholds.report.outputDir);
      }

      results.push({
        url,
        passed: check.passed,
        scores,
        thresholds,
        violations: check.violations,
        warnings: check.warnings,
        lhr
      });
    }

    // Generate summary
    const { summary, failCount } = generateSummaryReport(results);
    console.log(summary);

    // Exit with appropriate code
    if (failCount > 0) {
      log('\n❌ PERFORMANCE TESTS FAILED', 'red');
      if (performanceThresholds.blockMerge) {
        log('🚫 Merge blocked due to performance threshold violations', 'red');
      }
      process.exit(1);
    } else {
      log('\n✅ ALL PERFORMANCE TESTS PASSED', 'green');
      process.exit(0);
    }
  } catch (error) {
    log(`\n❌ Error running performance tests: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Clean up Chrome
    if (chrome) {
      await chrome.kill();
      log('Cleaned up Chrome browser', 'blue');
    }
  }
}

// Export for testing
module.exports = {
  runPerformanceTests,
  runLighthouse,
  checkThresholds,
  formatReport,
  generateSummaryReport,
  saveReport
};

// Run if called directly
if (require.main === module) {
  const urls = process.argv.slice(2);
  runPerformanceTests(urls);
}
