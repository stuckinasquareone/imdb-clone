/**
 * Activity Filter Component
 * 
 * Provides filtering options for activity feed:
 * - By activity type (watch, review, rating, favorite)
 * - By time range (today, week, month, all)
 */

import React, { useState } from 'react';
import './ActivityFilter.css';

const ActivityFilter = ({ filters, onFilterChange, onClearFilters, activeCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activityTypes = [
    { value: 'watch', label: '👀 Watches', color: '#3498db' },
    { value: 'review', label: '✍️ Reviews', color: '#e74c3c' },
    { value: 'rating', label: '⭐ Ratings', color: '#f39c12' },
    { value: 'favorite', label: '❤️ Favorites', color: '#e91e63' },
  ];

  const timeRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  const handleTypeFilter = (type) => {
    onFilterChange({
      type: filters.type === type ? null : type,
    });
  };

  const handleTimeRangeFilter = (timeRange) => {
    onFilterChange({ timeRange });
  };

  return (
    <div className="activity-filter">
      {/* Filter Toggle Button */}
      <button
        className={`activity-filter__toggle ${activeCount > 0 ? 'active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="activity-filter__icon">⚙️</span>
        <span className="activity-filter__label">Filters</span>
        {activeCount > 0 && (
          <span className="activity-filter__badge">{activeCount}</span>
        )}
        <span className={`activity-filter__chevron ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="activity-filter__panel">
          {/* Activity Type Filter */}
          <div className="activity-filter__section">
            <h4 className="activity-filter__section-title">Activity Type</h4>
            <div className="activity-filter__buttons">
              {activityTypes.map(type => (
                <button
                  key={type.value}
                  className={`activity-filter__button ${
                    filters.type === type.value ? 'active' : ''
                  }`}
                  onClick={() => handleTypeFilter(type.value)}
                  style={
                    filters.type === type.value
                      ? { backgroundColor: type.color, color: 'white' }
                      : {}
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="activity-filter__section">
            <h4 className="activity-filter__section-title">Time Range</h4>
            <div className="activity-filter__buttons">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  className={`activity-filter__button ${
                    filters.timeRange === range.value ? 'active' : ''
                  }`}
                  onClick={() => handleTimeRangeFilter(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeCount > 0 && (
            <button className="activity-filter__clear" onClick={onClearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFilter;
