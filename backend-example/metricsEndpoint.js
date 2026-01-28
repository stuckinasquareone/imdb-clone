/**
 * Backend Metrics Endpoint Example
 * 
 * This is an example Express.js endpoint for receiving telemetry data
 * 
 * Installation:
 * npm install express body-parser cors
 * 
 * Usage:
 * 1. Replace '/api/metrics' in telemetryService.js with your endpoint
 * 2. Implement this handler in your backend
 * 3. Store metrics data in your database for analysis
 */

// Example Express.js handler
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

/**
 * POST /api/metrics
 * Receives batched telemetry data from client applications
 */
app.post('/api/metrics', (req, res) => {
  const { metrics, sessionId, timestamp } = req.body;

  console.log(`[${new Date().toISOString()}] Received ${metrics.length} metrics from session ${sessionId}`);

  // Process and analyze metrics
  const analysis = analyzeMetrics(metrics);
  
  console.log('Metrics Summary:', {
    sessionId,
    metricsCount: metrics.length,
    analysis,
    timestamp: new Date(timestamp).toISOString(),
  });

  // TODO: Store metrics in database
  // Example: saveMetricsToDatabase(sessionId, metrics, analysis)

  // Log any poor performing metrics
  metrics.forEach(metric => {
    if (metric.type === 'vital' && metric.rating === 'poor') {
      console.warn(`⚠️  Poor ${metric.name}: ${metric.value}ms (threshold: ${metric.value})`);
    }
  });

  // Return success response
  res.json({
    success: true,
    message: 'Metrics received and processed',
    processedCount: metrics.length,
  });
});

/**
 * Analyze metrics and extract insights
 */
function analyzeMetrics(metrics) {
  const vitals = {};
  const events = [];
  const resources = [];

  metrics.forEach(metric => {
    if (metric.type === 'vital' || metric.name) {
      const vitalName = metric.name;
      if (!vitals[vitalName]) {
        vitals[vitalName] = [];
      }
      vitals[vitalName].push(metric.value);
    } else if (metric.type === 'event') {
      events.push(metric.name);
    } else if (metric.type === 'resource') {
      resources.push(metric);
    }
  });

  // Calculate averages for vitals
  const vitalAverages = {};
  Object.entries(vitals).forEach(([name, values]) => {
    vitalAverages[name] = {
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
    };
  });

  // Find slowest resources
  const slowestResources = resources
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  return {
    vitals: vitalAverages,
    topEvents: [...new Set(events)].slice(0, 10),
    slowestResources,
    totalEvents: events.length,
  };
}

/**
 * GET /api/metrics/summary
 * Get analytics dashboard data
 */
app.get('/api/metrics/summary', (req, res) => {
  // TODO: Query database and return aggregated metrics
  res.json({
    message: 'Implement this endpoint to return aggregated metrics from your database',
    avgLCP: '2.3s',
    avgCLS: '0.08',
    avgFID: '45ms',
    sessionsToday: 1250,
    alertingEnabled: true,
  });
});

/**
 * GET /api/metrics/alerts
 * Get performance alerts
 */
app.get('/api/metrics/alerts', (req, res) => {
  // TODO: Return critical performance issues
  res.json({
    alerts: [
      {
        id: 1,
        type: 'poor-lcp',
        message: 'LCP degradation detected in Chrome (5s average)',
        severity: 'high',
        affectedUsers: 342,
      },
    ],
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Telemetry server running on http://localhost:${PORT}`);
  console.log('📊 Receiving performance metrics from clients');
});

module.exports = app;
