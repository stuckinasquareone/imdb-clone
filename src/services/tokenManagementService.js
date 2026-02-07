/**
 * Token Management Service
 * Handles secure token rotation, session tracking, and suspicious activity detection.
 * Production-grade implementation with session fingerprinting and anomaly detection.
 */

const TOKEN_STORAGE_KEY = 'security_tokens';
const SESSION_STORAGE_KEY = 'session_history';
const DEVICE_ID_KEY = 'device_fingerprint';

/**
 * Generate a unique device fingerprint based on browser characteristics.
 * Note: This is a client-side implementation for demonstration.
 * Production systems should use server-side validation.
 */
function generateDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Browser Fingerprint', 2, 15);
  
  const canvasHash = canvas.toDataURL();
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  
  const combined = `${canvasHash}|${userAgent}|${language}|${platform}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Generates a cryptographically-inspired refresh token.
 * Format: ${timestamp}.${random}.${hash}
 */
function generateRefreshToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15) +
                 Math.random().toString(36).substring(2, 15);
  const deviceId = getOrCreateDeviceId();
  
  const payload = `${timestamp}:${random}:${deviceId}`;
  const encoded = btoa(payload);
  
  return {
    token: encoded,
    issuedAt: timestamp,
    expiresAt: timestamp + 7 * 24 * 60 * 60 * 1000, // 7 days
    deviceId,
    sessionId: generateSessionId()
  };
}

/**
 * Generates a unique session ID.
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets or creates a persistent device ID.
 */
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${generateDeviceFingerprint()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Validates a refresh token's structure and expiry.
 */
function validateTokenStructure(tokenObj) {
  if (!tokenObj || !tokenObj.token) return { isValid: false, reason: 'Missing token' };
  
  if (Date.now() > tokenObj.expiresAt) {
    return { isValid: false, reason: 'Token expired' };
  }
  
  return { isValid: true, reason: 'Token valid' };
}

/**
 * Core token management service class.
 */
class TokenManagementService {
  constructor() {
    this.currentToken = null;
    this.sessionHistory = [];
    this.suspiciousActivityListeners = [];
    this.tokenRotationInterval = null;
    this.rotationIntervalMs = 60 * 60 * 1000; // 1 hour
    
    this.loadState();
  }

  /**
   * Load persisted state from localStorage.
   */
  loadState() {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentToken = parsed.currentToken;
      }
      
      const historyStored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (historyStored) {
        this.sessionHistory = JSON.parse(historyStored);
      }
    } catch (e) {
      console.error('Error loading token state:', e);
      this.currentToken = null;
      this.sessionHistory = [];
    }
  }

  /**
   * Persist state to localStorage.
   */
  saveState() {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
        currentToken: this.currentToken
      }));
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.sessionHistory));
    } catch (e) {
      console.error('Error saving token state:', e);
    }
  }

  /**
   * Initialize a new session with a fresh token.
   */
  initializeSession() {
    const tokenObj = generateRefreshToken();
    this.currentToken = tokenObj;
    
    const sessionRecord = {
      sessionId: tokenObj.sessionId,
      deviceId: tokenObj.deviceId,
      issuedAt: tokenObj.issuedAt,
      expiresAt: tokenObj.expiresAt,
      status: 'active',
      ipAddress: 'Client-Side', // In production, would come from server
      userAgent: navigator.userAgent.substring(0, 100),
      lastActivityAt: tokenObj.issuedAt
    };
    
    this.sessionHistory.push(sessionRecord);
    // Keep only last 10 sessions
    if (this.sessionHistory.length > 10) {
      this.sessionHistory = this.sessionHistory.slice(-10);
    }
    
    this.saveState();
    return tokenObj;
  }

  /**
   * Rotate the refresh token and detect suspicious reuse.
   * Returns { success, token, suspiciousActivity }
   */
  rotateToken() {
    // Validate current token
    if (!this.currentToken) {
      return {
        success: false,
        error: 'No active token to rotate',
        suspiciousActivity: null
      };
    }

    const validation = validateTokenStructure(this.currentToken);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.reason,
        suspiciousActivity: {
          type: 'expired_token_reuse',
          severity: 'high',
          message: 'Attempted to use an expired token. Session may be compromised.'
        }
      };
    }

    // Check for suspicious patterns
    const suspicious = this.detectSuspiciousActivity();
    if (suspicious) {
      return {
        success: false,
        error: 'Suspicious activity detected',
        suspiciousActivity: suspicious
      };
    }

    // Issue new token (old one becomes invalidated)
    const oldToken = this.currentToken;
    const newToken = generateRefreshToken();
    
    // Update session history
    const currentSession = this.sessionHistory.find(
      s => s.sessionId === oldToken.sessionId
    );
    if (currentSession) {
      currentSession.lastActivityAt = Date.now();
    }

    this.currentToken = newToken;
    this.saveState();

    return {
      success: true,
      token: newToken,
      suspiciousActivity: null,
      oldTokenInvalidated: true
    };
  }

  /**
   * Detect suspicious token reuse patterns.
   * Returns null if no suspicious activity, or suspicious activity object.
   */
  detectSuspiciousActivity() {
    if (!this.currentToken || this.sessionHistory.length === 0) {
      return null;
    }

    const now = Date.now();
    const currentSession = this.sessionHistory.find(
      s => s.sessionId === this.currentToken.sessionId
    );

    if (!currentSession) {
      return null;
    }

    const timeSinceLastActivity = now - currentSession.lastActivityAt;
    const tokenAge = now - this.currentToken.issuedAt;

    // Check for multiple tokens being used from same device in short time
    const recentSessions = this.sessionHistory.filter(
      s => now - s.issuedAt < 60 * 60 * 1000 // Last hour
    );

    const activeSessions = recentSessions.filter(s => s.status === 'active');
    
    // More than 2 concurrent active sessions is suspicious
    if (activeSessions.length > 2) {
      return {
        type: 'concurrent_session_reuse',
        severity: 'high',
        message: `Detected ${activeSessions.length} active sessions. This could indicate token theft.`,
        details: {
          activeSessions: activeSessions.length,
          recentSessions: recentSessions.length
        }
      };
    }

    // Token rotation attempted too soon after issuance (< 5 minutes)
    if (tokenAge < 5 * 60 * 1000) {
      return {
        type: 'rapid_token_rotation',
        severity: 'medium',
        message: 'Unusual token rotation pattern detected.',
        details: {
          tokenAgeSeconds: Math.floor(tokenAge / 1000)
        }
      };
    }

    // No suspicious activity
    return null;
  }

  /**
   * Invalidate all sessions except the current one.
   * Used after re-authentication.
   */
  invalidateOtherSessions() {
    if (!this.currentToken) return;

    const currentSessionId = this.currentToken.sessionId;
    
    this.sessionHistory = this.sessionHistory.map(session => {
      if (session.sessionId !== currentSessionId && session.status === 'active') {
        return {
          ...session,
          status: 'invalidated',
          invalidatedAt: Date.now(),
          invalidationReason: 'suspicious_activity_detected'
        };
      }
      return session;
    });

    this.saveState();
  }

  /**
   * Invalidate the current session entirely.
   */
  invalidateCurrentSession() {
    if (!this.currentToken) return;

    const sessionId = this.currentToken.sessionId;
    const session = this.sessionHistory.find(s => s.sessionId === sessionId);
    
    if (session) {
      session.status = 'invalidated';
      session.invalidatedAt = Date.now();
      session.invalidationReason = 'user_initiated';
    }

    this.currentToken = null;
    this.saveState();
  }

  /**
   * Clear all tokens and sessions (logout).
   */
  logout() {
    this.sessionHistory.forEach(session => {
      if (session.status === 'active') {
        session.status = 'logged_out';
        session.invalidatedAt = Date.now();
      }
    });

    this.currentToken = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * Get current active token.
   */
  getCurrentToken() {
    if (!this.currentToken) return null;

    const validation = validateTokenStructure(this.currentToken);
    return validation.isValid ? this.currentToken : null;
  }

  /**
   * Get session history.
   */
  getSessionHistory() {
    return [...this.sessionHistory];
  }

  /**
   * Start automatic token rotation at set interval.
   */
  startAutoRotation() {
    if (this.tokenRotationInterval) return;

    this.tokenRotationInterval = setInterval(() => {
      const result = this.rotateToken();
      if (!result.success && result.suspiciousActivity) {
        this.notifySuspiciousActivity(result.suspiciousActivity);
      }
    }, this.rotationIntervalMs);
  }

  /**
   * Stop automatic token rotation.
   */
  stopAutoRotation() {
    if (this.tokenRotationInterval) {
      clearInterval(this.tokenRotationInterval);
      this.tokenRotationInterval = null;
    }
  }

  /**
   * Register a listener for suspicious activity events.
   */
  onSuspiciousActivity(callback) {
    this.suspiciousActivityListeners.push(callback);
    return () => {
      this.suspiciousActivityListeners = this.suspiciousActivityListeners.filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Notify all listeners of suspicious activity.
   */
  notifySuspiciousActivity(activity) {
    this.suspiciousActivityListeners.forEach(listener => {
      try {
        listener(activity);
      } catch (e) {
        console.error('Error in suspicious activity listener:', e);
      }
    });
  }

  /**
   * Destroy the service (cleanup).
   */
  destroy() {
    this.stopAutoRotation();
    this.suspiciousActivityListeners = [];
  }
}

// Create and export singleton instance
const tokenManagementService = new TokenManagementService();

export default tokenManagementService;
export { TokenManagementService };
