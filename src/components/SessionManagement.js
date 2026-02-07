/**
 * SessionManagement Component
 * Displays active sessions, token rotation status, and security information.
 * Allows users to view and manage their security state.
 */

import React, { useCallback } from 'react';
import './SessionManagement.css';

export default function SessionManagement({
  isAuthenticated,
  currentToken,
  sessionHistory,
  rotationStatus,
  lastRotationTime,
  onManualRotate,
  onLogout
}) {
  const handleRotate = useCallback(() => {
    onManualRotate();
  }, [onManualRotate]);

  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to logout? All sessions will be invalidated.')) {
      onLogout();
    }
  }, [onLogout]);

  const activeSessions = sessionHistory.filter(s => s.status === 'active');
  const invalidatedSessions = sessionHistory.filter(
    s => s.status === 'invalidated' || s.status === 'logged_out'
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getRotationStatusColor = (status) => {
    switch (status) {
      case 'idle':
        return 'neutral';
      case 'rotating':
        return 'loading';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'suspicious_activity_detected':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getRotationStatusLabel = (status) => {
    const labels = {
      idle: 'Ready',
      rotating: 'Rotating...',
      success: 'Rotation Successful',
      error: 'Rotation Failed',
      suspicious_activity_detected: 'Suspicious Activity Detected',
      reauth_in_progress: 'Re-authenticating...',
      reauth_success: 'Re-authentication Successful',
      reauth_failed: 'Re-authentication Failed'
    };
    return labels[status] || status;
  };

  return (
    <div className="session-management">
      {/* Authentication Status */}
      <section className="sm-section auth-status">
        <h3 className="sm-title">🔐 Authentication Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Status</span>
            <span className={`status-badge ${isAuthenticated ? 'authenticated' : 'not-authenticated'}`}>
              {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Current Token</span>
            <span className="status-value">
              {currentToken ? (
                <code className="token-preview">
                  {currentToken.token.substring(0, 16)}...
                </code>
              ) : (
                'None'
              )}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Token Expiry</span>
            <span className="status-value">
              {currentToken ? formatTime(currentToken.expiresAt) : 'N/A'}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Device ID</span>
            <span className="status-value">
              <code className="device-id">
                {currentToken?.deviceId?.substring(0, 20) || 'N/A'}...
              </code>
            </span>
          </div>
        </div>
      </section>

      {/* Token Rotation */}
      <section className="sm-section token-rotation">
        <h3 className="sm-title">🔄 Token Rotation</h3>

        <div className="rotation-status">
          <div className={`status-indicator ${getRotationStatusColor(rotationStatus)}`}>
            {rotationStatus === 'rotating' && <span className="spinner"></span>}
            {rotationStatus === 'success' && '✅'}
            {rotationStatus === 'error' && '❌'}
            {rotationStatus === 'suspicious_activity_detected' && '🚨'}
            {rotationStatus === 'idle' && '✓'}
          </div>
          <div className="rotation-info">
            <p className="rotation-status-text">
              {getRotationStatusLabel(rotationStatus)}
            </p>
            {lastRotationTime && (
              <p className="rotation-time">
                Last rotation: {formatTime(lastRotationTime)}
              </p>
            )}
          </div>
        </div>

        <div className="rotation-controls">
          <button
            className="btn btn-secondary"
            onClick={handleRotate}
            disabled={rotationStatus === 'rotating' || !isAuthenticated}
            title="Manually rotate your refresh token"
          >
            🔄 Rotate Token Now
          </button>
        </div>

        <div className="rotation-info-box">
          <p className="info-text">
            ℹ️ Tokens are automatically rotated every hour. You can also manually rotate
            at any time for enhanced security.
          </p>
        </div>
      </section>

      {/* Active Sessions */}
      <section className="sm-section active-sessions">
        <h3 className="sm-title">
          🟢 Active Sessions ({activeSessions.length})
        </h3>

        {activeSessions.length === 0 ? (
          <p className="empty-state">No active sessions</p>
        ) : (
          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.sessionId} className="session-card active">
                <div className="session-header">
                  <div className="session-id">
                    <strong>Session ID:</strong>
                    <code>{session.sessionId}</code>
                  </div>
                  <span className="session-badge active-badge">Active</span>
                </div>

                <div className="session-details">
                  <div className="detail-row">
                    <span className="detail-label">Device:</span>
                    <span className="detail-value">{session.deviceId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Started:</span>
                    <span className="detail-value">
                      {formatTime(session.issuedAt)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">
                      {formatTime(session.expiresAt)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">
                      {formatDuration(Date.now() - session.issuedAt)}
                    </span>
                  </div>
                  {session.userAgent && (
                    <div className="detail-row">
                      <span className="detail-label">User Agent:</span>
                      <span className="detail-value user-agent">
                        {session.userAgent}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invalidated Sessions */}
      {invalidatedSessions.length > 0 && (
        <section className="sm-section invalidated-sessions">
          <h3 className="sm-title">
            🔴 Invalidated Sessions ({invalidatedSessions.length})
          </h3>

          <div className="sessions-list">
            {invalidatedSessions.slice(-5).map((session) => (
              <div key={session.sessionId} className="session-card invalidated">
                <div className="session-header">
                  <div className="session-id">
                    <strong>Session ID:</strong>
                    <code>{session.sessionId}</code>
                  </div>
                  <span className="session-badge invalidated-badge">
                    {session.invalidationReason === 'suspicious_activity_detected'
                      ? 'Suspicious Activity'
                      : session.status === 'logged_out'
                      ? 'Logged Out'
                      : 'Invalidated'}
                  </span>
                </div>

                <div className="session-details">
                  <div className="detail-row">
                    <span className="detail-label">Invalidated:</span>
                    <span className="detail-value">
                      {formatTime(session.invalidatedAt)}
                    </span>
                  </div>
                  {session.invalidationReason && (
                    <div className="detail-row">
                      <span className="detail-label">Reason:</span>
                      <span className="detail-value">
                        {session.invalidationReason.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {invalidatedSessions.length > 5 && (
            <p className="sessions-count">
              +{invalidatedSessions.length - 5} more invalidated sessions
            </p>
          )}
        </section>
      )}

      {/* Logout */}
      <section className="sm-section logout-section">
        <button
          className="btn btn-danger"
          onClick={handleLogout}
          disabled={!isAuthenticated}
        >
          🚪 Logout & Invalidate All Sessions
        </button>
      </section>
    </div>
  );
}
