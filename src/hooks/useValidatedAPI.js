/**
 * useValidatedAPI Hook
 * Wraps API calls with automatic schema validation.
 * Prevents rendering broken data when backend changes occur.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import apiContractValidator from '../services/apiSchemaValidator';

/**
 * Hook for making validated API calls.
 * Usage: const { data, error, isLoading, validate } = useValidatedAPI('users_endpoint', userSchema);
 */
export function useValidatedAPI(endpointKey, schema = null) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const isMountedRef = useRef(true);

  // Register schema on mount if provided
  useEffect(() => {
    if (schema && endpointKey) {
      apiContractValidator.registerSchema(endpointKey, schema);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [schema, endpointKey]);

  /**
   * Validate data against the registered schema.
   */
  const validate = useCallback((responseData) => {
    const validationResult = apiContractValidator.validate(endpointKey, responseData);

    if (!validationResult.isValid) {
      setValidationError(validationResult);
      return validationResult;
    } else {
      setValidationError(null);
      return validationResult;
    }
  }, [endpointKey]);

  /**
   * Fetch and validate data.
   */
  const fetchData = useCallback(async (url, options = {}) => {
    setIsLoading(true);
    setError(null);
    setValidationError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      if (!isMountedRef.current) return;

      // Validate the response
      const validationResult = validate(responseData);

      if (!validationResult.isValid && options.strictValidation !== false) {
        // In non-strict mode, still set data but show validation error
        if (options.strictValidation === true) {
          throw new Error('API Contract Validation Failed');
        }
        // In lenient mode, set data anyway
        setData(responseData);
      } else {
        setData(responseData);
      }

      setLastFetchTime(Date.now());
      return { data: responseData, validationResult };
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setData(null);

      return { error: errorMessage };
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [validate]);

  /**
   * Validate existing data without fetching.
   */
  const validateExisting = useCallback((responseData) => {
    return validate(responseData);
  }, [validate]);

  /**
   * Clear validation error.
   */
  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  /**
   * Reset all state.
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setValidationError(null);
    setIsLoading(false);
    setLastFetchTime(null);
  }, []);

  return {
    // State
    data,
    error,
    validationError,
    isLoading,
    lastFetchTime,
    
    // Actions
    fetchData,
    validate: validateExisting,
    clearValidationError,
    reset
  };
}

/**
 * Higher-order function to wrap an API call with validation.
 */
export function withValidation(apiCall, endpointKey, schema, options = {}) {
  return async (...args) => {
    const response = await apiCall(...args);
    
    if (!schema) {
      return response;
    }

    const validationResult = apiContractValidator.validate(endpointKey, response);

    if (!validationResult.isValid && options.throwOnError) {
      throw new Error(`API Contract Violation: ${validationResult.errors[0].message}`);
    }

    return {
      data: response,
      validationResult
    };
  };
}

export default useValidatedAPI;
