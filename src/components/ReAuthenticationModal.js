/**
 * ReAuthenticationModal Component
 * Displays re-authentication prompt when suspicious activity is detected.
 * Provides clear messaging and secure credential input.
 */

import React, { useState, useCallback } from 'react';
import './ReAuthenticationModal.css';

export default function ReAuthenticationModal({
  isOpen,
  suspiciousActivity,
  onReAuthenticate,
  isLoading = false
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setError('');
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await onReAuthenticate({ password });

    if (!result.success) {
      setError(result.error || 'Re-authentication failed');
      setPassword('');
    } else {
      setPassword('');
      setError('');
    }
  }, [password, onReAuthenticate]);

  if (!isOpen) return null;

  const severityClass = suspiciousActivity?.severity || 'medium';

  return (
    <div className="reauth-modal-overlay">
      <div className={`reauth-modal reauth-${severityClass}`}>
        {/* Header */}
        <div className="reauth-header">
          <div className="reauth-icon">
            {severityClass === 'high' ? '🚨' : '⚠️'}
          </div>
          <h2 className="reauth-title">Re-Authentication Required</h2>
        </div>

        {/* Alert Message */}
        {suspiciousActivity && (
          <div className="reauth-alert">
            <div className="alert-type">
              {suspiciousActivity.type.replace(/_/g, ' ').toUpperCase()}
            </div>
            <p className="alert-message">
              {suspiciousActivity.message}
            </p>
            {suspiciousActivity.details && (
              <div className="alert-details">
                <small>
                  {Object.entries(suspiciousActivity.details).map(([key, value]) => (
                    <div key={key}>
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: <strong>{value}</strong>
                    </div>
                  ))}
                </small>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        <div className="reauth-explanation">
          <p>
            We detected unusual activity on your account. To protect your security, please
            verify your identity by entering your password.
          </p>
          <p className="security-note">
            ℹ️ <strong>Security Notice:</strong> After re-authentication, all other active sessions
            will be invalidated and you'll get a new secure token.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="reauth-form">
          <div className="form-group">
            <label htmlFor="reauth-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="reauth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                disabled={isLoading}
                className={error ? 'input-error' : ''}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={handleTogglePassword}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>

          {/* Actions */}
          <div className="reauth-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Identity'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="reauth-footer">
          <p className="footer-text">
            💡 For demo purposes, use password: <code>SecurePass123!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
