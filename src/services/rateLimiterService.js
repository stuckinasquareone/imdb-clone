/**
 * Client-Side Rate Limiter Service
 * Lightweight implementation preventing rapid API calls during high-intent actions.
 * Supports multiple rate limiting algorithms and actionable user feedback.
 */

/**
 * Rate limiting algorithms
 */
export const RateLimitAlgorithms = {
  // Fixed window: N requests per M seconds
  FIXED_WINDOW: 'fixed_window',
  // Sliding window: N requests in last M seconds
  SLIDING_WINDOW: 'sliding_window',
  // Token bucket: N tokens, refill M tokens per second
  TOKEN_BUCKET: 'token_bucket',
  // Leaky bucket: Process requests at fixed rate
  LEAKY_BUCKET: 'leaky_bucket',
  // Exponential backoff: Progressive delays after violations
  EXPONENTIAL_BACKOFF: 'exponential_backoff'
};

/**
 * Rate limit status enum
 */
export const RateLimitStatus = {
  ALLOWED: 'allowed',
  THROTTLED: 'throttled',
  BLOCKED: 'blocked',
  COOLING_DOWN: 'cooling_down'
};

/**
 * Individual rate limiter class
 */
class RateLimiter {
  constructor(key, config = {}) {
    this.key = key;
    this.algorithm = config.algorithm || RateLimitAlgorithms.SLIDING_WINDOW;
    this.maxRequests = config.maxRequests || 5;
    this.windowMs = config.windowMs || 60000; // 1 minute default
    this.minIntervalMs = config.minIntervalMs || 1000; // Minimum 1 second between requests
    this.blockDurationMs = config.blockDurationMs || 30000; // 30 second block
    this.exponentialMultiplier = config.exponentialMultiplier || 1.5;
    
    // State
    this.requests = [];
    this.tokens = this.maxRequests;
    this.isBlocked = false;
    this.blockUntil = null;
    this.lastRequestTime = null;
    this.violationCount = 0;
    this.currentBackoffMultiplier = 1;
    
    // Callbacks
    this.onLimitReached = config.onLimitReached;
    this.onStatusChange = config.onStatusChange;
  }

  /**
   * Check if request is allowed
   */
  checkLimit() {
    const now = Date.now();
    
    // Check if currently blocked
    if (this.isBlocked) {
      if (now > this.blockUntil) {
        this.isBlocked = false;
        this.blockUntil = null;
        this.currentBackoffMultiplier = 1;
      } else {
        const timeUntilUnblock = Math.ceil((this.blockUntil - now) / 1000);
        return {
          allowed: false,
          status: RateLimitStatus.BLOCKED,
          timeUntilRetry: timeUntilUnblock,
          retryAfter: this.blockUntil
        };
      }
    }

    // Check minimum interval between requests
    if (this.lastRequestTime && now - this.lastRequestTime < this.minIntervalMs) {
      const timeUntilRetry = Math.ceil((this.minIntervalMs - (now - this.lastRequestTime)) / 1000);
      return {
        allowed: false,
        status: RateLimitStatus.COOLING_DOWN,
        timeUntilRetry,
        retryAfter: this.lastRequestTime + this.minIntervalMs
      };
    }

    // Algorithm-specific checks
    switch (this.algorithm) {
      case RateLimitAlgorithms.FIXED_WINDOW:
        return this._checkFixedWindow(now);
      case RateLimitAlgorithms.SLIDING_WINDOW:
        return this._checkSlidingWindow(now);
      case RateLimitAlgorithms.TOKEN_BUCKET:
        return this._checkTokenBucket(now);
      case RateLimitAlgorithms.EXPONENTIAL_BACKOFF:
        return this._checkExponentialBackoff(now);
      default:
        return this._checkSlidingWindow(now);
    }
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.lastRequestTime = Date.now();
    this.requests.push(this.lastRequestTime);
    
    // Clean old requests beyond window
    const cutoff = this.lastRequestTime - this.windowMs;
    this.requests = this.requests.filter(t => t > cutoff);
  }

  /**
   * Report a rate limit violation
   */
  recordViolation() {
    this.violationCount++;
    
    if (this.algorithm === RateLimitAlgorithms.EXPONENTIAL_BACKOFF) {
      this.currentBackoffMultiplier *= this.exponentialMultiplier;
    }

    // Block on repeated violations
    if (this.violationCount >= 3) {
      this._block();
    }

    this.onLimitReached?.({
      key: this.key,
      violationCount: this.violationCount,
      timeUntilReset: this.windowMs
    });
  }

  /**
   * Reset rate limit state
   */
  reset() {
    this.requests = [];
    this.tokens = this.maxRequests;
    this.isBlocked = false;
    this.blockUntil = null;
    this.lastRequestTime = null;
    this.violationCount = 0;
    this.currentBackoffMultiplier = 1;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      key: this.key,
      algorithm: this.algorithm,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      requestsInWindow: this.requests.length,
      isBlocked: this.isBlocked,
      blockTimeRemaining: this.isBlocked ? Math.max(0, this.blockUntil - Date.now()) : 0,
      lastRequestTime: this.lastRequestTime,
      violationCount: this.violationCount,
      resetTime: this.lastRequestTime ? this.lastRequestTime + this.windowMs : null
    };
  }

  // ===== Private Methods =====

  /**
   * Fixed window: N requests per M seconds
   */
  _checkFixedWindow(now) {
    // Find the current window start
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const requestsInWindow = this.requests.filter(t => t >= windowStart).length;

    if (requestsInWindow >= this.maxRequests) {
      const timeUntilReset = Math.ceil((windowStart + this.windowMs - now) / 1000);
      return {
        allowed: false,
        status: RateLimitStatus.THROTTLED,
        timeUntilRetry: timeUntilReset,
        retryAfter: windowStart + this.windowMs,
        requestsInWindow,
        maxRequests: this.maxRequests
      };
    }

    return {
      allowed: true,
      status: RateLimitStatus.ALLOWED,
      requestsInWindow,
      maxRequests: this.maxRequests
    };
  }

  /**
   * Sliding window: N requests in last M seconds
   */
  _checkSlidingWindow(now) {
    const cutoff = now - this.windowMs;
    const requestsInWindow = this.requests.filter(t => t > cutoff).length;

    if (requestsInWindow >= this.maxRequests) {
      const oldestRequest = this.requests.find(t => t > cutoff);
      const timeUntilRetry = oldestRequest ? Math.ceil((oldestRequest + this.windowMs - now) / 1000) : 0;

      return {
        allowed: false,
        status: RateLimitStatus.THROTTLED,
        timeUntilRetry,
        retryAfter: oldestRequest ? oldestRequest + this.windowMs : now + this.windowMs,
        requestsInWindow,
        maxRequests: this.maxRequests
      };
    }

    return {
      allowed: true,
      status: RateLimitStatus.ALLOWED,
      requestsInWindow,
      maxRequests: this.maxRequests
    };
  }

  /**
   * Token bucket: N tokens, refill M tokens per second
   */
  _checkTokenBucket(now) {
    // Refill tokens based on time elapsed
    if (this.lastRequestTime) {
      const timePassed = now - this.lastRequestTime;
      const tokensToAdd = (timePassed / this.windowMs) * this.maxRequests;
      this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
    }

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return {
        allowed: true,
        status: RateLimitStatus.ALLOWED,
        tokensRemaining: Math.floor(this.tokens),
        maxTokens: this.maxRequests
      };
    }

    const timeUntilRetry = Math.ceil((this.windowMs / this.maxRequests));
    return {
      allowed: false,
      status: RateLimitStatus.THROTTLED,
      timeUntilRetry,
      tokensRemaining: 0,
      maxTokens: this.maxRequests
    };
  }

  /**
   * Exponential backoff: Progressive delays after violations
   */
  _checkExponentialBackoff(now) {
    if (this.lastRequestTime) {
      const requiredDelay = this.minIntervalMs * this.currentBackoffMultiplier;
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < requiredDelay) {
        const timeUntilRetry = Math.ceil((requiredDelay - timeSinceLastRequest) / 1000);
        return {
          allowed: false,
          status: RateLimitStatus.COOLING_DOWN,
          timeUntilRetry,
          retryAfter: this.lastRequestTime + requiredDelay,
          backoffMultiplier: this.currentBackoffMultiplier
        };
      }
    }

    return {
      allowed: true,
      status: RateLimitStatus.ALLOWED,
      backoffMultiplier: this.currentBackoffMultiplier
    };
  }

  /**
   * Block requests for specified duration
   */
  _block() {
    this.isBlocked = true;
    this.blockUntil = Date.now() + this.blockDurationMs;
    this.onStatusChange?.({
      key: this.key,
      status: RateLimitStatus.BLOCKED,
      blockUntil: this.blockUntil
    });
  }
}

/**
 * Main Rate Limiter Manager
 */
export class RateLimiterManager {
  constructor() {
    this.limiters = new Map();
    this.globalListeners = [];
  }

  /**
   * Create or get a rate limiter
   */
  create(key, config = {}) {
    if (!this.limiters.has(key)) {
      const limiter = new RateLimiter(key, {
        ...config,
        onLimitReached: (data) => {
          this._notifyListeners('limitReached', data);
          config.onLimitReached?.(data);
        },
        onStatusChange: (data) => {
          this._notifyListeners('statusChange', data);
          config.onStatusChange?.(data);
        }
      });
      this.limiters.set(key, limiter);
    }
    return this.limiters.get(key);
  }

  /**
   * Get existing limiter
   */
  get(key) {
    return this.limiters.get(key);
  }

  /**
   * Check if action is allowed
   */
  check(key, config = {}) {
    let limiter = this.get(key);
    if (!limiter) {
      limiter = this.create(key, config);
    }
    return limiter.checkLimit();
  }

  /**
   * Execute action with rate limiting
   */
  async execute(key, action, config = {}) {
    const limiter = this.create(key, config);
    const check = limiter.checkLimit();

    if (!check.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        ...check
      };
    }

    try {
      limiter.recordRequest();
      const result = await action();
      return {
        success: true,
        data: result,
        ...check
      };
    } catch (error) {
      // Record violation on error
      limiter.recordViolation();
      return {
        success: false,
        error: error.message || 'Action failed',
        ...check
      };
    }
  }

  /**
   * Register global listener
   */
  onEvent(callback) {
    this.globalListeners.push(callback);
    return () => {
      this.globalListeners = this.globalListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Get limiter state
   */
  getState(key) {
    const limiter = this.get(key);
    return limiter ? limiter.getState() : null;
  }

  /**
   * Get all limiters state
   */
  getAllState() {
    const state = {};
    for (const [key, limiter] of this.limiters) {
      state[key] = limiter.getState();
    }
    return state;
  }

  /**
   * Reset a limiter
   */
  reset(key) {
    const limiter = this.get(key);
    if (limiter) {
      limiter.reset();
    }
  }

  /**
   * Reset all limiters
   */
  resetAll() {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }

  /**
   * Remove a limiter
   */
  remove(key) {
    this.limiters.delete(key);
  }

  /**
   * Destroy all limiters
   */
  destroy() {
    this.limiters.clear();
    this.globalListeners = [];
  }

  /**
   * Notify global listeners
   */
  _notifyListeners(eventType, data) {
    for (const listener of this.globalListeners) {
      try {
        listener({ eventType, ...data });
      } catch (e) {
        console.error('Error in rate limiter listener:', e);
      }
    }
  }
}

// Create and export singleton instance
const rateLimiterManager = new RateLimiterManager();

export default rateLimiterManager;
