/**
 * Movie Watch Progress Component
 * Demonstrates watch progress synchronization across devices
 * Integrates age verification for adult content
 */

import React, { useState, useCallback } from 'react';
import { useWatchProgressSync, useSyncHealthMonitor } from '../hooks/useWatchProgressSync';
import useAgeVerification from '../hooks/useAgeVerification';
import AgeGatedContent from './AgeGatedContent';
import { isAdultContent } from '../services/moviesDatabase';
import './MovieWatchProgress.css';

const MovieWatchProgress = ({ movieId, movieTitle, totalDuration = 120 }) => {
  const {
    progress,
    syncStatus,
    lastSyncTime,
    isSyncing,
    isOnline,
    conflictDetected,
    updateProgress,
    triggerSync,
    recoverState,
    getSyncQueueStatus,
    resolveConflictManually,
    isSyncNeeded
  } = useWatchProgressSync(movieId);

  const { isVerified, verifyAge } = useAgeVerification();
  const requiresAgeGate = isAdultContent(movieId);

  const health = useSyncHealthMonitor();

  const [manualProgress, setManualProgress] = useState(progress || 0);
  const [showDetails, setShowDetails] = useState(false);

  const handleProgressChange = useCallback((e) => {
    const newProgress = parseFloat(e.target.value);
    setManualProgress(newProgress);
    updateProgress(newProgress, {
      duration: totalDuration,
      lastPosition: (newProgress / 100) * totalDuration,
      quality: 'auto'
    });
  }, [updateProgress, totalDuration]);

  const handleManualSync = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  const handleRecover = useCallback(() => {
    recoverState();
  }, [recoverState]);

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const queueStatus = getSyncQueueStatus();

  const getStatusIcon = () => {
    if (!isOnline) return '⚠️';
    if (syncStatus === 'syncing') return '🔄';
    if (syncStatus === 'synced') return '✓';
    if (syncStatus === 'pending') return '⏳';
    if (syncStatus === 'failed') return '❌';
    return '○';
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ff9800';
    if (syncStatus === 'synced') return '#4caf50';
    if (syncStatus === 'pending') return '#2196f3';
    if (syncStatus === 'failed') return '#f44336';
    return '#999';
  };

  return (
    <AgeGatedContent
      isVerified={!requiresAgeGate || isVerified}
      onVerify={verifyAge}
      title={movieTitle}
      description="This movie contains adult content and is restricted to viewers 18 years or older."
    >
      <div className="movie-watch-progress">
      <div className="progress-header">
        <div className="progress-title-section">
          <h3>{movieTitle}</h3>
          <div className="sync-status" style={{ color: getStatusColor() }}>
            <span className="status-icon">{getStatusIcon()}</span>
            <span className="status-text">
              {!isOnline ? 'Offline' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced' : syncStatus === 'pending' ? 'Pending sync' : 'Sync failed'}
            </span>
          </div>
        </div>

        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Toggle details"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      <div className="progress-container">
        <div className="progress-info">
          <span className="progress-value">
            {manualProgress.toFixed(1)}%
          </span>
          <span className="progress-time">
            {formatTime((manualProgress / 100) * totalDuration)} / {formatTime(totalDuration)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={manualProgress}
          onChange={handleProgressChange}
          className="progress-slider"
          aria-label={`Watch progress for ${movieTitle}`}
        />

        {isSyncNeeded && (
          <div className="sync-indicator">
            <span className="indicator-dot"></span>
            Local changes pending sync
          </div>
        )}
      </div>

      {conflictDetected && (
        <div className="conflict-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Conflict detected. Review and resolve.</span>
          <button onClick={() => resolveConflictManually()} className="resolve-btn">
            Resolve
          </button>
        </div>
      )}

      <div className="progress-actions">
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing || syncStatus === 'synced'}
          className="action-btn sync-btn"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>

        <button
          onClick={handleRecover}
          disabled={isOnline && syncStatus === 'synced'}
          className="action-btn recover-btn"
        >
          Recover
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="action-btn details-btn"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {showDetails && (
        <div className="progress-details">
          <div className="details-section">
            <h4>Sync Status</h4>
            <div className="detail-row">
              <span className="label">Last Sync:</span>
              <span className="value">{formatLastSync()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Online:</span>
              <span className="value">{isOnline ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Current Status:</span>
              <span className="value" style={{ color: getStatusColor() }}>
                {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
              </span>
            </div>
          </div>

          <div className="details-section">
            <h4>Pending Updates</h4>
            <div className="detail-row">
              <span className="label">In Queue:</span>
              <span className="value">{queueStatus.inQueue ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Queue Size:</span>
              <span className="value">{queueStatus.queueSize}</span>
            </div>
            <div className="detail-row">
              <span className="label">Sync Attempts:</span>
              <span className="value">{queueStatus.attempts}</span>
            </div>
          </div>

          {health && (
            <div className="details-section">
              <h4>Overall Sync Health</h4>
              <div className="detail-row">
                <span className="label">Total Items:</span>
                <span className="value">{health.localItemsCount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Pending Sync:</span>
                <span className="value">{health.pendingSyncCount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Conflicts:</span>
                <span className="value">{health.conflictCount || 0}</span>
              </div>
            </div>
          )}

          <div className="details-section">
            <h4>Device Info</h4>
            <div className="detail-row">
              <span className="label">Device ID:</span>
              <span className="value device-id">{health?.deviceId}</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </AgeGatedContent>
  );
};

export default MovieWatchProgress;
