/**
 * Example: Component with Performance Tracking
 * 
 * This shows how to use the telemetry system in your components
 */

import React, { useState } from 'react';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import telemetryService from '../services/telemetryService';

function MovieSearchExample() {
  const { recordEvent, recordRender } = usePerformanceTracking('MovieSearch');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Track search event
    recordEvent('search_submitted', {
      queryLength: searchQuery.length,
      query: searchQuery // Be careful not to log sensitive data in production
    });

    setIsSearching(true);

    try {
      // Measure API call performance
      const startTime = Date.now();
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const duration = Date.now() - startTime;

      // Record resource timing
      if (response.ok) {
        telemetryService.recordResourceTiming('search_api', duration, 'success');
        const data = await response.json();
        setResults(data);
        
        // Track successful search
        recordEvent('search_success', {
          resultsCount: data.length,
          duration
        });
      } else {
        telemetryService.recordResourceTiming('search_api', duration, 'error');
        recordEvent('search_failed', { statusCode: response.status });
      }
    } catch (error) {
      // Record errors for debugging
      recordEvent('search_error', { 
        error: error.message 
      });
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
      recordRender({ resultsVisible: results.length > 0 });
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSearching}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="results">
        {results.map(movie => (
          <div
            key={movie.id}
            className="movie-card"
            onClick={() => {
              // Track movie interaction
              recordEvent('movie_clicked', {
                movieId: movie.id,
                movieTitle: movie.title,
                position: results.indexOf(movie)
              });
            }}
          >
            <h3>{movie.title}</h3>
            <p>{movie.year}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieSearchExample;
