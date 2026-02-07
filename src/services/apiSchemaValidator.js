/**
 * API Schema Validator Service
 * Validates API responses against defined schemas.
 * Production-grade implementation with detailed error reporting.
 */

/**
 * Core schema types.
 */
export const SchemaTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  DATE: 'date',
  ENUM: 'enum',
  CUSTOM: 'custom',
};

/**
 * Validates a value against a single schema definition.
 * Returns { isValid, errors, warnings }
 */
export function validateValue(value, schema, fieldPath = 'root') {
  const errors = [];
  const warnings = [];

  // Null/undefined checks
  if (schema.required && (value === null || value === undefined)) {
    errors.push({
      field: fieldPath,
      type: 'required_field_missing',
      message: `Required field "${fieldPath}" is missing`,
      severity: 'error',
      value: null
    });
    return { isValid: false, errors, warnings };
  }

  // Optional field is missing or null - just warn
  if (!schema.required && (value === null || value === undefined)) {
    if (schema.deprecationNotice) {
      warnings.push({
        field: fieldPath,
        type: 'deprecated_field',
        message: `Field "${fieldPath}" is deprecated: ${schema.deprecationNotice}`,
        severity: 'warning'
      });
    }
    return { isValid: true, errors, warnings };
  }

  // Type validation
  const typeError = validateType(value, schema, fieldPath);
  if (typeError) {
    errors.push(typeError);
    return { isValid: false, errors, warnings };
  }

  // Additional validations based on schema type
  switch (schema.type) {
    case SchemaTypes.STRING:
      validateStringSchema(value, schema, fieldPath, errors, warnings);
      break;

    case SchemaTypes.NUMBER:
      validateNumberSchema(value, schema, fieldPath, errors, warnings);
      break;

    case SchemaTypes.OBJECT:
      validateObjectSchema(value, schema, fieldPath, errors, warnings);
      break;

    case SchemaTypes.ARRAY:
      validateArraySchema(value, schema, fieldPath, errors, warnings);
      break;

    case SchemaTypes.ENUM:
      validateEnumSchema(value, schema, fieldPath, errors, warnings);
      break;

    case SchemaTypes.CUSTOM:
      if (schema.validate) {
        const result = schema.validate(value);
        if (!result.isValid) {
          errors.push({
            field: fieldPath,
            type: 'custom_validation_failed',
            message: result.message || `Custom validation failed for "${fieldPath}"`,
            severity: 'error',
            value
          });
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }
      break;

    default:
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates the type of a value.
 */
function validateType(value, schema, fieldPath) {
  const actualType = typeof value;
  let isValid = false;

  switch (schema.type) {
    case SchemaTypes.STRING:
      isValid = actualType === 'string';
      break;
    case SchemaTypes.NUMBER:
      isValid = actualType === 'number' && !isNaN(value);
      break;
    case SchemaTypes.BOOLEAN:
      isValid = actualType === 'boolean';
      break;
    case SchemaTypes.OBJECT:
      isValid = actualType === 'object' && value !== null && !Array.isArray(value);
      break;
    case SchemaTypes.ARRAY:
      isValid = Array.isArray(value);
      break;
    case SchemaTypes.DATE:
      isValid = value instanceof Date || !isNaN(Date.parse(value));
      break;
    case SchemaTypes.ENUM:
      isValid = true; // Handled separately
      break;
    case SchemaTypes.CUSTOM:
      isValid = true; // Custom validator handles type
      break;
    default:
      isValid = true;
  }

  if (!isValid) {
    return {
      field: fieldPath,
      type: 'type_mismatch',
      message: `Field "${fieldPath}" has type mismatch. Expected ${schema.type}, got ${actualType}`,
      severity: 'error',
      expectedType: schema.type,
      actualType,
      value
    };
  }

  return null;
}

/**
 * Validates string schema constraints.
 */
function validateStringSchema(value, schema, fieldPath, errors, warnings) {
  if (schema.minLength && value.length < schema.minLength) {
    errors.push({
      field: fieldPath,
      type: 'min_length_violation',
      message: `Field "${fieldPath}" is too short. Minimum length is ${schema.minLength}`,
      severity: 'error',
      value
    });
  }

  if (schema.maxLength && value.length > schema.maxLength) {
    errors.push({
      field: fieldPath,
      type: 'max_length_violation',
      message: `Field "${fieldPath}" is too long. Maximum length is ${schema.maxLength}`,
      severity: 'error',
      value
    });
  }

  if (schema.pattern && !schema.pattern.test(value)) {
    errors.push({
      field: fieldPath,
      type: 'pattern_mismatch',
      message: `Field "${fieldPath}" does not match required pattern`,
      severity: 'error',
      value
    });
  }

  if (schema.format) {
    validateStringFormat(value, schema.format, fieldPath, errors);
  }
}

/**
 * Validates string format (email, url, uuid, etc).
 */
function validateStringFormat(value, format, fieldPath, errors) {
  const formatValidators = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    iso8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  };

  if (formatValidators[format] && !formatValidators[format].test(value)) {
    errors.push({
      field: fieldPath,
      type: 'format_violation',
      message: `Field "${fieldPath}" does not match ${format} format`,
      severity: 'error',
      format,
      value
    });
  }
}

/**
 * Validates number schema constraints.
 */
function validateNumberSchema(value, schema, fieldPath, errors, warnings) {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({
      field: fieldPath,
      type: 'minimum_violation',
      message: `Field "${fieldPath}" is below minimum value of ${schema.minimum}`,
      severity: 'error',
      value
    });
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({
      field: fieldPath,
      type: 'maximum_violation',
      message: `Field "${fieldPath}" exceeds maximum value of ${schema.maximum}`,
      severity: 'error',
      value
    });
  }

  if (schema.multipleOf && value % schema.multipleOf !== 0) {
    errors.push({
      field: fieldPath,
      type: 'multiple_violation',
      message: `Field "${fieldPath}" must be a multiple of ${schema.multipleOf}`,
      severity: 'error',
      value
    });
  }
}

/**
 * Validates object schema.
 */
function validateObjectSchema(value, schema, fieldPath, errors, warnings) {
  if (!schema.properties) return;

  // Check for required properties
  if (schema.required) {
    for (const requiredField of schema.required) {
      if (!(requiredField in value)) {
        errors.push({
          field: `${fieldPath}.${requiredField}`,
          type: 'required_field_missing',
          message: `Required property "${requiredField}" is missing from object at "${fieldPath}"`,
          severity: 'error',
          value: undefined
        });
      }
    }
  }

  // Validate each property
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const propValue = value[key];
    const propPath = `${fieldPath}.${key}`;
    const result = validateValue(propValue, propSchema, propPath);

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Check for extra properties
  if (schema.additionalProperties === false) {
    const allowedKeys = new Set(Object.keys(schema.properties || {}));
    for (const key of Object.keys(value)) {
      if (!allowedKeys.has(key)) {
        warnings.push({
          field: `${fieldPath}.${key}`,
          type: 'unexpected_property',
          message: `Unexpected property "${key}" found in object at "${fieldPath}". This might indicate a backend change.`,
          severity: 'warning',
          value: value[key]
        });
      }
    }
  }
}

/**
 * Validates array schema.
 */
function validateArraySchema(value, schema, fieldPath, errors, warnings) {
  if (schema.minItems && value.length < schema.minItems) {
    errors.push({
      field: fieldPath,
      type: 'min_items_violation',
      message: `Array "${fieldPath}" has too few items. Minimum is ${schema.minItems}`,
      severity: 'error',
      value
    });
  }

  if (schema.maxItems && value.length > schema.maxItems) {
    errors.push({
      field: fieldPath,
      type: 'max_items_violation',
      message: `Array "${fieldPath}" has too many items. Maximum is ${schema.maxItems}`,
      severity: 'error',
      value
    });
  }

  if (schema.items) {
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${fieldPath}[${i}]`;
      const result = validateValue(value[i], schema.items, itemPath);

      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }
}

/**
 * Validates enum schema.
 */
function validateEnumSchema(value, schema, fieldPath, errors, warnings) {
  if (!schema.enum || !schema.enum.includes(value)) {
    const allowedValues = schema.enum?.join(', ') || 'unknown';
    errors.push({
      field: fieldPath,
      type: 'enum_violation',
      message: `Field "${fieldPath}" must be one of: ${allowedValues}`,
      severity: 'error',
      expectedValues: schema.enum,
      value
    });
  }
}

/**
 * Main API contract validator class.
 */
export class APIContractValidator {
  constructor() {
    this.schemas = new Map();
    this.validationHistory = [];
    this.maxHistorySize = 100;
    this.listeners = [];
  }

  /**
   * Register a schema for an API endpoint.
   */
  registerSchema(endpointKey, schema) {
    if (!endpointKey || !schema) {
      throw new Error('endpointKey and schema are required');
    }
    this.schemas.set(endpointKey, schema);
  }

  /**
   * Register multiple schemas at once.
   */
  registerSchemas(schemasMap) {
    for (const [key, schema] of Object.entries(schemasMap)) {
      this.registerSchema(key, schema);
    }
  }

  /**
   * Get a registered schema.
   */
  getSchema(endpointKey) {
    return this.schemas.get(endpointKey);
  }

  /**
   * Validate an API response.
   */
  validate(endpointKey, response) {
    const schema = this.schemas.get(endpointKey);

    if (!schema) {
      return {
        isValid: true,
        errors: [],
        warnings: [
          {
            type: 'no_schema_registered',
            message: `No schema registered for endpoint "${endpointKey}". Validation skipped.`,
            severity: 'warning'
          }
        ],
        schemaExists: false
      };
    }

    const result = validateValue(response, schema, endpointKey);
    result.schemaExists = true;
    result.endpointKey = endpointKey;
    result.timestamp = Date.now();

    // Store in history
    this.addToHistory(result);

    // Notify listeners
    if (!result.isValid) {
      this.notifyListeners(result);
    }

    return result;
  }

  /**
   * Validate and raise errors immediately if invalid.
   */
  validateStrict(endpointKey, response) {
    const result = this.validate(endpointKey, response);

    if (!result.isValid) {
      const errorMessages = result.errors
        .map(e => `${e.field}: ${e.message}`)
        .join('\n');
      throw new Error(`API Contract Violation for ${endpointKey}:\n${errorMessages}`);
    }

    return result;
  }

  /**
   * Add validation result to history.
   */
  addToHistory(result) {
    this.validationHistory.push(result);

    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get validation history.
   */
  getHistory(endpointKey = null, limit = 20) {
    let history = [...this.validationHistory];

    if (endpointKey) {
      history = history.filter(h => h.endpointKey === endpointKey);
    }

    return history.slice(-limit);
  }

  /**
   * Get validation statistics.
   */
  getStatistics() {
    const stats = {
      totalValidations: this.validationHistory.length,
      successCount: 0,
      failureCount: 0,
      byEndpoint: {},
      errorTypes: {},
      recentErrors: []
    };

    for (const record of this.validationHistory) {
      if (record.isValid) {
        stats.successCount++;
      } else {
        stats.failureCount++;
        stats.recentErrors.push(record);
      }

      if (!stats.byEndpoint[record.endpointKey]) {
        stats.byEndpoint[record.endpointKey] = {
          total: 0,
          success: 0,
          failed: 0
        };
      }

      stats.byEndpoint[record.endpointKey].total++;
      if (record.isValid) {
        stats.byEndpoint[record.endpointKey].success++;
      } else {
        stats.byEndpoint[record.endpointKey].failed++;
      }

      for (const error of record.errors) {
        stats.errorTypes[error.type] = (stats.errorTypes[error.type] || 0) + 1;
      }
    }

    stats.recentErrors = stats.recentErrors.slice(-10);

    return stats;
  }

  /**
   * Register a listener for validation failures.
   */
  onValidationError(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of validation failure.
   */
  notifyListeners(result) {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch (e) {
        console.error('Error in validation listener:', e);
      }
    }
  }

  /**
   * Clear history and reset.
   */
  reset() {
    this.validationHistory = [];
  }

  /**
   * Destroy the validator.
   */
  destroy() {
    this.schemas.clear();
    this.validationHistory = [];
    this.listeners = [];
  }
}

// Create and export singleton instance
const apiContractValidator = new APIContractValidator();

export default apiContractValidator;
