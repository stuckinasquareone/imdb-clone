/**
 * Activity Feed Hook - Cursor-based Pagination
 * 
 * Efficiently handles loading activities with cursor-based pagination
 * Supports filtering and real-time updates
 * 
 * Learning objectives:
 * - Cursor-based pagination for scalability
 * - Efficient data fetching patterns
 * - State management for large lists
 * - Real-time updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const PAGE_SIZE = 20; // Activities per page

export const useActivityFeed = (userId) => {
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({
    type: null, // null = all, 'watch', 'review', 'rating', 'favorite'
    timeRange: 'all', // 'today', 'week', 'month', 'all'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  // Cursor for pagination
  const cursorRef = useRef(null);
  const hasInitializedRef = useRef(false);

  /**
   * Fetch activities with cursor-based pagination
   */
  const fetchActivities = useCallback(async (cursor = null) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        ...(cursor && { cursor }),
        ...(filters.type && { type: filters.type }),
        ...(filters.timeRange !== 'all' && { timeRange: filters.timeRange }),
      });

      const response = await fetch(`http://localhost:5000/api/activities/${userId}?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();
      const { activities: newActivities, nextCursor, hasMore: moreAvailable } = data;

      if (cursor) {
        // Append to existing activities (pagination)
        setActivities(prev => [...prev, ...newActivities]);
      } else {
        // Replace activities (new filter/refresh)
        setActivities(newActivities);
      }

      cursorRef.current = nextCursor || null;
      setHasMore(moreAvailable);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters, isLoading]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (!hasInitializedRef.current) {
      fetchActivities();
      hasInitializedRef.current = true;
    }
  }, []);

  /**
   * Refetch when filters change
   */
  useEffect(() => {
    cursorRef.current = null;
    fetchActivities();
  }, [filters]);

  /**
   * Load next page of activities
   */
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && cursorRef.current) {
      fetchActivities(cursorRef.current);
    }
  }, [hasMore, isLoading, fetchActivities]);

  /**
   * Update filter and reset pagination
   */
  const updateFilter = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    cursorRef.current = null;
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({ type: null, timeRange: 'all' });
    cursorRef.current = null;
  }, []);

  /**
   * Refresh activities (manual refresh)
   */
  const refresh = useCallback(() => {
    cursorRef.current = null;
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    filters,
    isLoading,
    hasMore,
    error,
    loadMore,
    updateFilter,
    clearFilters,
    refresh,
    pageSize: PAGE_SIZE,
  };
};

export default useActivityFeed;
