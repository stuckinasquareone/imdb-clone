/**
 * useTokenRotation Hook
 * Manages token rotation, suspicious activity detection, and re-authentication flow.
 * Senior-grade implementation with proper state management and cleanup.
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import tokenManagementService from '../services/tokenManagementService';

export function useTokenRotation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentToken, setCurrentToken] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState(null);
  const [isReAuthRequired, setIsReAuthRequired] = useState(false);
  const [rotationStatus, setRotationStatus] = useState('idle');
  const [lastRotationTime, setLastRotationTime] = useState(null);
  
  const suspiciousActivityUnsubscribe = useRef(null);
  const rotationTimeoutRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    const token = tokenManagementService.getCurrentToken();
    
    if (!token) {
      // Initialize new session
      const newToken = tokenManagementService.initializeSession();
      setCurrentToken(newToken);
      setIsAuthenticated(true);
      setLastRotationTime(Date.now());
    } else {
      setCurrentToken(token);
      setIsAuthenticated(true);
      setLastRotationTime(token.issuedAt);
    }

    // Load session history
    const history = tokenManagementService.getSessionHistory();
    setSessionHistory(history);

    // Subscribe to suspicious activity events
    suspiciousActivityUnsubscribe.current = tokenManagementService.onSuspiciousActivity(
      (activity) => {
        setSuspiciousActivity(activity);
        setIsReAuthRequired(true);
        setRotationStatus('suspicious_activity_detected');
      }
    );

    // Start auto-rotation
    tokenManagementService.startAutoRotation();

    return () => {
      if (suspiciousActivityUnsubscribe.current) {
        suspiciousActivityUnsubscribe.current();
      }
      tokenManagementService.stopAutoRotation();
      if (rotationTimeoutRef.current) {
        clearTimeout(rotationTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Manually rotate the token.
   */
  const manualRotate = useCallback(async () => {
    setRotationStatus('rotating');

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = tokenManagementService.rotateToken();

      if (result.success) {
        setCurrentToken(result.token);
        setLastRotationTime(Date.now());
        setSuspiciousActivity(null);
        setRotationStatus('success');

        // Update session history
        const history = tokenManagementService.getSessionHistory();
        setSessionHistory(history);

        // Reset status after delay
        rotationTimeoutRef.current = setTimeout(() => {
          setRotationStatus('idle');
        }, 2000);

        return { success: true };
      } else {
        if (result.suspiciousActivity) {
          setSuspiciousActivity(result.suspiciousActivity);
          setIsReAuthRequired(true);
          setRotationStatus('suspicious_activity_detected');
          return { success: false, suspiciousActivity: result.suspiciousActivity };
        }

        setRotationStatus('error');
        rotationTimeoutRef.current = setTimeout(() => {
          setRotationStatus('idle');
        }, 2000);

        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Token rotation error:', error);
      setRotationStatus('error');
      rotationTimeoutRef.current = setTimeout(() => {
        setRotationStatus('idle');
      }, 2000);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Handle re-authentication (user verifies identity).
   */
  const handleReAuthentication = useCallback(async (credentials) => {
    try {
      setRotationStatus('reauth_in_progress');

      // Simulate server-side validation
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production, verify credentials with backend
      const isValid = credentials && credentials.password === 'SecurePass123!';

      if (!isValid) {
        setRotationStatus('reauth_failed');
        rotationTimeoutRef.current = setTimeout(() => {
          setRotationStatus('idle');
        }, 2000);
        return { success: false, error: 'Invalid credentials' };
      }

      // Invalidate all other sessions
      tokenManagementService.invalidateOtherSessions();

      // Issue new secure token
      const newToken = tokenManagementService.initializeSession();
      setCurrentToken(newToken);
      setIsAuthenticated(true);
      setIsReAuthRequired(false);
      setSuspiciousActivity(null);
      setRotationStatus('reauth_success');

      // Update session history
      const history = tokenManagementService.getSessionHistory();
      setSessionHistory(history);

      // Reset status after delay
      rotationTimeoutRef.current = setTimeout(() => {
        setRotationStatus('idle');
      }, 2000);

      return { success: true, token: newToken };
    } catch (error) {
      console.error('Re-authentication error:', error);
      setRotationStatus('reauth_failed');
      rotationTimeoutRef.current = setTimeout(() => {
        setRotationStatus('idle');
      }, 2000);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Dismiss suspicious activity alert.
   */
  const dismissAlert = useCallback(() => {
    setSuspiciousActivity(null);
    setRotationStatus('idle');
  }, []);

  /**
   * Logout and invalidate all sessions.
   */
  const logout = useCallback(() => {
    tokenManagementService.logout();
    setIsAuthenticated(false);
    setCurrentToken(null);
    setIsReAuthRequired(false);
    setSuspiciousActivity(null);
    setRotationStatus('idle');
  }, []);

  return {
    // State
    isAuthenticated,
    currentToken,
    sessionHistory,
    suspiciousActivity,
    isReAuthRequired,
    rotationStatus,
    lastRotationTime,
    
    // Actions
    manualRotate,
    handleReAuthentication,
    dismissAlert,
    logout
  };
}

export default useTokenRotation;
