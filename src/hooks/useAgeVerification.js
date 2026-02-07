import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'age_verification_state';
const VERIFICATION_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 1 year in ms

/**
 * Generates a secure token by hashing the timestamp and a salt.
 * Not cryptographically secure, but sufficient for client-side age verification.
 */
function generateVerificationToken() {
  const timestamp = Date.now();
  const salt = Math.random().toString(36).substring(2, 15);
  const combined = `${timestamp}:${salt}`;
  
  // Simple hash-like encoding: not secure for crypto, but good enough for obfuscation
  const encoded = btoa(combined);
  return encoded;
}

/**
 * Validates the token format and expiry.
 * Returns { isValid: boolean, age: number }
 */
function validateVerificationToken(token) {
  try {
    const decoded = atob(token);
    const [timestampStr] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);
    
    if (!timestamp || isNaN(timestamp)) return { isValid: false, age: 0 };
    
    const now = Date.now();
    const age = now - timestamp;
    
    // Check if token is expired
    if (age > VERIFICATION_EXPIRY) {
      return { isValid: false, age: 0 };
    }
    
    return { isValid: true, age };
  } catch (e) {
    return { isValid: false, age: 0 };
  }
}

/**
 * Custom hook for managing age verification state.
 * Provides persistent storage across sessions and navigation.
 */
export function useAgeVerification() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { isValid } = validateVerificationToken(stored);
      setIsVerified(isValid);
    }
    setIsLoading(false);
  }, []);

  // Verify age and store token
  const verifyAge = useCallback(async (birthDate) => {
    return new Promise((resolve) => {
      // Simulate async validation (e.g., could call backend)
      setTimeout(() => {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        const isAdult = age >= 18;

        if (isAdult) {
          const token = generateVerificationToken();
          localStorage.setItem(STORAGE_KEY, token);
          setIsVerified(true);
        }

        resolve({
          success: isAdult,
          age,
          message: isAdult
            ? '✅ Age verified! You can now access adult content.'
            : `❌ You must be 18 years old. You are ${age} years old.`,
        });
      }, 500);
    });
  }, []);

  // Clear verification (logout)
  const clearVerification = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsVerified(false);
  }, []);

  // Check remaining time until expiry
  const getTimeUntilExpiry = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const { isValid, age } = validateVerificationToken(stored);
    if (!isValid) return 0;

    const remaining = VERIFICATION_EXPIRY - age;
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    return days;
  }, []);

  return {
    isVerified,
    isLoading,
    verifyAge,
    clearVerification,
    getTimeUntilExpiry,
  };
}

export default useAgeVerification;
