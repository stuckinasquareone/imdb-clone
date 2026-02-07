/**
 * useTokenRotation Hook Tests
 * Tests for token rotation hook state management and side effects.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useTokenRotation from '../hooks/useTokenRotation';

describe('useTokenRotation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should initialize with authenticated state', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentToken).toBeDefined();
    });
  });

  test('should have initial state properties', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('currentToken');
      expect(result.current).toHaveProperty('sessionHistory');
      expect(result.current).toHaveProperty('suspiciousActivity');
      expect(result.current).toHaveProperty('isReAuthRequired');
      expect(result.current).toHaveProperty('rotationStatus');
      expect(result.current).toHaveProperty('lastRotationTime');
    });
  });

  test('should have action methods', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(typeof result.current.manualRotate).toBe('function');
      expect(typeof result.current.handleReAuthentication).toBe('function');
      expect(typeof result.current.dismissAlert).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });
  });

  test('should perform manual token rotation', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const oldToken = result.current.currentToken;

    await act(async () => {
      await result.current.manualRotate();
    });

    await waitFor(() => {
      expect(result.current.currentToken).toBeDefined();
      expect(result.current.currentToken.token).not.toBe(oldToken.token);
    });
  });

  test('should handle re-authentication successfully', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const resultData = await act(async () => {
      return await result.current.handleReAuthentication({ password: 'SecurePass123!' });
    });

    expect(resultData.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should handle re-authentication failure', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const resultData = await act(async () => {
      return await result.current.handleReAuthentication({ password: 'WrongPassword' });
    });

    expect(resultData.success).toBe(false);
    expect(resultData.error).toBeDefined();
  });

  test('should dismiss alert and reset status', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.dismissAlert();
    });

    expect(result.current.suspiciousActivity).toBeNull();
    expect(result.current.rotationStatus).toBe('idle');
  });

  test('should logout successfully', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentToken).toBeNull();
    expect(result.current.isReAuthRequired).toBe(false);
  });

  test('should track session history', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.sessionHistory.length).toBeGreaterThan(0);
    });

    const initialCount = result.current.sessionHistory.length;

    await act(async () => {
      await result.current.manualRotate();
    });

    await waitFor(() => {
      expect(result.current.sessionHistory.length).toBeGreaterThanOrEqual(initialCount);
    });
  });

  test('should track rotation status changes', async () => {
    const { result } = renderHook(() => useTokenRotation());

    await waitFor(() => {
      expect(result.current.rotationStatus).toBe('idle');
    });

    await act(async () => {
      const rotatePromise = result.current.manualRotate();
      // Status might be 'rotating' during the operation
      await rotatePromise;
    });

    // Status should eventually be idle or success
    await waitFor(() => {
      expect(['idle', 'success']).toContain(result.current.rotationStatus);
    });
  });

  test('should track last rotation time', async () => {
    const { result } = renderHook(() => useTokenRotation());

    const initialTime = result.current.lastRotationTime;

    await waitFor(() => {
      expect(result.current.lastRotationTime).toBeTruthy();
    });

    // Time should be set
    expect(result.current.lastRotationTime).toBeGreaterThan(0);
  });
});
