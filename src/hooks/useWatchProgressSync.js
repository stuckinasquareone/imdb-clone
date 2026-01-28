/**
 * Hook for managing watch progress synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import watchProgressSyncService, { ConflictStrategy } from '../services/watchProgressSyncService';

export const useWatchProgressSync = (movieId) => {
  const [progress, setProgress] = useState(() => {
    return watchProgressSyncService.getProgress(movieId);
  });

  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [conflictDetected, setConflictDetected] = useState(false);
  const [consistencyStatus, setConsistencyStatus] = useState(null);

  const listenerRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const lastUpdateRef = useRef(null);

  // Subscribe to sync events
  useEffect(() => {
    const handleSyncEvent = (event) => {
      switch (event.type) {
        case 'progress_updated':
          if (event.movieId === movieId) {
            setProgress(event.progress);
            setSyncStatus(event.synced ? 'synced' : 'pending');
          }
          break;

        case 'progress_synced':
          if (event.movieId === movieId) {
            const updated = watchProgressSyncService.getProgress(movieId);
            setProgress(updated?.progress);
            setSyncStatus('synced');
            setLastSyncTime(Date.now());
          }
          break;

        case 'progress_merged':
          if (event.movieId === movieId) {
            const merged = watchProgressSyncService.getProgress(movieId);
            setProgress(merged?.progress);
            setConflictDetected(false);
          }
          break;

        case 'sync_completed':
          if (event.synced?.includes(movieId)) {
            setSyncStatus('synced');
            setLastSyncTime(Date.now());
            setIsSyncing(false);
          }
          break;

        case 'conflicts_resolved':
          setConflictDetected(false);
          break;

        case 'sync_failed':
          setSyncStatus('failed');
          setIsSyncing(false);
          break;

        case 'state_recovered':
          if (event.movieId === movieId) {
            const recovered = watchProgressSyncService.getProgress(movieId);
            setProgress(recovered?.progress);
            setSyncStatus('recovered');
          }
          break;

        default:
          break;
      }

      // Update consistency status
      setConsistencyStatus(watchProgressSyncService.getConsistencyStatus());
    };

    listenerRef.current = watchProgressSyncService.addListener(handleSyncEvent);

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, [movieId]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update progress with debouncing
  const updateProgress = useCallback(
    (newProgress, metadata = {}) => {
      // Cancel pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Validate progress
      const validProgress = Math.max(0, Math.min(100, newProgress));

      // Update immediately in state
      setProgress(validProgress);
      lastUpdateRef.current = {
        progress: validProgress,
        timestamp: Date.now()
      };

      // Debounce the actual sync update (300ms)
      updateTimeoutRef.current = setTimeout(() => {
        const fullProgress = watchProgressSyncService.updateProgress(movieId, validProgress, {
          timestamp: Date.now(),
          ...metadata
        });

        setSyncStatus(navigator.onLine ? 'pending' : 'offline');
      }, 300);
    },
    [movieId]
  );

  // Manually trigger sync
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await watchProgressSyncService.syncToServer();
    } catch (error) {
      setSyncStatus('failed');
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Recover state
  const recoverState = useCallback(async () => {
    try {
      const recovered = await watchProgressSyncService.recoverState(movieId);
      if (recovered) {
        setProgress(recovered.progress);
        setSyncStatus('recovered');
      }
    } catch (error) {
      console.error('State recovery failed:', error);
    }
  }, [movieId]);

  // Get sync queue status
  const getSyncQueueStatus = useCallback(() => {
    const queue = watchProgressSyncService.getSyncQueue();
    const movieInQueue = queue.find(item => item.movieId === movieId);
    return {
      inQueue: !!movieInQueue,
      queueSize: queue.length,
      attempts: movieInQueue?.attempts || 0
    };
  }, [movieId]);

  // Force merge with conflict strategy
  const resolveConflictManually = useCallback(
    (strategy = ConflictStrategy.LATEST) => {
      const localProgress = watchProgressSyncService.getProgress(movieId);
      if (localProgress) {
        const resolution = watchProgressSyncService.resolveConflict(
          movieId,
          localProgress,
          localProgress,
          strategy
        );
        return resolution;
      }
      return null;
    },
    [movieId]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    progress,
    syncStatus,
    lastSyncTime,
    isSyncing,
    isOnline,
    conflictDetected,
    consistencyStatus,

    // Methods
    updateProgress,
    triggerSync,
    recoverState,
    getSyncQueueStatus,
    resolveConflictManually,

    // Computed
    isPending: syncStatus === 'pending' && isOnline,
    isSyncNeeded: syncStatus !== 'synced' && isOnline
  };
};

/**
 * Hook for syncing multiple movies at once
 */
export const useMultipleWatchProgressSync = (movieIds) => {
  const [progressMap, setProgressMap] = useState(() => {
    return watchProgressSyncService.getMultipleProgress(movieIds);
  });

  const [globalSyncStatus, setGlobalSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const listenerRef = useRef(null);

  useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.type === 'progress_synced' || event.type === 'progress_updated') {
        if (movieIds.includes(event.movieId)) {
          setProgressMap(prev => {
            const updated = watchProgressSyncService.getMultipleProgress(movieIds);
            return updated;
          });
        }
      }

      if (event.type === 'sync_completed') {
        setGlobalSyncStatus('synced');
      }

      if (event.type === 'sync_failed') {
        setGlobalSyncStatus('failed');
      }
    };

    listenerRef.current = watchProgressSyncService.addListener(handleSyncEvent);

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, [movieIds]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateMultipleProgress = useCallback((updates) => {
    Object.entries(updates).forEach(([movieId, progress]) => {
      if (movieIds.includes(movieId)) {
        watchProgressSyncService.updateProgress(movieId, progress);
      }
    });
  }, [movieIds]);

  const triggerGlobalSync = useCallback(async () => {
    setGlobalSyncStatus('syncing');
    try {
      await watchProgressSyncService.syncToServer();
    } catch (error) {
      setGlobalSyncStatus('failed');
    }
  }, []);

  return {
    progressMap,
    globalSyncStatus,
    isOnline,
    updateMultipleProgress,
    triggerGlobalSync
  };
};

/**
 * Hook for monitoring overall sync health
 */
export const useSyncHealthMonitor = () => {
  const [health, setHealth] = useState(() => {
    return watchProgressSyncService.getConsistencyStatus();
  });

  const listenerRef = useRef(null);
  const monitorIntervalRef = useRef(null);

  useEffect(() => {
    const handleSyncEvent = () => {
      setHealth(watchProgressSyncService.getConsistencyStatus());
    };

    listenerRef.current = watchProgressSyncService.addListener(handleSyncEvent);

    // Also update periodically
    monitorIntervalRef.current = setInterval(() => {
      setHealth(watchProgressSyncService.getConsistencyStatus());
    }, 5000);

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, []);

  return health;
};
