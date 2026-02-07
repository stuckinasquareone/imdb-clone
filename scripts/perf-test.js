#!/usr/bin/env node

/**
 * Local Lighthouse Performance Testing Script
 * Helps developers test performance locally before pushing to CI/CD.
 * 
 * Usage:
 *   npm run perf-test
 *   npm run perf-test -- http://localhost:3000/about
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const performanceThresholds = require('../config/performanceThresholds');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  grey: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkServerRunning(port = 3000) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
      req.destroy();
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  log('🚀 Starting development server...', 'cyan');

  const isRunning = await checkServerRunning();
  if (isRunning) {
    log('✅ Server is already running on http://localhost:3000', 'green');
    return true;
  }

  return new Promise((resolve) => {
    const server = spawn('npm', ['start'], {
      stdio: 'inherit',
      detached: false,
      shell: true
    });

    // Wait for server to start
    const waitForServer = setInterval(async () => {
      const running = await checkServerRunning();
      if (running) {
        clearInterval(waitForServer);
        log('✅ Server started successfully', 'green');
        resolve(true);
      }
    }, 1000);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(waitForServer);
      log('⚠️  Server startup timed out', 'yellow');
      resolve(false);
    }, 30000);
  });
}

async function runLighthouse() {
  const urls = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['http://localhost:3000/'];

  try {
    log('\n' + colors.bold + '═══════════════════════════════════════', 'cyan');
    log('🔍 LOCAL LIGHTHOUSE PERFORMANCE TEST', 'cyan');
    log('═══════════════════════════════════════' + colors.reset, 'cyan');

    // Check if server is running
    const serverOk = await checkServerRunning();
    if (!serverOk) {
      log('\n⚠️  Development server not running', 'yellow');
      log('Would you like to start it? (Press Ctrl+C to cancel)\n', 'yellow');
      await startServer();
    }

    // Run Lighthouse tests
    log(`\n📊 Testing ${urls.length} URL(s):\n`, 'cyan');
    urls.forEach((url, i) => {
      log(`  ${i + 1}. ${url}`, 'blue');
    });

    const args = ['scripts/lighthouse-test.js', ...urls];
    
    const child = spawn('node', args, {
      stdio: 'inherit'
    });

    return new Promise((resolve) => {
      child.on('close', (code) => {
        if (code === 0) {
          log('\n✅ All tests passed!', 'green');
          log('💾 Reports saved to ./lighthouse-reports/', 'blue');
        } else {
          log('\n❌ Some tests failed', 'red');
          log('📋 Review the reports to see what needs improvement', 'yellow');
        }
        resolve(code);
      });
    });
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the test
runLighthouse().then((code) => {
  process.exit(code || 0);
});
