/**
 * Watch Progress Sync Service
 * Manages cross-device synchronization of watch progress with offline support
 */

const SYNC_API_BASE = process.env.REACT_APP_API_BASE || '/api';
const STORAGE_KEY = 'watch_progress_sync';
const SYNC_QUEUE_KEY = 'watch_progress_sync_queue';
const DEVICE_ID_KEY = 'watch_progress_device_id';
const LAST_SYNC_KEY = 'watch_progress_last_sync';

// Conflict resolution strategies
const ConflictStrategy = {
  LATEST: 'latest',      // Use the most recent update
  LOCAL: 'local',        // Prefer local changes
  REMOTE: 'remote',      // Prefer remote changes
  MERGE: 'merge'         // Attempt to merge changes
};

class WatchProgressSyncService {
  constructor() {
    this.syncInProgress = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.syncInterval = 30000; // 30 seconds
    this.syncTimer = null;
    this.listeners = [];
    this.deviceId = this.getOrCreateDeviceId();
    this.initializeSync();
  }

  /**
   * Get or create a unique device identifier
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Initialize automatic sync
   */
  initializeSync() {
    // Check connection status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Start periodic sync if online
    if (navigator.onLine) {
      this.startPeriodicSync();
    }
  }

  /**
   * Handle when device comes online
   */
  handleOnline() {
    console.log('Device online - starting sync');
    this.startPeriodicSync();
    this.processSyncQueue();
  }

  /**
   * Handle when device goes offline
   */
  handleOffline() {
    console.log('Device offline - stopping sync');
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Start periodic synchronization
   */
  startPeriodicSync() {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(() => {
      if (navigator.onLine) {
        this.syncToServer();
      }
    }, this.syncInterval);
  }

  /**
   * Update watch progress locally
   */
  updateProgress(movieId, progress, metadata = {}) {
    try {
      const timestamp = Date.now();
      const progressData = {
        movieId,
        progress,
        timestamp,
        deviceId: this.deviceId,
        metadata: {
          duration: metadata.duration || 0,
          lastPosition: metadata.lastPosition || 0,
          playbackRate: metadata.playbackRate || 1,
          quality: metadata.quality || 'auto',
          ...metadata
        },
        version: 1,
        synced: false
      };

      // Get existing progress
      const storage = this.getLocalStorage();
      const existingProgress = storage.progress[movieId];

      // Detect and store potential conflicts
      if (existingProgress && existingProgress.synced && existingProgress.timestamp < timestamp) {
        this.storeConflictRecord(movieId, existingProgress, progressData);
      }

      // Update local storage
      storage.progress[movieId] = progressData;
      storage.lastModified = timestamp;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      // Add to sync queue
      this.addToSyncQueue(movieId, progressData);

      // Notify listeners
      this.notifyListeners('progress_updated', { movieId, progress, synced: false });

      return progressData;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get current progress for a movie
   */
  getProgress(movieId) {
    const storage = this.getLocalStorage();
    return storage.progress[movieId] || null;
  }

  /**
   * Get progress for multiple movies
   */
  getMultipleProgress(movieIds) {
    const storage = this.getLocalStorage();
    return movieIds.reduce((acc, movieId) => {
      acc[movieId] = storage.progress[movieId] || null;
      return acc;
    }, {});
  }

  /**
   * Retrieve all local progress records
   */
  getAllProgress() {
    const storage = this.getLocalStorage();
    return storage.progress;
  }

  /**
   * Add progress update to sync queue
   */
  addToSyncQueue(movieId, progressData) {
    try {
      const queue = this.getSyncQueue();
      const queueIndex = queue.findIndex(item => item.movieId === movieId);

      if (queueIndex >= 0) {
        queue[queueIndex] = {
          ...progressData,
          queuedAt: queue[queueIndex].queuedAt,
          attempts: queue[queueIndex].attempts || 0
        };
      } else {
        queue.push({
          ...progressData,
          queuedAt: Date.now(),
          attempts: 0
        });
      }

      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Get pending sync queue
   */
  getSyncQueue() {
    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Sync to server
   */
  async syncToServer() {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = this.getSyncQueue();
      if (queue.length === 0) {
        this.syncInProgress = false;
        return;
      }

      // Prepare sync payload
      const payload = {
        deviceId: this.deviceId,
        timestamp: Date.now(),
        updates: queue,
        lastSyncTimestamp: this.getLastSyncTimestamp()
      };

      // Send to server
      const response = await this.sendSyncRequest(payload);

      // Process response
      if (response.success) {
        await this.processSyncResponse(response);
        this.retryCount = 0;
      } else if (response.conflicts) {
        await this.handleConflicts(response.conflicts);
      }

      this.syncInProgress = false;
    } catch (error) {
      console.error('Sync error:', error);
      this.handleSyncError(error);
    }
  }

  /**
   * Send sync request to server
   */
  async sendSyncRequest(payload) {
    const response = await fetch(`${SYNC_API_BASE}/watch-progress/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': this.deviceId
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Sync request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Process server response after successful sync
   */
  async processSyncResponse(response) {
    try {
      const storage = this.getLocalStorage();

      // Clear synced items from queue
      const syncedMovieIds = response.synced || [];
      let queue = this.getSyncQueue();
      queue = queue.filter(item => !syncedMovieIds.includes(item.movieId));
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

      // Update synced status
      syncedMovieIds.forEach(movieId => {
        if (storage.progress[movieId]) {
          storage.progress[movieId].synced = true;
        }
      });

      // Apply remote updates (from other devices)
      if (response.remoteUpdates) {
        await this.mergeRemoteUpdates(response.remoteUpdates);
      }

      storage.lastSyncTimestamp = response.serverTimestamp || Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      // Update last sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, storage.lastSyncTimestamp.toString());

      this.notifyListeners('sync_completed', { synced: syncedMovieIds, updated: response.remoteUpdates });
    } catch (error) {
      console.error('Error processing sync response:', error);
      throw error;
    }
  }

  /**
   * Handle merge conflicts
   */
  async handleConflicts(conflicts) {
    try {
      const storage = this.getLocalStorage();
      const resolutions = [];

      for (const conflict of conflicts) {
        const resolution = this.resolveConflict(
          conflict.movieId,
          conflict.localVersion,
          conflict.remoteVersion,
          ConflictStrategy.LATEST
        );

        resolutions.push(resolution);

        if (resolution.strategy === ConflictStrategy.LATEST) {
          // Update to whichever is more recent
          const useLocal = conflict.localVersion.timestamp > conflict.remoteVersion.timestamp;
          if (useLocal) {
            // Keep local, nothing to do
          } else {
            // Update to remote
            storage.progress[conflict.movieId] = conflict.remoteVersion;
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

      this.notifyListeners('conflicts_resolved', { resolutions });

      // Retry sync after resolution
      await this.syncToServer();
    } catch (error) {
      console.error('Error handling conflicts:', error);
    }
  }

  /**
   * Resolve individual conflict
   */
  resolveConflict(movieId, localVersion, remoteVersion, strategy = ConflictStrategy.LATEST) {
    let resolvedVersion;
    let usedStrategy = strategy;

    switch (strategy) {
      case ConflictStrategy.LATEST:
        resolvedVersion = localVersion.timestamp > remoteVersion.timestamp ? localVersion : remoteVersion;
        break;
      case ConflictStrategy.LOCAL:
        resolvedVersion = localVersion;
        break;
      case ConflictStrategy.REMOTE:
        resolvedVersion = remoteVersion;
        break;
      case ConflictStrategy.MERGE:
        resolvedVersion = this.mergeVersions(localVersion, remoteVersion);
        break;
      default:
        resolvedVersion = localVersion;
    }

    return {
      movieId,
      resolution: resolvedVersion,
      strategy: usedStrategy,
      timestamp: Date.now(),
      localTimestamp: localVersion.timestamp,
      remoteTimestamp: remoteVersion.timestamp
    };
  }

  /**
   * Merge two versions intelligently
   */
  mergeVersions(localVersion, remoteVersion) {
    // Merge metadata intelligently
    const mergedMetadata = {
      ...remoteVersion.metadata,
      ...localVersion.metadata,
      // Keep the highest progress value
      lastPosition: Math.max(
        localVersion.metadata?.lastPosition || 0,
        remoteVersion.metadata?.lastPosition || 0
      ),
      // Keep the most recent quality/rate settings
      quality: localVersion.timestamp > remoteVersion.timestamp ? localVersion.metadata?.quality : remoteVersion.metadata?.quality,
      playbackRate: localVersion.timestamp > remoteVersion.timestamp ? localVersion.metadata?.playbackRate : remoteVersion.metadata?.playbackRate
    };

    return {
      ...remoteVersion,
      progress: Math.max(localVersion.progress, remoteVersion.progress),
      timestamp: Math.max(localVersion.timestamp, remoteVersion.timestamp),
      metadata: mergedMetadata,
      version: Math.max(localVersion.version, remoteVersion.version) + 1
    };
  }

  /**
   * Merge remote updates from other devices
   */
  async mergeRemoteUpdates(remoteUpdates) {
    try {
      const storage = this.getLocalStorage();

      remoteUpdates.forEach(remoteUpdate => {
        const localProgress = storage.progress[remoteUpdate.movieId];

        if (!localProgress || remoteUpdate.timestamp > localProgress.timestamp) {
          // Remote is newer, apply it
          storage.progress[remoteUpdate.movieId] = {
            ...remoteUpdate,
            synced: true
          };

          this.notifyListeners('progress_synced', {
            movieId: remoteUpdate.movieId,
            progress: remoteUpdate.progress,
            source: 'remote'
          });
        } else if (remoteUpdate.timestamp === localProgress.timestamp && remoteUpdate.progress !== localProgress.progress) {
          // Same timestamp but different progress - merge
          const merged = this.mergeVersions(localProgress, remoteUpdate);
          storage.progress[remoteUpdate.movieId] = merged;

          this.notifyListeners('progress_merged', {
            movieId: remoteUpdate.movieId,
            mergedProgress: merged.progress
          });
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Error merging remote updates:', error);
    }
  }

  /**
   * Process sync queue when coming back online
   */
  async processSyncQueue() {
    try {
      const queue = this.getSyncQueue();
      if (queue.length > 0 && navigator.onLine) {
        await this.syncToServer();
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }

  /**
   * Handle sync error with retry logic
   */
  handleSyncError(error) {
    this.retryCount++;

    if (this.retryCount < this.maxRetries) {
      // Exponential backoff
      const delay = Math.min(5000 * Math.pow(2, this.retryCount - 1), 30000);
      setTimeout(() => {
        if (navigator.onLine) {
          this.syncToServer();
        }
      }, delay);
    } else {
      this.notifyListeners('sync_failed', {
        error: error.message,
        retryCount: this.retryCount
      });
    }
  }

  /**
   * Store conflict record for analysis
   */
  storeConflictRecord(movieId, oldVersion, newVersion) {
    try {
      const storage = this.getLocalStorage();
      if (!storage.conflicts) {
        storage.conflicts = {};
      }

      if (!storage.conflicts[movieId]) {
        storage.conflicts[movieId] = [];
      }

      storage.conflicts[movieId].push({
        oldVersion,
        newVersion,
        detectedAt: Date.now()
      });

      // Keep only recent conflicts (last 10)
      if (storage.conflicts[movieId].length > 10) {
        storage.conflicts[movieId] = storage.conflicts[movieId].slice(-10);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Error storing conflict record:', error);
    }
  }

  /**
   * Recover state to consistent version
   */
  async recoverState(movieId) {
    try {
      // Try to fetch latest state from server
      const response = await fetch(`${SYNC_API_BASE}/watch-progress/${movieId}`, {
        method: 'GET',
        headers: {
          'X-Device-ID': this.deviceId
        },
        credentials: 'include'
      });

      if (response.ok) {
        const serverProgress = await response.json();
        const storage = this.getLocalStorage();

        // Replace with server version
        storage.progress[movieId] = {
          ...serverProgress,
          synced: true
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

        this.notifyListeners('state_recovered', {
          movieId,
          source: 'server'
        });

        return storage.progress[movieId];
      }
    } catch (error) {
      console.error('Error recovering state:', error);
      // Fall back to local state
      return this.getProgress(movieId);
    }
  }

  /**
   * Get consistency check results
   */
  getConsistencyStatus() {
    try {
      const storage = this.getLocalStorage();
      const syncQueue = this.getSyncQueue();

      return {
        localItemsCount: Object.keys(storage.progress).length,
        pendingSyncCount: syncQueue.length,
        lastSyncTime: storage.lastSyncTimestamp,
        deviceId: this.deviceId,
        isOnline: navigator.onLine,
        conflictCount: storage.conflicts ? Object.keys(storage.conflicts).length : 0
      };
    } catch (error) {
      console.error('Error getting consistency status:', error);
      return null;
    }
  }

  /**
   * Get local storage structure
   */
  getLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return {
          progress: {},
          conflicts: {},
          lastModified: Date.now(),
          lastSyncTimestamp: 0
        };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading local storage:', error);
      return {
        progress: {},
        conflicts: {},
        lastModified: Date.now(),
        lastSyncTimestamp: 0
      };
    }
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTimestamp() {
    const timestamp = localStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp) : 0;
  }

  /**
   * Clear sync data (use with caution)
   */
  clearSyncData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_QUEUE_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    this.notifyListeners('data_cleared');
  }

  /**
   * Register listener for sync events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of events
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ type: eventType, ...data });
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.listeners = [];
  }
}

// Export singleton instance
const watchProgressSyncService = new WatchProgressSyncService();

export default watchProgressSyncService;
export { ConflictStrategy };
