/**
 * Performance Metrics Dashboard
 * 
 * Displays real-time Web Vitals and performance metrics
 * Only shown in development mode and can be toggled with Ctrl+Shift+P
 * 
 * Learning objectives:
 * - Real-time data visualization
 * - Understanding Web Vitals and their thresholds
 * - Developer tools and debugging techniques
 */

import React, { useState, useEffect } from 'react';
import telemetryService from '../services/telemetryService';
import './PerformanceDashboard.css';

const PerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [updateCount, setUpdateCount] = useState(0);

  // Web Vitals thresholds and good ranges
  const VITALS_THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
    FID: { good: 100, needsImprovement: 300, unit: 'ms', description: 'First Input Delay' },
    CLS: { good: 0.1, needsImprovement: 0.25, unit: '', description: 'Cumulative Layout Shift' },
    FCP: { good: 1800, needsImprovement: 3000, unit: 'ms', description: 'First Contentful Paint' },
    TTFB: { good: 800, needsImprovement: 1800, unit: 'ms', description: 'Time to First Byte' },
  };

  // Listen for keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyP') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const summary = telemetryService.getMetricsSummary();
      setMetrics(summary);
      setUpdateCount(c => c + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { vitals = {}, byType = {}, totalMetrics = 0 } = metrics;

  const getRatingClass = (rating) => {
    switch (rating) {
      case 'good':
        return 'rating-good';
      case 'needs-improvement':
        return 'rating-needs-improvement';
      case 'poor':
        return 'rating-poor';
      default:
        return 'rating-unknown';
    }
  };

  const getThresholdStatus = (name, value) => {
    const threshold = VITALS_THRESHOLDS[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h3>📊 Performance Metrics (Dev Mode)</h3>
        <button
          className="close-btn"
          onClick={() => setIsVisible(false)}
          title="Close dashboard"
        >
          ✕
        </button>
      </div>

      <div className="dashboard-content">
        {/* Web Vitals Section */}
        <div className="vitals-section">
          <h4>Web Vitals</h4>
          <div className="vitals-grid">
            {Object.entries(VITALS_THRESHOLDS).map(([name, config]) => {
              const vital = vitals[name];
              const status = vital ? getThresholdStatus(name, vital.value) : 'not-recorded';

              return (
                <div key={name} className={`vital-card ${status}`}>
                  <div className="vital-name">{name}</div>
                  <div className="vital-description">{config.description}</div>
                  {vital ? (
                    <>
                      <div className="vital-value">
                        {vital.value.toFixed(2)}{config.unit}
                      </div>
                      <div className={`vital-rating ${getRatingClass(vital.rating)}`}>
                        {vital.rating}
                      </div>
                      <div className="vital-threshold">
                        Good: ≤{config.good}{config.unit}
                      </div>
                    </>
                  ) : (
                    <div className="vital-value" style={{ color: '#999' }}>Not recorded yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="summary-section">
          <h4>Metrics Summary</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Total Metrics Collected:</span>
              <span className="stat-value">{totalMetrics}</span>
            </div>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="stat">
                <span className="stat-label">{type}:</span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Info */}
        <div className="session-section">
          <h4>Session Info</h4>
          <div className="session-details">
            <div className="detail">
              <span className="label">Session ID:</span>
              <span className="value">{telemetryService.sessionId}</span>
            </div>
            <div className="detail">
              <span className="label">URL:</span>
              <span className="value">{window.location.href}</span>
            </div>
            <div className="detail">
              <span className="label">DevTools Shortcut:</span>
              <span className="value">Ctrl+Shift+P</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <strong>📚 Learning Resources:</strong>
          <ul>
            <li>Web Vitals measure real user experience</li>
            <li>LCP: How quickly main content loads</li>
            <li>FID: Responsiveness to user input</li>
            <li>CLS: Visual stability during interaction</li>
            <li>Data is sent to backend for analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
