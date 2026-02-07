/**
 * MovieSimilarity Component
 * Displays detailed similarity metrics between two movies with visualizations.
 * Helps users understand why recommendations appear and discover movie connections.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { calculateMovieSimilarity } from '../services/movieSimilarityService';
import './MovieSimilarity.css';

// Reusable similarity score visualization component
function SimilarityScore({ score, label, size = 'medium' }) {
  const getColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#ef4444'; // red
    return '#9ca3af'; // gray
  };

  const radius = size === 'large' ? 45 : size === 'medium' ? 35 : 25;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`similarity-score similarity-score-${size}`}>
      <div className="score-circle">
        <svg width={radius * 2 + 10} height={radius * 2 + 10} viewBox={`0 0 ${radius * 2 + 10} ${radius * 2 + 10}`}>
          {/* Background circle */}
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx={radius + 5}
            cy={radius + 5}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="score-value">{score}%</div>
      </div>
      {label && <div className="score-label">{label}</div>}
    </div>
  );
}

// Genre overlap visualization
function GenreOverlap({ genres }) {
  return (
    <div className="metric-card">
      <h3 className="metric-title">🏷️ Genre Overlap</h3>
      <div className="metric-content">
        <SimilarityScore score={genres.score} label={`${genres.score}% Match`} size="medium" />

        <div className="overlap-stats">
          <div className="stat">
            <span className="stat-label">Matching Genres:</span>
            <span className="stat-value">{genres.totalMatches}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Movie 1 Genres:</span>
            <span className="stat-value">{genres.totalGenresMovie1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Movie 2 Genres:</span>
            <span className="stat-value">{genres.totalGenresMovie2}</span>
          </div>
        </div>

        {genres.matches.length > 0 && (
          <div className="matches-section">
            <h4 className="matches-title">Shared Genres</h4>
            <div className="tag-list">
              {genres.matches.map((genre, idx) => (
                <span key={idx} className="tag tag-match">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {genres.onlyInMovie1.length > 0 && (
          <div className="only-section">
            <h4 className="only-title">Only in Movie 1</h4>
            <div className="tag-list">
              {genres.onlyInMovie1.map((genre, idx) => (
                <span key={idx} className="tag tag-only">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}

        {genres.onlyInMovie2.length > 0 && (
          <div className="only-section">
            <h4 className="only-title">Only in Movie 2</h4>
            <div className="tag-list">
              {genres.onlyInMovie2.map((genre, idx) => (
                <span key={idx} className="tag tag-only">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Director match visualization
function DirectorMatch({ director }) {
  return (
    <div className="metric-card">
      <h3 className="metric-title">🎬 Director Connection</h3>
      <div className="metric-content">
        <SimilarityScore score={director.score} label={`${director.score}% Match`} size="medium" />

        {director.hasMatch ? (
          <div className="director-match">
            <div className="match-icon">✓</div>
            <p className="match-text">
              Both films directed by <strong>{director.matches.map(m => m.name).join(' and ')}</strong>
            </p>
          </div>
        ) : (
          <div className="no-match">
            <p className="no-match-text">Different directors</p>
            {director.onlyInMovie1.length > 0 && (
              <p className="director-info">Movie 1: {director.onlyInMovie1.join(', ')}</p>
            )}
            {director.onlyInMovie2.length > 0 && (
              <p className="director-info">Movie 2: {director.onlyInMovie2.join(', ')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Cast overlap visualization
function CastOverlap({ cast }) {
  return (
    <div className="metric-card">
      <h3 className="metric-title">👥 Cast Overlap</h3>
      <div className="metric-content">
        <SimilarityScore score={cast.score} label={`${cast.score}% Match`} size="medium" />

        <div className="cast-stats">
          <div className="stat">
            <span className="stat-label">Shared Actors:</span>
            <span className="stat-value">{cast.matchCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Movie 1 Cast:</span>
            <span className="stat-value">{cast.totalCastMovie1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Movie 2 Cast:</span>
            <span className="stat-value">{cast.totalCastMovie2}</span>
          </div>
        </div>

        {cast.matches.length > 0 && (
          <div className="matches-section">
            <h4 className="matches-title">Shared Cast Members</h4>
            <div className="cast-list">
              {cast.matches.map((actor, idx) => (
                <div key={idx} className="cast-item">
                  <span className="cast-icon">🎭</span>
                  <span className="cast-name">{actor}</span>
                </div>
              ))}
              {cast.matchCount > cast.matches.length && (
                <div className="more-items">
                  +{cast.matchCount - cast.matches.length} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Popularity correlation visualization
function PopularityCorrelation({ popularity }) {
  const getRatingClass = (diff) => {
    if (diff < 1) return 'very-similar';
    if (diff < 2) return 'similar';
    if (diff < 3) return 'somewhat-different';
    return 'very-different';
  };

  return (
    <div className="metric-card">
      <h3 className="metric-title">📊 Popularity & Appeal</h3>
      <div className="metric-content">
        <SimilarityScore score={popularity.score} label={`${popularity.score}% Correlation`} size="medium" />

        <div className="popularity-breakdown">
          <div className="comparison-row">
            <span className="comparison-label">Rating</span>
            <div className="comparison-values">
              <span className="movie-rating">{popularity.movie1Rating.toFixed(1)}</span>
              <span className="comparison-badge">
                {popularity.ratingDifference === 0 ? '🟢 Perfect Match' : `${popularity.ratingDifference.toFixed(1)}⭐ Diff`}
              </span>
              <span className="movie-rating">{popularity.movie2Rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="comparison-row">
            <span className="comparison-label">Popularity</span>
            <div className="comparison-values">
              <span className="popularity-index">{popularity.movie1Popularity.toFixed(0)}</span>
              <span className="comparison-badge">Audience Appeal</span>
              <span className="popularity-index">{popularity.movie2Popularity.toFixed(0)}</span>
            </div>
          </div>

          <div className="comparison-row">
            <span className="comparison-label">Release Era</span>
            <div className="comparison-values">
              <span className="year-diff">
                {popularity.yearDifference === 0 ? '🟢 Same Year' : `${popularity.yearDifference} years apart`}
              </span>
            </div>
          </div>
        </div>

        <p className="popularity-insight">
          💡 Movies with similar ratings and popularity indices tend to appeal to the same audiences and demographics.
        </p>
      </div>
    </div>
  );
}

// Main MovieSimilarity component
export default function MovieSimilarity({ movie1, movie2, onClose }) {
  const [expanded, setExpanded] = useState(false);

  const similarity = useMemo(() => {
    if (!movie1 || !movie2) return null;
    try {
      return calculateMovieSimilarity(movie1, movie2);
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return null;
    }
  }, [movie1, movie2]);

  const getSimilarityColor = useCallback((score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#ef4444';
    return '#9ca3af';
  }, []);

  const getSimilarityLabel = useCallback((level) => {
    const labels = {
      highly_similar: 'Highly Similar',
      similar: 'Similar',
      somewhat_similar: 'Somewhat Similar',
      slightly_similar: 'Slightly Similar',
      very_different: 'Very Different'
    };
    return labels[level] || 'Unknown';
  }, []);

  if (!similarity) {
    return (
      <div className="movie-similarity error">
        <p>Unable to calculate similarity</p>
      </div>
    );
  }

  return (
    <div className={`movie-similarity ${expanded ? 'expanded' : 'compact'}`}>
      {/* Header */}
      <div className="similarity-header">
        <div className="header-left">
          <h2 className="similarity-title">🔍 Movie Similarity Analysis</h2>
          <p className="similarity-subtitle">
            {movie1.title} ↔️ {movie2.title}
          </p>
        </div>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close similarity panel"
        >
          ✕
        </button>
      </div>

      {/* Overall Similarity */}
      <div className="overall-similarity">
        <div className="overall-score">
          <SimilarityScore
            score={similarity.overallSimilarity}
            label={getSimilarityLabel(similarity.similarityLevel)}
            size="large"
          />
        </div>

        <div className="similarity-info">
          <p className="similarity-explanation">
            {similarity.explanation}
          </p>
          <div className="recommendation-badge">
            <span className={`recommendation-strength strength-${similarity.recommendationStrength}`}>
              {similarity.recommendationStrength.toUpperCase().replace(/_/g, ' ')} Recommendation
            </span>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        className="expand-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▼ Hide Details' : '▶ Show Detailed Breakdown'}
      </button>

      {/* Detailed Metrics */}
      {expanded && (
        <div className="detailed-metrics">
          <h3 className="metrics-section-title">Similarity Breakdown</h3>
          <div className="metrics-grid">
            <GenreOverlap genres={similarity.genres} />
            <DirectorMatch director={similarity.director} />
            <CastOverlap cast={similarity.cast} />
            <PopularityCorrelation popularity={similarity.popularity} />
          </div>

          {/* Summary */}
          <div className="similarity-summary">
            <h3 className="summary-title">📈 Why This Recommendation?</h3>
            <div className="summary-content">
              {similarity.genres.totalMatches > 0 && (
                <div className="summary-point">
                  <span className="point-icon">✓</span>
                  <span className="point-text">
                    Share {similarity.genres.matches.length} genre{similarity.genres.matches.length !== 1 ? 's' : ''}: 
                    <strong>{similarity.genres.matches.join(', ')}</strong>
                  </span>
                </div>
              )}
              {similarity.director.hasMatch && (
                <div className="summary-point">
                  <span className="point-icon">✓</span>
                  <span className="point-text">
                    Both directed by <strong>{similarity.director.matches.map(m => m.name).join(', ')}</strong>
                  </span>
                </div>
              )}
              {similarity.cast.matchCount > 0 && (
                <div className="summary-point">
                  <span className="point-icon">✓</span>
                  <span className="point-text">
                    {similarity.cast.matchCount} shared cast member{similarity.cast.matchCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {similarity.popularity.score >= 60 && (
                <div className="summary-point">
                  <span className="point-icon">✓</span>
                  <span className="point-text">
                    Appeal to similar audiences and demographics
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
