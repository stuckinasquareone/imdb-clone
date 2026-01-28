import './App.css';
import MovieWatchProgress from './components/MovieWatchProgress';
import { useSyncHealthMonitor } from './hooks/useWatchProgressSync';
import watchProgressSyncService from './services/watchProgressSyncService';
import { useEffect, useState } from 'react';

function App() {
  const health = useSyncHealthMonitor();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [movieId, setMovieId] = useState('movie_shawshank');

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize sync on mount
  useEffect(() => {
    console.log('✅ Watch Progress Sync System Initialized');
    console.log('Device ID:', watchProgressSyncService.deviceId);
    return () => {
      watchProgressSyncService.destroy();
    };
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎬 IMDB Clone - Watch Progress Sync</h1>
        <div className="header-status">
          <span className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {health && (
            <span className="health-info">
              • {health.localItemsCount} movies • {health.pendingSyncCount} pending
            </span>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="demo-section">
          <h2>Watch Progress Synchronization Demo</h2>
          <p>
            Update your watch progress below. Changes sync automatically across all your devices!
          </p>

          <div className="movie-selector">
            <label htmlFor="movie-select">Select a movie:</label>
            <select
              id="movie-select"
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
            >
              <option value="movie_shawshank">The Shawshank Redemption</option>
              <option value="movie_godfather">The Godfather</option>
              <option value="movie_inception">Inception</option>
              <option value="movie_dark_knight">The Dark Knight</option>
              <option value="movie_pulp_fiction">Pulp Fiction</option>
            </select>
          </div>

          <MovieWatchProgress
            movieId={movieId}
            movieTitle={
              {
                movie_shawshank: 'The Shawshank Redemption',
                movie_godfather: 'The Godfather',
                movie_inception: 'Inception',
                movie_dark_knight: 'The Dark Knight',
                movie_pulp_fiction: 'Pulp Fiction'
              }[movieId]
            }
            totalDuration={142}
          />
        </section>

        <section className="info-section">
          <h3>How It Works</h3>
          <ul className="features-list">
            <li>✅ <strong>Auto-Sync:</strong> Watch progress syncs every 30 seconds</li>
            <li>✅ <strong>Offline Support:</strong> Continue watching offline, sync when back online</li>
            <li>✅ <strong>Conflict Resolution:</strong> Automatically handles conflicts between devices</li>
            <li>✅ <strong>Cross-Device:</strong> Updates appear on all your devices</li>
            <li>✅ <strong>State Recovery:</strong> Never lose your progress</li>
          </ul>
        </section>

        <section className="debug-section">
          <h3>Debug Information</h3>
          <div className="debug-info">
            {health && (
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Total Movies:</span>
                  <span className="value">{health.localItemsCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Pending Sync:</span>
                  <span className="value">{health.pendingSyncCount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Conflicts:</span>
                  <span className="value">{health.conflictCount || 0}</span>
                </div>
                <div className="info-item">
                  <span className="label">Online:</span>
                  <span className="value">{isOnline ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
            <div className="device-id">
              Device ID: <code>{watchProgressSyncService.deviceId}</code>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          🚀 <strong>Watch Progress Sync System</strong> - Cross-device synchronization with offline support
        </p>
        <p>
          Check the console for detailed logs. Try going offline to test offline mode!
        </p>
      </footer>
    </div>
  );
}

export default App;
