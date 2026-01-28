/**
 * Activity Feed Component
 * 
 * Displays a chronological feed of user activities:
 * - Movie watches
 * - Reviews
 * - Ratings
 * - Favorites
 * 
 * Features:
 * - Cursor-based pagination
 * - Infinite scroll
 * - Type filtering
 * - Time range filtering
 * - Smooth rendering
 * - Error handling
 */

import React, { useEffect, useRef, useCallback } from 'react';
import useActivityFeed from '../hooks/useActivityFeed';
import ActivityItem from './ActivityItem';
import ActivityFilter from './ActivityFilter';
import './ActivityFeed.css';

const ActivityFeed = ({ userId }) => {
  const {
    activities,
    filters,
    isLoading,
    hasMore,
    error,
    loadMore,
    updateFilter,
    clearFilters,
    refresh,
  } = useActivityFeed(userId);

  const observerTarget = useRef(null);
  const containerRef = useRef(null);

  /**
   * Intersection Observer for infinite scroll
   * Detects when user scrolls near the bottom
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load before reaching bottom
        threshold: 0.01,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  /**
   * Keyboard shortcut to refresh (Ctrl+R)
   */
  useEffect(() => {
    const handleKeyPress = e => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refresh();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [refresh]);

  /**
   * Scroll to top
   */
  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (error && activities.length === 0) {
    return (
      <div className="activity-feed__error">
        <h3>❌ Failed to load activities</h3>
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  const activeFilterCount = [
    filters.type ? 1 : 0,
    filters.timeRange !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="activity-feed">
      {/* Header with title and refresh */}
      <div className="activity-feed__header">
        <h2>Activity Feed</h2>
        <div className="activity-feed__header-actions">
          <button
            className="activity-feed__refresh-btn"
            onClick={refresh}
            disabled={isLoading}
            title="Refresh (Ctrl+R)"
          >
            {isLoading ? '⟳' : '⟲'}
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <ActivityFilter
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        activeCount={activeFilterCount}
      />

      {/* Activities List */}
      <div className="activity-feed__container" ref={containerRef}>
        {activities.length === 0 ? (
          <div className="activity-feed__empty">
            <div className="activity-feed__empty-icon">📭</div>
            <h3>No activities yet</h3>
            <p>
              {activeFilterCount > 0
                ? 'No activities match your filters'
                : 'Start watching movies to see your activity'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        ) : (
          <>
            {/* Activities List */}
            <div className="activity-feed__list">
              {activities.map((activity, index) => (
                <ActivityItem key={`${activity.id}-${index}`} activity={activity} />
              ))}
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="activity-feed__loading">
                <div className="spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <p>Loading more activities...</p>
              </div>
            )}

            {/* Scroll trigger target */}
            <div ref={observerTarget} className="activity-feed__observer-target" />

            {/* End of list message */}
            {!hasMore && activities.length > 0 && (
              <div className="activity-feed__end">
                <p>✨ You've reached the end of your activity</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll to top button */}
      {activities.length > 10 && (
        <button
          className="activity-feed__scroll-top"
          onClick={scrollToTop}
          title="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default ActivityFeed;
