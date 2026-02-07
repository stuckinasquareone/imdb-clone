/**
 * useValidatedAPI Hook Tests
 * Tests for API calls with automatic validation.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useValidatedAPI, { withValidation } from '../hooks/useValidatedAPI';
import { SchemaTypes } from '../services/apiSchemaValidator';

describe('useValidatedAPI', () => {
  const mockSchema = {
    type: SchemaTypes.OBJECT,
    required: ['id', 'name'],
    properties: {
      id: { type: SchemaTypes.NUMBER },
      name: { type: SchemaTypes.STRING }
    }
  };

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useValidatedAPI('test'));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.validationError).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('should have validation methods', () => {
    const { result } = renderHook(() => useValidatedAPI('test'));

    expect(typeof result.current.fetchData).toBe('function');
    expect(typeof result.current.validate).toBe('function');
    expect(typeof result.current.clearValidationError).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  test('should validate data against schema', async () => {
    const { result } = renderHook(() => useValidatedAPI('test', mockSchema));

    const validData = { id: 1, name: 'Test' };
    
    await act(async () => {
      const validationResult = result.current.validate(validData);
      expect(validationResult.isValid).toBe(true);
    });
  });

  test('should detect validation errors', async () => {
    const { result } = renderHook(() => useValidatedAPI('test', mockSchema));

    const invalidData = { id: 'not-a-number', name: 'Test' };
    
    await act(async () => {
      const validationResult = result.current.validate(invalidData);
      expect(validationResult.isValid).toBe(false);
    });
  });

  test('should clear validation errors', () => {
    const { result } = renderHook(() => useValidatedAPI('test', mockSchema));

    const invalidData = { id: 'not-a-number', name: 'Test' };
    
    act(() => {
      result.current.validate(invalidData);
      expect(result.current.validationError).not.toBeNull();
      
      result.current.clearValidationError();
      expect(result.current.validationError).toBeNull();
    });
  });

  test('should reset all state', () => {
    const { result } = renderHook(() => useValidatedAPI('test'));

    act(() => {
      result.current.reset();
      
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.validationError).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  test('should register schema when provided', async () => {
    const { result } = renderHook(() => useValidatedAPI('test', mockSchema));

    await waitFor(() => {
      const validData = { id: 1, name: 'Test' };
      const validationResult = result.current.validate(validData);
      expect(validationResult.isValid).toBe(true);
    });
  });

  test('should handle fetch errors', async () => {
    const { result } = renderHook(() => useValidatedAPI('test'));

    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    await act(async () => {
      await result.current.fetchData('/api/test');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });

  test('should track fetch time', async () => {
    const { result } = renderHook(() => useValidatedAPI('test', mockSchema));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Test' })
      })
    );

    await act(async () => {
      await result.current.fetchData('/api/test');
    });

    expect(result.current.lastFetchTime).not.toBeNull();
  });
});

describe('withValidation', () => {
  const mockSchema = {
    type: SchemaTypes.OBJECT,
    required: ['id'],
    properties: {
      id: { type: SchemaTypes.NUMBER }
    }
  };

  const mockApiCall = jest.fn(async () => ({ id: 1, name: 'Test' }));

  afterEach(() => {
    mockApiCall.mockClear();
  });

  test('should wrap API call with validation', async () => {
    const wrappedCall = withValidation(mockApiCall, 'test', mockSchema);
    const result = await wrappedCall();

    expect(result.data).toBeDefined();
    expect(result.validationResult).toBeDefined();
  });

  test('should pass through valid data', async () => {
    const wrappedCall = withValidation(mockApiCall, 'test', mockSchema);
    const result = await wrappedCall();

    expect(result.validationResult.isValid).toBe(true);
  });

  test('should throw on strict validation error', async () => {
    const invalidApiCall = jest.fn(async () => ({ id: 'not-a-number' }));
    const wrappedCall = withValidation(invalidApiCall, 'test', mockSchema, {
      throwOnError: true
    });

    await expect(wrappedCall()).rejects.toThrow();
  });

  test('should call original API call with arguments', async () => {
    const wrappedCall = withValidation(mockApiCall, 'test', mockSchema);
    await wrappedCall('arg1', 'arg2');

    expect(mockApiCall).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
