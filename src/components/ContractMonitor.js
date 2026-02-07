/**
 * ContractMonitor Component
 * Displays API contract validation history and statistics.
 * Helps developers track and identify backend compatibility issues.
 */

import React, { useEffect, useState, useCallback } from 'react';
import apiContractValidator from '../services/apiSchemaValidator';
import './ContractMonitor.css';

export default function ContractMonitor() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update statistics periodically
  useEffect(() => {
    const updateStats = () => {
      const currentStats = apiContractValidator.getStatistics();
      const allHistory = apiContractValidator.getHistory(null, 50);
      
      setStats(currentStats);
      setHistory(allHistory);
    };

    updateStats();

    if (!autoRefresh) return;

    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleToggleEndpoint = useCallback((endpoint) => {
    setExpandedEndpoint(expandedEndpoint === endpoint ? null : endpoint);
  }, [expandedEndpoint]);

  if (!stats) {
    return <div className="contract-monitor loading">Loading contract monitor...</div>;
  }

  const successRate = stats.totalValidations > 0
    ? Math.round((stats.successCount / stats.totalValidations) * 100)
    : 100;

  const getStatusColor = (endpoint) => {
    const endpointStats = stats.byEndpoint[endpoint];
    if (!endpointStats) return 'neutral';
    if (endpointStats.failed === 0) return 'success';
    return 'error';
  };

  return (
    <div className="contract-monitor">
      {/* Header */}
      <div className="monitor-header">
        <h3 className="monitor-title">📋 API Contract Monitor</h3>
        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </div>

      {/* Overview Stats */}
      <div className="monitor-overview">
        <div className="stat-card">
          <div className="stat-label">Total Validations</div>
          <div className="stat-value">{stats.totalValidations}</div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Successful</div>
          <div className="stat-value">{stats.successCount}</div>
        </div>

        <div className={`stat-card ${stats.failureCount > 0 ? 'error' : 'success'}`}>
          <div className="stat-label">Failed</div>
          <div className="stat-value">{stats.failureCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Success Rate</div>
          <div className={`stat-value ${successRate === 100 ? 'success' : successRate > 80 ? 'warning' : 'error'}`}>
            {successRate}%
          </div>
        </div>
      </div>

      {/* By Endpoint */}
      <div className="monitor-section">
        <h4 className="section-title">Validations by Endpoint</h4>
        
        {Object.keys(stats.byEndpoint).length === 0 ? (
          <p className="empty-message">No validations yet</p>
        ) : (
          <div className="endpoints-list">
            {Object.entries(stats.byEndpoint).map(([endpoint, endpointStats]) => (
              <div key={endpoint} className={`endpoint-card ${getStatusColor(endpoint)}`}>
                <button
                  className="endpoint-header"
                  onClick={() => handleToggleEndpoint(endpoint)}
                >
                  <span className="endpoint-name">{endpoint}</span>
                  <div className="endpoint-counts">
                    <span className="count total">Total: {endpointStats.total}</span>
                    <span className="count success">✅ {endpointStats.success}</span>
                    {endpointStats.failed > 0 && (
                      <span className="count failed">❌ {endpointStats.failed}</span>
                    )}
                  </div>
                  <span className="expand-icon">
                    {expandedEndpoint === endpoint ? '▼' : '▶'}
                  </span>
                </button>

                {expandedEndpoint === endpoint && (
                  <div className="endpoint-details">
                    {history
                      .filter(h => h.endpointKey === endpoint)
                      .slice(-5)
                      .reverse()
                      .map((record, idx) => (
                        <div key={idx} className={`validation-record ${record.isValid ? 'valid' : 'invalid'}`}>
                          <div className="record-header">
                            <span className="record-status">
                              {record.isValid ? '✅ Valid' : '❌ Invalid'}
                            </span>
                            <span className="record-time">
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          {!record.isValid && (
                            <div className="record-errors">
                              {record.errors.slice(0, 3).map((error, errIdx) => (
                                <div key={errIdx} className="error-summary">
                                  <code className="error-field">{error.field}</code>
                                  <span className="error-type">{error.type}</span>
                                </div>
                              ))}
                              {record.errors.length > 3 && (
                                <div className="error-more">
                                  +{record.errors.length - 3} more errors
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Types */}
      {Object.keys(stats.errorTypes).length > 0 && (
        <div className="monitor-section">
          <h4 className="section-title">Common Error Types</h4>
          <div className="error-types-list">
            {Object.entries(stats.errorTypes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="error-type-item">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {stats.recentErrors.length > 0 && (
        <div className="monitor-section">
          <h4 className="section-title">🚨 Recent Errors</h4>
          <div className="recent-errors">
            {stats.recentErrors.slice(-5).reverse().map((record, idx) => (
              <div key={idx} className="error-record">
                <div className="error-record-header">
                  <code className="endpoint-key">{record.endpointKey}</code>
                  <span className="error-count">
                    {record.errors.length} error{record.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="error-list">
                  {record.errors.slice(0, 2).map((error, errIdx) => (
                    <li key={errIdx}>
                      <strong>{error.field}:</strong> {error.message}
                    </li>
                  ))}
                  {record.errors.length > 2 && (
                    <li className="more-errors">
                      +{record.errors.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="monitor-info">
        <p>
          💡 The API Contract Monitor tracks validation results in real-time. Use this to identify
          when backend changes break the frontend API contract.
        </p>
      </div>
    </div>
  );
}
