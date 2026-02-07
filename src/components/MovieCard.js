/**
 * MovieCard Component
 * Displays movie information in a card format with poster, title, year, and rating
 * Reusable component with optional onclick handler and hover effects
 */

import React, { useState, useCallback } from 'react';
import './MovieCard.css';

export function MovieCard({
  movie,
  onClick,
  showGenre = false,
  showDirector = false,
  showSynopsis = false,
  compact = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(movie);
  }, [movie, onClick]);

  const getRatingColor = (rating) => {
    if (rating >= 8.5) return 'excellent';
    if (rating >= 7.5) return 'great';
    if (rating >= 6.5) return 'good';
    return 'fair';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 8.5) return '⭐ Excellent';
    if (rating >= 7.5) return '👍 Great';
    if (rating >= 6.5) return '😊 Good';
    return '👌 Fair';
  };

  const formatVotes = (votes) => {
    if (votes >= 1000000) return `${(votes / 1000000).toFixed(1)}M`;
    if (votes >= 1000) return `${(votes / 1000).toFixed(0)}K`;
    return votes.toString();
  };

  return (
    <div
      className={`movie-card ${compact ? 'compact' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={`${movie.title} (${movie.releaseYear})`}
    >
      {/* Poster Section */}
      <div className="movie-poster-container">
        <img
          src={movie.poster}
          alt={`${movie.title} poster`}
          className={`movie-poster ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        {/* Overlay on hover */}
        {isHovered && !compact && (
          <div className="poster-overlay">
            <div className="overlay-content">
              <button className="play-button" aria-label="Play trailer">
                ▶️
              </button>
              <p className="overlay-text">View Details</p>
            </div>
          </div>
        )}

        {/* Rating Badge */}
        <div className={`rating-badge rating-${getRatingColor(movie.rating)}`}>
          <div className="rating-value">{movie.rating.toFixed(1)}</div>
          <div className="rating-label">/10</div>
        </div>
      </div>

      {/* Content Section */}
      <div className="movie-content">
        {/* Title */}
        <h3 className="movie-title" title={movie.title}>
          {movie.title}
        </h3>

        {/* Year and Runtime */}
        <div className="movie-meta">
          <span className="release-year">{movie.releaseYear}</span>
          {movie.runtime && (
            <>
              <span className="meta-separator">•</span>
              <span className="runtime">{movie.runtime} min</span>
            </>
          )}
        </div>

        {/* Genre Tags */}
        {showGenre && movie.genre && (
          <div className="genre-tags">
            {movie.genre.slice(0, 2).map((g, idx) => (
              <span key={idx} className="genre-tag">
                {g}
              </span>
            ))}
            {movie.genre.length > 2 && (
              <span className="genre-tag genre-more">
                +{movie.genre.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Director */}
        {showDirector && movie.director && (
          <div className="director-info">
            <span className="director-label">Director:</span>
            <span className="director-name">{movie.director}</span>
          </div>
        )}

        {/* Rating and Votes */}
        <div className="rating-info">
          <span className="rating-label-text">{getRatingLabel(movie.rating)}</span>
          {movie.votes && (
            <span className="votes-count">
              {formatVotes(movie.votes)} votes
            </span>
          )}
        </div>

        {/* Synopsis */}
        {showSynopsis && movie.synopsis && !compact && (
          <p className="synopsis">{movie.synopsis}</p>
        )}

        {/* Action Buttons */}
        {!compact && (
          <div className="card-actions">
            <button className="action-btn primary-btn" aria-label="Add to watchlist">
              ➕ Watchlist
            </button>
            <button className="action-btn secondary-btn" aria-label="Share">
              📤 Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MovieCardGrid Component
 * Displays multiple movie cards in a responsive grid layout
 */
export function MovieCardGrid({
  movies = [],
  onMovieClick,
  title,
  showGenre = false,
  showDirector = false,
  compact = false,
  columns = 6
}) {
  return (
    <div className="movie-grid-section">
      {title && <h2 className="grid-title">{title}</h2>}

      <div className={`movie-grid grid-columns-${columns}`}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={onMovieClick}
            showGenre={showGenre}
            showDirector={showDirector}
            compact={compact}
          />
        ))}
      </div>

      {movies.length === 0 && (
        <div className="empty-grid">
          <p className="empty-message">No movies found</p>
        </div>
      )}
    </div>
  );
}

export default MovieCard;
