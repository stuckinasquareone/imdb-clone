/**
 * Complete Integration Example
 * Shows how to use watch progress sync throughout an app
 */

import React, { useState, useEffect } from 'react';
import MovieWatchProgress from './MovieWatchProgress';
import { useWatchProgressSync, useMultipleWatchProgressSync } from '../hooks/useWatchProgressSync';
import watchProgressSyncService from '../services/watchProgressSyncService';

/**
 * Example 1: Single Movie Watch Progress
 */
export const MoviePlayerExample = ({ movieId, movieTitle }) => {
  const {
    progress,
    syncStatus,
    isOnline,
    updateProgress,
    triggerSync,
    recoverState
  } = useWatchProgressSync(movieId);

  const handleVideoTimeUpdate = (currentTime, duration) => {
    const progressPercent = (currentTime / duration) * 100;
    updateProgress(progressPercent, {
      duration,
      lastPosition: currentTime,
      quality: 'auto'
    });
  };

  const handleVideoError = () => {
    if (!isOnline) {
      console.log('Video error - offline mode, local changes preserved');
    } else {
      recoverState();
    }
  };

  return (
    <div className="movie-player-container">
      <video
        onTimeUpdate={(e) => {
          const video = e.target;
          handleVideoTimeUpdate(video.currentTime, video.duration);
        }}
        onError={handleVideoError}
        onPlay={() => triggerSync()}
        controlsList="nodownload"
      >
        <source src={movieId} type="video/mp4" />
      </video>

      <MovieWatchProgress
        movieId={movieId}
        movieTitle={movieTitle}
        totalDuration={120}
      />

      <div className="sync-status-bar">
        <span className="status-indicator">{syncStatus}</span>
        {!isOnline && <span className="offline-badge">OFFLINE</span>}
      </div>
    </div>
  );
};

/**
 * Example 2: Movie List with Sync
 */
export const MovieListWithSync = ({ movies }) => {
  const movieIds = movies.map(m => m.id);
  const { progressMap, globalSyncStatus, updateMultipleProgress } = useMultipleWatchProgressSync(movieIds);

  return (
    <div className="movie-list">
      <div className="list-header">
        <h2>My Movies</h2>
        <div className="global-sync-status">
          Sync: <span className={`status ${globalSyncStatus}`}>{globalSyncStatus}</span>
        </div>
      </div>

      <div className="movies-grid">
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
            progress={progressMap[movie.id]?.progress}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Example 3: Cross-Device Sync Monitor
 */
export const CrossDeviceSyncMonitor = () => {
  const [syncHistory, setSyncHistory] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const handleSyncEvent = (event) => {
      setSyncHistory(prev => {
        const updated = [{
          timestamp: new Date(),
          type: event.type,
          movieId: event.movieId,
          status: event.syncStatus
        }, ...prev];
        return updated.slice(0, 50); // Keep last 50 events
      });
    };

    const unsubscribe = watchProgressSyncService.addListener(handleSyncEvent);
    return unsubscribe;
  }, []);

  return (
    <div className="sync-monitor">
      <h3>Sync Activity Monitor</h3>

      <div className="sync-history">
        {syncHistory.length === 0 ? (
          <p className="empty-state">No sync activity yet</p>
        ) : (
          <ul className="history-list">
            {syncHistory.map((event, idx) => (
              <li key={idx} className={`history-item ${event.status}`}>
                <span className="time">{event.timestamp.toLocaleTimeString()}</span>
                <span className="type">{event.type}</span>
                {event.movieId && <span className="movie-id">Movie: {event.movieId}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/**
 * Example 4: Conflict Resolution UI
 */
export const ConflictResolutionDialog = ({ movieId, onResolved }) => {
  const { resolveConflictManually } = useWatchProgressSync(movieId);
  const [selectedStrategy, setSelectedStrategy] = useState('latest');

  const strategies = [
    { value: 'latest', label: 'Use Most Recent Update' },
    { value: 'local', label: 'Keep Local Changes' },
    { value: 'remote', label: 'Accept Server Changes' },
    { value: 'merge', label: 'Merge Both Versions' }
  ];

  const handleResolve = () => {
    const resolution = resolveConflictManually(selectedStrategy);
    onResolved(resolution);
  };

  return (
    <div className="conflict-dialog">
      <h3>Resolve Sync Conflict</h3>
      <p>A conflict was detected in watch progress synchronization.</p>

      <div className="strategy-options">
        {strategies.map(strategy => (
          <label key={strategy.value} className="strategy-option">
            <input
              type="radio"
              name="strategy"
              value={strategy.value}
              checked={selectedStrategy === strategy.value}
              onChange={(e) => setSelectedStrategy(e.target.value)}
            />
            <span>{strategy.label}</span>
          </label>
        ))}
      </div>

      <div className="dialog-actions">
        <button onClick={handleResolve} className="resolve-btn">
          Resolve Conflict
        </button>
      </div>
    </div>
  );
};

/**
 * Example 5: Offline Mode Indicator
 */
export const OfflineModeIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleSyncEvent = (event) => {
      if (event.type === 'progress_updated' && !event.synced) {
        setPendingChanges(prev => prev + 1);
      }
      if (event.type === 'sync_completed') {
        setPendingChanges(0);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = watchProgressSyncService.addListener(handleSyncEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="offline-indicator">
        <span className="indicator-icon">⚠️</span>
        <span className="indicator-text">
          Offline Mode
          {pendingChanges > 0 && ` (${pendingChanges} pending)`}
        </span>
      </div>
    );
  }

  return null;
};

/**
 * Example 6: Initialize Sync on App Mount
 */
export const useSyncInitializer = () => {
  useEffect(() => {
    // Initialize watch progress sync service
    console.log('Watch progress sync initialized');
    console.log('Device ID:', watchProgressSyncService.deviceId);

    // Restore pending syncs if needed
    const queue = watchProgressSyncService.getSyncQueue();
    if (queue.length > 0) {
      console.log(`${queue.length} pending syncs detected`);
      watchProgressSyncService.processSyncQueue();
    }

    // Check consistency
    const status = watchProgressSyncService.getConsistencyStatus();
    console.log('Sync health:', status);

    return () => {
      // Cleanup on unmount
      watchProgressSyncService.destroy();
    };
  }, []);
};

/**
 * Example 7: Movie Card Component with Progress
 */
const MovieCard = ({ movie, progress }) => {
  return (
    <div className="movie-card">
      <img src={movie.poster} alt={movie.title} className="movie-poster" />
      <div className="movie-info">
        <h4>{movie.title}</h4>
        {progress !== undefined && (
          <div className="progress-indicator">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">{progress.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example 8: App Component with Everything Integrated
 */
export const AppWithWatchProgressSync = () => {
  useSyncInitializer();

  const [currentMovie, setCurrentMovie] = useState(null);
  const movies = [
    { id: 'movie1', title: 'Movie 1', poster: '/poster1.jpg' },
    { id: 'movie2', title: 'Movie 2', poster: '/poster2.jpg' },
    { id: 'movie3', title: 'Movie 3', poster: '/poster3.jpg' }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>IMDB Clone</h1>
        <OfflineModeIndicator />
      </header>

      <main className="app-main">
        {currentMovie ? (
          <MoviePlayerExample
            movieId={currentMovie.id}
            movieTitle={currentMovie.title}
          />
        ) : (
          <MovieListWithSync movies={movies} />
        )}
      </main>

      <aside className="app-sidebar">
        <CrossDeviceSyncMonitor />
      </aside>
    </div>
  );
};

export default AppWithWatchProgressSync;
