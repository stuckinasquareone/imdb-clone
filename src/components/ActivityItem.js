/**
 * Activity Item Component
 * 
 * Displays a single activity (watch, review, rating, or favorite)
 * 
 * Supports:
 * - Different activity types with icons
 * - Thumbnail images
 * - Metadata (date, score, text)
 * - Hover effects
 * - Click navigation
 */

import React from 'react';
import './ActivityItem.css';

const ActivityItem = ({ activity }) => {
  const {
    id,
    type, // 'watch', 'review', 'rating', 'favorite'
    movieId,
    movieTitle,
    moviePoster,
    movieYear,
    createdAt,
    data, // Type-specific data
  } = activity;

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Time ago formatting
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    // Full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Get activity icon and title
  const getActivityInfo = () => {
    switch (type) {
      case 'watch':
        return {
          icon: '👀',
          title: `Watched "${movieTitle}"`,
          subtitle: data?.watchedAt ? `Finished on ${new Date(data.watchedAt).toLocaleDateString()}` : 'Watched',
        };
      case 'review':
        return {
          icon: '✍️',
          title: `Reviewed "${movieTitle}"`,
          subtitle: `"${data?.text?.substring(0, 60)}${(data?.text?.length || 0) > 60 ? '...' : ''}"`,
        };
      case 'rating':
        return {
          icon: '⭐',
          title: `Rated "${movieTitle}"`,
          subtitle: `${data?.rating}/10`,
        };
      case 'favorite':
        return {
          icon: '❤️',
          title: `Added "${movieTitle}" to favorites`,
          subtitle: 'Favorite',
        };
      default:
        return {
          icon: '📽️',
          title: movieTitle,
          subtitle: 'Activity',
        };
    }
  };

  const activityInfo = getActivityInfo();

  const handleClick = () => {
    // Navigate to movie details
    window.location.href = `/movie/${movieId}`;
  };

  return (
    <div
      className={`activity-item activity-item--${type}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      {/* Movie Poster */}
      {moviePoster && (
        <div className="activity-item__poster">
          <img src={moviePoster} alt={movieTitle} />
        </div>
      )}

      {/* Content */}
      <div className="activity-item__content">
        {/* Icon and Title */}
        <div className="activity-item__header">
          <span className="activity-item__icon">{activityInfo.icon}</span>
          <div className="activity-item__title-section">
            <h4 className="activity-item__title">{activityInfo.title}</h4>
            <span className="activity-item__movie-year">{movieYear}</span>
          </div>
        </div>

        {/* Subtitle/Description */}
        {activityInfo.subtitle && (
          <p className="activity-item__subtitle">{activityInfo.subtitle}</p>
        )}

        {/* Type-specific content */}
        {type === 'review' && data?.text && (
          <div className="activity-item__review">
            <p>{data.text.substring(0, 150)}...</p>
          </div>
        )}

        {type === 'rating' && data?.rating && (
          <div className="activity-item__rating">
            <div className="activity-item__stars">
              {[...Array(10)].map((_, i) => (
                <span
                  key={i}
                  className={`star ${i < Math.round(data.rating / 2) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="activity-item__score">{data.rating}/10</span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="activity-item__timestamp">
        <time dateTime={new Date(createdAt).toISOString()}>
          {formatDate(createdAt)}
        </time>
      </div>

      {/* Hover Arrow */}
      <div className="activity-item__arrow">→</div>
    </div>
  );
};

export default ActivityItem;
