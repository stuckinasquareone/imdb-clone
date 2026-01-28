/**
 * Telemetry Service
 * Handles collection and transmission of performance metrics to the backend
 * 
 * Learning objectives:
 * - Understanding performance monitoring and observability
 * - How to collect Web Vitals metrics
 * - Best practices for telemetry data aggregation
 * - Server communication patterns for analytics
 */

class TelemetryService {
  constructor(backendUrl = '/api/metrics') {
    this.backendUrl = backendUrl;
    this.metrics = [];
    this.isDev = process.env.NODE_ENV === 'development';
    this.batchSize = 10; // Send metrics in batches
    this.flushInterval = 30000; // 30 seconds
    this.sessionId = this.generateSessionId();
    
    // Start periodic flush of metrics
    this.startBatchFlush();
  }

  /**
   * Generate a unique session ID for tracking this user's session
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record a Web Vitals metric
   * @param {Object} metric - Metric data from web-vitals library
   * @param {string} metric.name - Metric name (LCP, CLS, FID, etc.)
   * @param {number} metric.value - Metric value
   * @param {number} metric.rating - 'good', 'needs-improvement', or 'poor'
   */
  recordMetric(metric) {
    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      deviceMemory: navigator.deviceMemory || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown',
    };

    this.metrics.push(enrichedMetric);

    if (this.isDev) {
      console.log('[Telemetry]', enrichedMetric.name, enrichedMetric.value.toFixed(2), `ms (${enrichedMetric.rating})`);
    }

    // Send immediately if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Record a custom event or interaction
   * @param {string} eventName - Name of the event
   * @param {Object} data - Event data
   */
  recordEvent(eventName, data = {}) {
    const event = {
      type: 'event',
      name: eventName,
      timestamp: Date.now(),
      data,
      url: window.location.href,
      sessionId: this.sessionId,
    };

    this.metrics.push(event);

    if (this.isDev) {
      console.log('[Event]', eventName, data);
    }
  }

  /**
   * Record resource timing (API calls, asset loads, etc.)
   * @param {string} resourceName - Name of the resource
   * @param {number} duration - Duration in ms
   * @param {string} status - Status ('success', 'error')
   */
  recordResourceTiming(resourceName, duration, status = 'success') {
    const timing = {
      type: 'resource',
      name: resourceName,
      duration,
      status,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.metrics.push(timing);

    if (this.isDev) {
      console.log('[Resource]', resourceName, `${duration.toFixed(2)}ms`, `[${status}]`);
    }
  }

  /**
   * Send accumulated metrics to the backend
   */
  async flush() {
    if (this.metrics.length === 0) return;

    const metricsToSend = this.metrics.splice(0, this.batchSize);

    try {
      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          sessionId: this.sessionId,
          timestamp: Date.now(),
        }),
        // Use keepalive for reliability even if page unloads
        keepalive: true,
      });

      if (!response.ok && this.isDev) {
        console.warn(`[Telemetry] Failed to send metrics: ${response.status}`);
      }
    } catch (error) {
      if (this.isDev) {
        console.error('[Telemetry] Error sending metrics:', error);
      }
      // Re-add metrics to queue if sending failed (simple retry logic)
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Start periodic flushing of metrics
   */
  startBatchFlush() {
    this.flushTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Stop the telemetry service and send any pending metrics
   */
  stop() {
    clearInterval(this.flushTimer);
    this.flush(); // Send remaining metrics
  }

  /**
   * Get current metrics for the dashboard
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Get metrics summary for display
   */
  getMetricsSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      byType: {},
      vitals: {},
    };

    this.metrics.forEach(metric => {
      const type = metric.type || 'vital';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      if (metric.name && ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'].includes(metric.name)) {
        summary.vitals[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        };
      }
    });

    return summary;
  }
}

// Create singleton instance
const telemetryService = new TelemetryService();

export default telemetryService;
