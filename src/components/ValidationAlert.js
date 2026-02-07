/**
 * Validation Alert Component
 * Displays API contract validation errors and warnings.
 */

import React, { useState, useCallback } from 'react';
import './ValidationAlert.css';

export default function ValidationAlert({ error, onDismiss, autoClose = true }) {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    if (!autoClose || !isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [autoClose, isVisible, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!isVisible || !error) return null;

  const errorCount = error.errors?.length || 0;
  const warningCount = error.warnings?.length || 0;

  return (
    <div className={`validation-alert validation-alert-${error.errors?.length > 0 ? 'error' : 'warning'}`}>
      <div className="alert-content">
        <div className="alert-header">
          <div className="alert-icon">
            {error.errors?.length > 0 ? '❌' : '⚠️'}
          </div>
          <div className="alert-title-section">
            <h3 className="alert-title">
              API Contract Violation
            </h3>
            <p className="alert-endpoint">
              Endpoint: <code>{error.endpointKey}</code>
            </p>
          </div>
          <button
            className="alert-close"
            onClick={handleDismiss}
            aria-label="Close alert"
          >
            ✕
          </button>
        </div>

        {/* Error Summary */}
        <div className="alert-summary">
          {errorCount > 0 && (
            <span className="summary-item errors">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="summary-item warnings">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Errors */}
        {error.errors && error.errors.length > 0 && (
          <div className="alert-section errors-section">
            <h4 className="section-title">Errors</h4>
            <ul className="error-list">
              {error.errors.map((err, idx) => (
                <li key={idx} className="error-item">
                  <div className="error-field">
                    <code>{err.field}</code>
                    <span className="error-type">{err.type}</span>
                  </div>
                  <div className="error-message">{err.message}</div>
                  {err.expectedType && (
                    <div className="error-detail">
                      Expected: <code>{err.expectedType}</code>, Got: <code>{err.actualType}</code>
                    </div>
                  )}
                  {err.expectedValues && (
                    <div className="error-detail">
                      Expected one of: <code>{err.expectedValues.join(', ')}</code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {error.warnings && error.warnings.length > 0 && (
          <div className="alert-section warnings-section">
            <h4 className="section-title">Warnings</h4>
            <ul className="warning-list">
              {error.warnings.map((warn, idx) => (
                <li key={idx} className="warning-item">
                  <div className="warning-field">
                    <code>{warn.field || warn.type}</code>
                  </div>
                  <div className="warning-message">{warn.message}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help Text */}
        <div className="alert-help">
          <p>
            💡 <strong>What happened:</strong> The API response doesn't match the expected schema.
            This usually indicates a backend change that needs frontend updates.
          </p>
          <p>
            <strong>What to do:</strong> Review the errors above and update the API schema definition
            to match the new response structure.
          </p>
        </div>
      </div>
    </div>
  );
}
