import './App.css';
import MovieWatchProgress from './components/MovieWatchProgress';
import URLValidator from './components/URLValidator';
import ReAuthenticationModal from './components/ReAuthenticationModal';
import SessionManagement from './components/SessionManagement';
import ValidationAlert from './components/ValidationAlert';
import ContractMonitor from './components/ContractMonitor';
import MovieCard, { MovieCardGrid } from './components/MovieCard';
import { useSyncHealthMonitor } from './hooks/useWatchProgressSync';
import useTokenRotation from './hooks/useTokenRotation';
import watchProgressSyncService from './services/watchProgressSyncService';
import apiContractValidator from './services/apiSchemaValidator';
import { AllSchemas } from './config/apiSchemas';
import { sampleMovies, getRandomMovies, getTopRatedMovies } from './data/sampleMovies';
import { useEffect, useState } from 'react';

function App() {
  const health = useSyncHealthMonitor();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [movieId, setMovieId] = useState('movie_shawshank');
  const [validationError, setValidationError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [randomMovies] = useState(() => getRandomMovies(6));
  const [topRatedMovies] = useState(() => getTopRatedMovies(5));
  
  // Token rotation hook
  const {
    isAuthenticated,
    currentToken,
    sessionHistory,
    suspiciousActivity,
    isReAuthRequired,
    rotationStatus,
    lastRotationTime,
    manualRotate,
    handleReAuthentication,
    dismissAlert,
    logout
  } = useTokenRotation();

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
    
    // Register API schemas for validation
    apiContractValidator.registerSchemas(AllSchemas);
    
    // Listen for validation errors
    const unsubscribe = apiContractValidator.onValidationError((result) => {
      setValidationError(result);
      console.warn('API Contract Validation Error:', result);
    });
    
    return () => {
      watchProgressSyncService.destroy();
      unsubscribe();
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

        <section className="validator-section">
          <h3>URL Validator</h3>
          <URLValidator />
        </section>

        <section className="security-section">
          <h3>🔒 Token Rotation & Session Security</h3>
          <SessionManagement
            isAuthenticated={isAuthenticated}
            currentToken={currentToken}
            sessionHistory={sessionHistory}
            rotationStatus={rotationStatus}
            lastRotationTime={lastRotationTime}
            onManualRotate={manualRotate}
            onLogout={logout}
          />
        </section>

        <section className="contract-section">
          <h3>📋 API Contract Validation</h3>
          <ContractMonitor />
        </section>

        <section className="movies-section">
          <h3>🎬 Movie Catalog</h3>
          <MovieCardGrid
            movies={randomMovies}
            title="Featured Movies"
            onMovieClick={setSelectedMovie}
            showGenre={true}
            columns={6}
          />
        </section>

        <section className="movies-section">
          <MovieCardGrid
            movies={topRatedMovies}
            title="Top Rated"
            onMovieClick={setSelectedMovie}
            showDirector={true}
            showSynopsis={true}
            columns={5}
          />
        </section>

        {selectedMovie && (
          <section className="movie-details-section">
            <button
              className="close-details-btn"
              onClick={() => setSelectedMovie(null)}
              aria-label="Close movie details"
            >
              ✕
            </button>
            <div className="movie-details">
              <div className="details-poster">
                <img
                  src={selectedMovie.poster}
                  alt={`${selectedMovie.title} poster`}
                />
              </div>
              <div className="details-content">
                <h2>{selectedMovie.title}</h2>
                <div className="details-meta">
                  <span className="year">{selectedMovie.releaseYear}</span>
                  <span className="separator">•</span>
                  <span className="runtime">{selectedMovie.runtime} min</span>
                  <span className="separator">•</span>
                  <span className="rating">⭐ {selectedMovie.rating}/10</span>
                </div>
                <div className="details-genres">
                  {selectedMovie.genre.map((g, idx) => (
                    <span key={idx} className="genre-badge">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="details-director">
                  <strong>Director:</strong> {selectedMovie.director}
                </div>
                <div className="details-votes">
                  <strong>Votes:</strong> {selectedMovie.votes.toLocaleString()}
                </div>
                <p className="details-synopsis">{selectedMovie.synopsis}</p>
                <div className="details-actions">
                  <button className="details-btn primary">▶️ Watch Now</button>
                  <button className="details-btn secondary">➕ Add to Watchlist</button>
                  <button className="details-btn secondary">⭐ Rate</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Re-authentication Modal */}
      <ReAuthenticationModal
        isOpen={isReAuthRequired}
        suspiciousActivity={suspiciousActivity}
        onReAuthenticate={handleReAuthentication}
        isLoading={rotationStatus === 'reauth_in_progress'}
      />

      {/* Validation Error Alert */}
      {validationError && (
        <ValidationAlert
          error={validationError}
          onDismiss={() => setValidationError(null)}
          autoClose={true}
        />
      )}

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
