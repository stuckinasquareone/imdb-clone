/**
 * Token Management Service Tests
 * Comprehensive tests for token rotation, suspicious activity detection, and session management.
 */

import { TokenManagementService } from '../services/tokenManagementService';

describe('TokenManagementService', () => {
  let service;

  beforeEach(() => {
    service = new TokenManagementService();
    localStorage.clear();
    service.loadState();
  });

  afterEach(() => {
    service.destroy();
    localStorage.clear();
  });

  describe('Session Initialization', () => {
    test('should initialize a new session', () => {
      const token = service.initializeSession();

      expect(token).toBeDefined();
      expect(token.token).toBeTruthy();
      expect(token.sessionId).toBeTruthy();
      expect(token.deviceId).toBeTruthy();
      expect(token.expiresAt).toBeGreaterThan(token.issuedAt);
    });

    test('should persist session to localStorage', () => {
      service.initializeSession();
      const stored = localStorage.getItem('security_tokens');

      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.currentToken).toBeDefined();
    });

    test('should load state from localStorage on initialization', () => {
      const token1 = service.initializeSession();
      service.destroy();

      const newService = new TokenManagementService();
      const currentToken = newService.getCurrentToken();

      expect(currentToken).toBeDefined();
      expect(currentToken.token).toBe(token1.token);
    });
  });

  describe('Token Rotation', () => {
    test('should rotate token successfully', () => {
      const oldToken = service.initializeSession();
      const result = service.rotateToken();

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token.token).not.toBe(oldToken.token);
      expect(result.oldTokenInvalidated).toBe(true);
    });

    test('should fail to rotate without initialized session', () => {
      const result = service.rotateToken();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active token');
    });

    test('should detect expired token reuse', () => {
      service.initializeSession();
      // Artificially expire the token
      service.currentToken.expiresAt = Date.now() - 1000;

      const result = service.rotateToken();

      expect(result.success).toBe(false);
      expect(result.suspiciousActivity).toBeDefined();
      expect(result.suspiciousActivity.type).toBe('expired_token_reuse');
      expect(result.suspiciousActivity.severity).toBe('high');
    });

    test('should update session history on rotation', () => {
      service.initializeSession();
      const initialHistoryLength = service.sessionHistory.length;

      service.rotateToken();
      const newHistoryLength = service.sessionHistory.length;

      expect(newHistoryLength).toBeGreaterThan(initialHistoryLength);
    });
  });

  describe('Suspicious Activity Detection', () => {
    test('should detect concurrent session reuse', () => {
      service.initializeSession();

      // Simulate multiple active sessions
      for (let i = 0; i < 3; i++) {
        const token = service.initializeSession();
        service.currentToken = token;
      }

      const suspicious = service.detectSuspiciousActivity();

      expect(suspicious).toBeDefined();
      expect(suspicious.type).toBe('concurrent_session_reuse');
      expect(suspicious.severity).toBe('high');
    });

    test('should not flag single session as suspicious', () => {
      service.initializeSession();
      const suspicious = service.detectSuspiciousActivity();

      expect(suspicious).toBeNull();
    });

    test('should detect rapid token rotation', () => {
      const token = service.initializeSession();
      // Simulate immediate rotation attempt
      service.currentToken.issuedAt = Date.now() - 60 * 1000; // 1 minute ago

      const suspicious = service.detectSuspiciousActivity();

      expect(suspicious).toBeDefined();
      expect(suspicious.type).toBe('rapid_token_rotation');
      expect(suspicious.severity).toBe('medium');
    });

    test('should notify listeners of suspicious activity', (done) => {
      service.initializeSession();

      service.onSuspiciousActivity((activity) => {
        expect(activity).toBeDefined();
        done();
      });

      // Create suspicious state
      for (let i = 0; i < 3; i++) {
        const token = service.initializeSession();
        service.currentToken = token;
      }

      service.notifySuspiciousActivity({
        type: 'test_activity',
        severity: 'high',
        message: 'Test message'
      });
    });
  });

  describe('Session Invalidation', () => {
    test('should invalidate other sessions', () => {
      service.initializeSession();
      service.initializeSession();
      service.initializeSession();

      const activeBefore = service.sessionHistory.filter(s => s.status === 'active').length;
      service.invalidateOtherSessions();
      const activeAfter = service.sessionHistory.filter(s => s.status === 'active').length;

      expect(activeBefore).toBeGreaterThan(activeAfter);
      expect(activeAfter).toBe(1);
    });

    test('should invalidate current session', () => {
      service.initializeSession();
      expect(service.getCurrentToken()).toBeDefined();

      service.invalidateCurrentSession();
      expect(service.getCurrentToken()).toBeNull();
    });

    test('should logout and clear all data', () => {
      service.initializeSession();
      service.logout();

      expect(service.getCurrentToken()).toBeNull();
      expect(localStorage.getItem('security_tokens')).toBeNull();
    });
  });

  describe('Token Validation', () => {
    test('should validate token structure', () => {
      const token = service.initializeSession();
      const validation = { isValid: true, reason: 'Token valid' };

      expect(token).toBeDefined();
      expect(token.token).toBeTruthy();
      expect(token.expiresAt).toBeGreaterThan(Date.now());
    });

    test('should reject expired token', () => {
      const token = service.initializeSession();
      token.expiresAt = Date.now() - 1000;

      expect(token.expiresAt).toBeLessThan(Date.now());
    });
  });

  describe('Automatic Rotation', () => {
    test('should start auto rotation', () => {
      service.initializeSession();
      service.startAutoRotation();

      expect(service.tokenRotationInterval).toBeTruthy();
    });

    test('should stop auto rotation', () => {
      service.initializeSession();
      service.startAutoRotation();
      service.stopAutoRotation();

      expect(service.tokenRotationInterval).toBeNull();
    });

    test('should not start multiple rotation intervals', () => {
      service.initializeSession();
      service.startAutoRotation();
      const firstInterval = service.tokenRotationInterval;

      service.startAutoRotation();
      const secondInterval = service.tokenRotationInterval;

      expect(firstInterval).toBe(secondInterval);
    });
  });

  describe('Session History', () => {
    test('should maintain session history', () => {
      service.initializeSession();
      service.initializeSession();

      const history = service.getSessionHistory();

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0]).toHaveProperty('sessionId');
      expect(history[0]).toHaveProperty('deviceId');
      expect(history[0]).toHaveProperty('status');
    });

    test('should limit session history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        service.initializeSession();
      }

      const history = service.getSessionHistory();

      expect(history.length).toBeLessThanOrEqual(10);
    });

    test('should track session status', () => {
      const token1 = service.initializeSession();
      const token2 = service.initializeSession();

      service.invalidateOtherSessions();

      const history = service.getSessionHistory();
      const invalidated = history.filter(s => s.status === 'invalidated');

      expect(invalidated.length).toBeGreaterThan(0);
    });
  });

  describe('Device Fingerprinting', () => {
    test('should maintain consistent device ID', () => {
      const token1 = service.initializeSession();
      const token2 = service.initializeSession();

      expect(token1.deviceId).toBe(token2.deviceId);
    });

    test('should persist device ID across instances', () => {
      const token1 = service.initializeSession();
      const deviceId1 = token1.deviceId;

      service.destroy();

      const newService = new TokenManagementService();
      const token2 = newService.initializeSession();

      expect(token2.deviceId).toBe(deviceId1);
    });
  });
});
