/**
 * useRateLimit Hook
 * Provides rate limiting functionality to React components.
 * Handles status tracking, countdown timers, and user feedback.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import rateLimiterManager, { RateLimitStatus } from '../services/rateLimiterService';

/**
 * Hook for rate limiting actions in React components
 * @param {string} actionKey - Unique identifier for this rate-limited action
 * @param {object} config - Rate limiter configuration
 * @returns {object} Rate limiter state and methods
 */
export function useRateLimit(actionKey, config = {}) {
  const [status, setStatus] = useState(RateLimitStatus.ALLOWED);
  const [timeUntilRetry, setTimeUntilRetry] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [maxRequests, setMaxRequests] = useState(config.maxRequests || 5);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const limiterRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Initialize rate limiter
  useEffect(() => {
    if (!actionKey) return;

    limiterRef.current = rateLimiterManager.create(actionKey, {
      ...config,
      onStatusChange: (data) => {
        setStatus(data.status);
        config.onStatusChange?.(data);
      }
    });

    setMaxRequests(limiterRef.current.maxRequests);

    // Subscribe to rate limiter events
    unsubscribeRef.current = rateLimiterManager.onEvent((event) => {
      if (event.key === actionKey) {
        if (event.eventType === 'statusChange') {
          setIsBlocked(event.status === RateLimitStatus.BLOCKED);
        }
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [actionKey, config]);

  /**
   * Check if action is allowed
   */
  const canExecute = useCallback(() => {
    const limiter = limiterRef.current;
    if (!limiter) return true;

    const check = limiter.checkLimit();
    
    if (!check.allowed) {
      setStatus(check.status);
      setTimeUntilRetry(check.timeUntilRetry || 0);
    } else {
      setStatus(RateLimitStatus.ALLOWED);
      setTimeUntilRetry(0);
    }

    return check.allowed;
  }, []);

  /**
   * Execute rate-limited action
   */
  const execute = useCallback(async (action) => {
    const limiter = limiterRef.current;
    if (!limiter) {
      return { success: true, data: await action() };
    }

    const check = limiter.checkLimit();

    if (!check.allowed) {
      setStatus(check.status);
      setTimeUntilRetry(check.timeUntilRetry || 0);

      // Start countdown timer
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        const newCheck = limiter.checkLimit();
        if (newCheck.timeUntilRetry !== undefined) {
          setTimeUntilRetry(newCheck.timeUntilRetry);
          if (newCheck.timeUntilRetry <= 0) {
            setStatus(RateLimitStatus.ALLOWED);
            setTimeUntilRetry(0);
            clearInterval(countdownIntervalRef.current);
          }
        }
      }, 100);

      return {
        success: false,
        error: 'Rate limit exceeded',
        ...check
      };
    }

    try {
      limiter.recordRequest();
      const state = limiter.getState();
      setRequestCount(state.requestsInWindow);
      setStatus(RateLimitStatus.ALLOWED);

      const result = await action();
      return {
        success: true,
        data: result,
        ...check
      };
    } catch (error) {
      limiter.recordViolation();
      return {
        success: false,
        error: error.message || 'Action failed'
      };
    }
  }, []);

  /**
   * Get detailed status info
   */
  const getStatusInfo = useCallback(() => {
    const limiter = limiterRef.current;
    if (!limiter) return null;
    return limiter.getState();
  }, []);

  /**
   * Reset this rate limiter
   */
  const reset = useCallback(() => {
    const limiter = limiterRef.current;
    if (limiter) {
      limiter.reset();
      setStatus(RateLimitStatus.ALLOWED);
      setTimeUntilRetry(0);
      setRequestCount(0);
      setIsBlocked(false);
    }
  }, []);

  // Cleanup countdown interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    status,
    timeUntilRetry,
    requestCount,
    maxRequests,
    isBlocked,
    isThrottled: status === RateLimitStatus.THROTTLED,
    isCoolingDown: status === RateLimitStatus.COOLING_DOWN,
    isAllowed: status === RateLimitStatus.ALLOWED,

    // Methods
    canExecute,
    execute,
    getStatusInfo,
    reset
  };
}

export default useRateLimit;
