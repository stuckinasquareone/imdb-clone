import { validateUrl } from '../URLValidator';

describe('URLValidator', () => {
  describe('validateUrl', () => {
    test('validates proper HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://www.example.com')).toBe(true);
      expect(validateUrl('https://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com:8080/path')).toBe(true);
    });

    test('validates proper HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('http://www.example.com')).toBe(true);
    });

    test('rejects malformed URLs with protocol', () => {
      expect(validateUrl('https://')).toBe(false);
      expect(validateUrl('https://.')).toBe(false);
      expect(validateUrl('https://..com')).toBe(false);
    });

    test('accepts domain-only URLs without protocol', () => {
      expect(validateUrl('example.com')).toBe(true);
      expect(validateUrl('www.example.co.uk')).toBe(true);
      expect(validateUrl('subdomain.example.com')).toBe(true);
    });

    test('rejects invalid domain-only URLs', () => {
      expect(validateUrl('localhost')).toBe(false);
      expect(validateUrl('invalid')).toBe(false);
      expect(validateUrl('.example.com')).toBe(false);
      expect(validateUrl('example.com.')).toBe(false);
    });

    test('rejects URLs with spaces', () => {
      expect(validateUrl('https://example .com')).toBe(false);
      expect(validateUrl('example. com')).toBe(false);
    });

    test('rejects empty and whitespace strings', () => {
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('   ')).toBe(false);
      expect(validateUrl(null)).toBe(false);
      expect(validateUrl(undefined)).toBe(false);
    });

    test('handles special characters in path', () => {
      expect(validateUrl('https://example.com/path-with-dashes')).toBe(true);
      expect(validateUrl('https://example.com/path_with_underscores')).toBe(true);
    });
  });
});
