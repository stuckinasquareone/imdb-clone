/**
 * Watch Progress Sync Utilities & Helpers
 * Useful utilities for managing watch progress synchronization
 */

/**
 * Storage helper utilities
 */
export const StorageHelper = {
  /**
   * Safely get item from localStorage
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage item ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Safely set item in localStorage
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage item ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all sync-related data
   */
  clearSyncData() {
    try {
      localStorage.removeItem('watch_progress_sync');
      localStorage.removeItem('watch_progress_sync_queue');
      localStorage.removeItem('watch_progress_last_sync');
      return true;
    } catch (error) {
      console.error('Error clearing sync data:', error);
      return false;
    }
  },

  /**
   * Export all sync data as JSON (for debugging/backup)
   */
  exportSyncData() {
    return {
      progress: this.getItem('watch_progress_sync'),
      queue: this.getItem('watch_progress_sync_queue'),
      lastSync: this.getItem('watch_progress_last_sync')
    };
  },

  /**
   * Import sync data from backup
   */
  importSyncData(data) {
    try {
      if (data.progress) this.setItem('watch_progress_sync', data.progress);
      if (data.queue) this.setItem('watch_progress_sync_queue', data.queue);
      if (data.lastSync) this.setItem('watch_progress_last_sync', data.lastSync);
      return true;
    } catch (error) {
      console.error('Error importing sync data:', error);
      return false;
    }
  }
};

/**
 * Time utilities
 */
export const TimeHelper = {
  /**
   * Format timestamp as readable string
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  },

  /**
   * Get time difference from now
   */
  getTimeDiff(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  },

  /**
   * Format duration in minutes to readable format
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  },

  /**
   * Convert seconds to minutes
   */
  secondsToMinutes(seconds) {
    return Math.floor(seconds / 60);
  },

  /**
   * Convert minutes to seconds
   */
  minutesToSeconds(minutes) {
    return minutes * 60;
  },

  /**
   * Debounce function execution
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function execution
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

/**
 * Validation utilities
 */
export const ValidationHelper = {
  /**
   * Validate progress value
   */
  isValidProgress(progress) {
    return typeof progress === 'number' && progress >= 0 && progress <= 100;
  },

  /**
   * Validate movie ID
   */
  isValidMovieId(movieId) {
    return typeof movieId === 'string' && movieId.trim().length > 0;
  },

  /**
   * Validate device ID
   */
  isValidDeviceId(deviceId) {
    return typeof deviceId === 'string' && deviceId.startsWith('device_');
  },

  /**
   * Validate progress metadata
   */
  validateMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') return false;

    const { duration, lastPosition, playbackRate } = metadata;

    if (duration !== undefined && (typeof duration !== 'number' || duration < 0)) {
      return false;
    }

    if (lastPosition !== undefined && (typeof lastPosition !== 'number' || lastPosition < 0)) {
      return false;
    }

    if (playbackRate !== undefined && (typeof playbackRate !== 'number' || playbackRate <= 0)) {
      return false;
    }

    return true;
  },

  /**
   * Validate API response
   */
  validateSyncResponse(response) {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.success === 'boolean' &&
      Array.isArray(response.synced)
    );
  }
};

/**
 * Network utilities
 */
export const NetworkHelper = {
  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Get network connection type
   */
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  },

  /**
   * Check if connection is slow
   */
  isSlowConnection() {
    const type = this.getConnectionType();
    return type === '2g' || type === '3g' || type === '4g';
  },

  /**
   * Get estimated bandwidth
   */
  getEstimatedBandwidth() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
      saveData: connection?.saveData || false,
      effectiveType: connection?.effectiveType || 'unknown'
    };
  },

  /**
   * Setup online/offline listeners
   */
  setupConnectivityListeners(onOnline, onOffline) {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
};

/**
 * Analytics utilities
 */
export const AnalyticsHelper = {
  /**
   * Track sync event
   */
  trackSyncEvent(eventType, data = {}) {
    // Integration point for analytics services
    if (window.gtag) {
      window.gtag('event', `watch_progress_${eventType}`, data);
    }
    // Could also send to custom analytics
    console.log(`[Analytics] ${eventType}`, data);
  },

  /**
   * Track sync performance
   */
  trackSyncPerformance(syncDuration, itemsCount, conflictCount = 0) {
    this.trackSyncEvent('performance', {
      duration_ms: syncDuration,
      items_synced: itemsCount,
      conflicts_detected: conflictCount,
      items_per_second: (itemsCount / syncDuration) * 1000
    });
  },

  /**
   * Track sync error
   */
  trackSyncError(error, context = {}) {
    this.trackSyncEvent('error', {
      error_message: error.message,
      error_code: error.code,
      ...context
    });
  },

  /**
   * Track offline usage
   */
  trackOfflineUsage(durationSeconds, updatesMade) {
    this.trackSyncEvent('offline_usage', {
      duration_seconds: durationSeconds,
      updates_made: updatesMade
    });
  }
};

/**
 * Data comparison utilities
 */
export const ComparisonHelper = {
  /**
   * Deep equality check
   */
  isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  /**
   * Get differences between two objects
   */
  getDifferences(original, updated) {
    const differences = {};

    for (const key in updated) {
      if (updated[key] !== original?.[key]) {
        differences[key] = {
          original: original?.[key],
          updated: updated[key]
        };
      }
    }

    return differences;
  },

  /**
   * Merge objects recursively
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  },

  /**
   * Check if value is object
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
};

/**
 * Logger utility
 */
export const Logger = {
  /**
   * Log levels
   */
  levels: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  },

  /**
   * Current log level
   */
  currentLevel: 'INFO',

  /**
   * Log message
   */
  log(level, message, data = {}) {
    const levelOrder = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

    if (levelOrder[level] >= levelOrder[this.currentLevel]) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}] [WatchProgressSync]`;

      if (level === 'ERROR') {
        console.error(prefix, message, data);
      } else if (level === 'WARN') {
        console.warn(prefix, message, data);
      } else if (level === 'DEBUG') {
        console.debug(prefix, message, data);
      } else {
        console.log(prefix, message, data);
      }
    }
  },

  /**
   * Convenience methods
   */
  debug(message, data) { this.log(this.levels.DEBUG, message, data); },
  info(message, data) { this.log(this.levels.INFO, message, data); },
  warn(message, data) { this.log(this.levels.WARN, message, data); },
  error(message, data) { this.log(this.levels.ERROR, message, data); }
};

/**
 * Export all helpers as namespace
 */
export const WatchProgressHelpers = {
  Storage: StorageHelper,
  Time: TimeHelper,
  Validation: ValidationHelper,
  Network: NetworkHelper,
  Analytics: AnalyticsHelper,
  Comparison: ComparisonHelper,
  Logger
};

export default WatchProgressHelpers;
