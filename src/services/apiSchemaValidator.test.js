/**
 * API Schema Validator Tests
 * Comprehensive tests for schema validation and error detection.
 */

import {
  validateValue,
  SchemaTypes,
  APIContractValidator
} from '../services/apiSchemaValidator';

describe('Schema Validation', () => {
  describe('Type Validation', () => {
    test('should validate string type', () => {
      const schema = { type: SchemaTypes.STRING, required: true };
      const result = validateValue('hello', schema);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-string for string type', () => {
      const schema = { type: SchemaTypes.STRING, required: true };
      const result = validateValue(123, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('type_mismatch');
    });

    test('should validate number type', () => {
      const schema = { type: SchemaTypes.NUMBER, required: true };
      const result = validateValue(42, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should validate boolean type', () => {
      const schema = { type: SchemaTypes.BOOLEAN, required: true };
      const result = validateValue(true, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should validate array type', () => {
      const schema = { type: SchemaTypes.ARRAY, required: true };
      const result = validateValue([1, 2, 3], schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should validate object type', () => {
      const schema = { type: SchemaTypes.OBJECT, required: true };
      const result = validateValue({ key: 'value' }, schema);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('String Constraints', () => {
    test('should validate minLength', () => {
      const schema = { type: SchemaTypes.STRING, minLength: 5 };
      const result = validateValue('hello', schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject minLength violation', () => {
      const schema = { type: SchemaTypes.STRING, minLength: 5 };
      const result = validateValue('hi', schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('min_length_violation');
    });

    test('should validate maxLength', () => {
      const schema = { type: SchemaTypes.STRING, maxLength: 5 };
      const result = validateValue('hello', schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject maxLength violation', () => {
      const schema = { type: SchemaTypes.STRING, maxLength: 5 };
      const result = validateValue('hello world', schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('max_length_violation');
    });

    test('should validate pattern', () => {
      const schema = { type: SchemaTypes.STRING, pattern: /^[a-z]+$/ };
      const result = validateValue('abc', schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject pattern mismatch', () => {
      const schema = { type: SchemaTypes.STRING, pattern: /^[a-z]+$/ };
      const result = validateValue('ABC', schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('pattern_mismatch');
    });
  });

  describe('Number Constraints', () => {
    test('should validate minimum', () => {
      const schema = { type: SchemaTypes.NUMBER, minimum: 10 };
      const result = validateValue(15, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject minimum violation', () => {
      const schema = { type: SchemaTypes.NUMBER, minimum: 10 };
      const result = validateValue(5, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('minimum_violation');
    });

    test('should validate maximum', () => {
      const schema = { type: SchemaTypes.NUMBER, maximum: 100 };
      const result = validateValue(50, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject maximum violation', () => {
      const schema = { type: SchemaTypes.NUMBER, maximum: 100 };
      const result = validateValue(150, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('maximum_violation');
    });
  });

  describe('Array Validation', () => {
    test('should validate array items', () => {
      const schema = {
        type: SchemaTypes.ARRAY,
        items: { type: SchemaTypes.NUMBER }
      };
      const result = validateValue([1, 2, 3], schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject mismatched array items', () => {
      const schema = {
        type: SchemaTypes.ARRAY,
        items: { type: SchemaTypes.NUMBER }
      };
      const result = validateValue([1, 'two', 3], schema);
      
      expect(result.isValid).toBe(false);
    });

    test('should validate minItems', () => {
      const schema = { type: SchemaTypes.ARRAY, minItems: 2 };
      const result = validateValue([1, 2], schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject minItems violation', () => {
      const schema = { type: SchemaTypes.ARRAY, minItems: 2 };
      const result = validateValue([1], schema);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('Object Validation', () => {
    test('should validate object with required properties', () => {
      const schema = {
        type: SchemaTypes.OBJECT,
        required: ['name', 'age'],
        properties: {
          name: { type: SchemaTypes.STRING },
          age: { type: SchemaTypes.NUMBER }
        }
      };
      const result = validateValue({ name: 'John', age: 30 }, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject missing required properties', () => {
      const schema = {
        type: SchemaTypes.OBJECT,
        required: ['name', 'age'],
        properties: {
          name: { type: SchemaTypes.STRING },
          age: { type: SchemaTypes.NUMBER }
        }
      };
      const result = validateValue({ name: 'John' }, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'required_field_missing')).toBe(true);
    });

    test('should detect unexpected properties', () => {
      const schema = {
        type: SchemaTypes.OBJECT,
        additionalProperties: false,
        properties: {
          name: { type: SchemaTypes.STRING }
        }
      };
      const result = validateValue({ name: 'John', extra: 'field' }, schema);
      
      expect(result.warnings.some(w => w.type === 'unexpected_property')).toBe(true);
    });
  });

  describe('Enum Validation', () => {
    test('should validate enum values', () => {
      const schema = { type: SchemaTypes.ENUM, enum: ['red', 'green', 'blue'] };
      const result = validateValue('red', schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid enum values', () => {
      const schema = { type: SchemaTypes.ENUM, enum: ['red', 'green', 'blue'] };
      const result = validateValue('yellow', schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('enum_violation');
    });
  });

  describe('Required vs Optional', () => {
    test('should accept null for optional fields', () => {
      const schema = { type: SchemaTypes.STRING, required: false };
      const result = validateValue(null, schema);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject null for required fields', () => {
      const schema = { type: SchemaTypes.STRING, required: true };
      const result = validateValue(null, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('required_field_missing');
    });
  });
});

describe('APIContractValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new APIContractValidator();
  });

  afterEach(() => {
    validator.destroy();
  });

  describe('Schema Registration', () => {
    test('should register a schema', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      expect(validator.getSchema('test')).toBe(schema);
    });

    test('should register multiple schemas', () => {
      const schemas = {
        user: { type: SchemaTypes.OBJECT },
        post: { type: SchemaTypes.OBJECT }
      };
      validator.registerSchemas(schemas);
      
      expect(validator.getSchema('user')).toBeDefined();
      expect(validator.getSchema('post')).toBeDefined();
    });
  });

  describe('Validation', () => {
    test('should validate data against schema', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      const result = validator.validate('test', 'hello');
      
      expect(result.isValid).toBe(true);
      expect(result.schemaExists).toBe(true);
    });

    test('should detect validation errors', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      const result = validator.validate('test', 123);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle unregistered schemas', () => {
      const result = validator.validate('unknown', 'data');
      
      expect(result.isValid).toBe(true);
      expect(result.schemaExists).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('History', () => {
    test('should track validation history', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      validator.validate('test', 'hello');
      validator.validate('test', 'world');
      
      const history = validator.getHistory();
      
      expect(history.length).toBe(2);
    });

    test('should limit history size', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      for (let i = 0; i < 150; i++) {
        validator.validate('test', 'data');
      }
      
      const history = validator.getHistory(null, 200);
      
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Statistics', () => {
    test('should calculate statistics', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      validator.validate('test', 'valid');
      validator.validate('test', 123); // Invalid
      
      const stats = validator.getStatistics();
      
      expect(stats.totalValidations).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.failureCount).toBe(1);
    });

    test('should track statistics by endpoint', () => {
      validator.registerSchema('users', { type: SchemaTypes.OBJECT });
      validator.registerSchema('posts', { type: SchemaTypes.OBJECT });
      
      validator.validate('users', {});
      validator.validate('posts', {});
      
      const stats = validator.getStatistics();
      
      expect(stats.byEndpoint['users']).toBeDefined();
      expect(stats.byEndpoint['posts']).toBeDefined();
    });
  });

  describe('Listeners', () => {
    test('should notify listeners of validation errors', (done) => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      validator.onValidationError((result) => {
        expect(result.isValid).toBe(false);
        done();
      });
      
      validator.validate('test', 123);
    });

    test('should not notify on successful validation', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      const listener = jest.fn();
      validator.onValidationError(listener);
      
      validator.validate('test', 'valid');
      
      expect(listener).not.toHaveBeenCalled();
    });

    test('should unsubscribe listeners', () => {
      const schema = { type: SchemaTypes.STRING };
      validator.registerSchema('test', schema);
      
      const listener = jest.fn();
      const unsubscribe = validator.onValidationError(listener);
      
      unsubscribe();
      validator.validate('test', 123);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
