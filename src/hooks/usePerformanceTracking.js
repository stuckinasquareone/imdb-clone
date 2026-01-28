/**
 * Custom Hook: usePerformanceTracking
 * 
 * Hook for tracking performance metrics in React components
 * Records component render times and lifecycle events
 * 
 * Learning objectives:
 * - React hooks and component lifecycle
 * - Performance profiling in React
 * - Custom hook patterns
 * 
 * Usage:
 *   const { recordRender, recordEvent } = usePerformanceTracking('ComponentName');
 */

import { useEffect, useRef } from 'react';
import telemetryService from '../services/telemetryService';

export const usePerformanceTracking = (componentName) => {
  const renderTimeRef = useRef(Date.now());
  const componentNameRef = useRef(componentName);

  useEffect(() => {
    // Record mount time
    const mountTime = Date.now() - renderTimeRef.current;
    telemetryService.recordEvent(`${componentNameRef.current}_mounted`, {
      renderTime: mountTime,
    });

    // Track unmount
    return () => {
      telemetryService.recordEvent(`${componentNameRef.current}_unmounted`, {});
    };
  }, []);

  const recordRender = (metadata = {}) => {
    const renderTime = Date.now() - renderTimeRef.current;
    telemetryService.recordEvent(`${componentNameRef.current}_render`, {
      ...metadata,
      renderTime,
    });
    renderTimeRef.current = Date.now();
  };

  const recordEvent = (eventName, data = {}) => {
    telemetryService.recordEvent(`${componentNameRef.current}_${eventName}`, data);
  };

  return { recordRender, recordEvent };
};

export default usePerformanceTracking;
