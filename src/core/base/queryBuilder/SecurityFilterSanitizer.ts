import { FilterQuery } from 'mongoose';
import { ILoggerService } from '@core/services/LoggerService';

type FilterValue = string | number | boolean | Date | null | undefined | RegExp | Record<string, unknown> | unknown[];
type FilterOperators = Record<string, FilterValue>;
type FilterObject = Record<string, FilterValue | FilterOperators>;

export interface ISanitizerOptions {
  allowedFields?: Set<string>;
  customProtectedFields?: string[];
  logger?: ILoggerService;
}

export interface ISanitizationResult<T> {
  sanitized: FilterQuery<T>;
  violations: string[];
}

export class SecurityFilterSanitizer {
  private static readonly ALLOWED_OPERATORS = new Set([
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$in',
    '$nin',
    '$exists',
    '$regex',
    '$and',
    '$or',
    '$not',
    '$elemMatch',
    '$size',
    '$all'
  ]);

  private static readonly FORBIDDEN_OPERATORS = new Set([
    '$where',
    '$expr',
    '$function',
    '$accumulator',
    '$jsonSchema',
    '$text',
    '$geoNear',
    '$near',
    '$nearSphere',
    '$mod'
  ]);

  private static readonly PROTECTED_FIELDS = new Set([
    'isDeleted',
    '__v',
    'deletedAt',
    'deletedBy',
    'systemFlags',
    '_bsontype'
  ]);

  private static readonly MAX_DEPTH = 5;
  private static readonly MAX_ARRAY_LENGTH = 100;
  private static readonly MAX_REGEX_LENGTH = 100;
  private static readonly MAX_STRING_LENGTH = 1000;
  private static readonly MAX_OBJECT_KEYS = 50;

  static sanitize<T>(
    filter: unknown,
    depth: number = 0,
    options: ISanitizerOptions = {}
  ): ISanitizationResult<T> {
    const violations: string[] = [];

    try {
      const sanitized = this.sanitizeRecursive(filter, depth, options, violations);
      return {
        sanitized: sanitized as FilterQuery<T>,
        violations
      };
    } catch (error) {
      if (options.logger) {
        options.logger.error('Filter sanitization failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      violations.push(`Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        sanitized: {} as FilterQuery<T>,
        violations
      };
    }
  }

  private static sanitizeRecursive(
    filter: unknown,
    depth: number,
    options: ISanitizerOptions,
    violations: string[]
  ): FilterObject {
    if (depth > this.MAX_DEPTH) {
      throw new Error(`Filter depth exceeds maximum allowed depth of ${this.MAX_DEPTH}`);
    }

    if (!filter || typeof filter !== 'object') {
      return this.sanitizePrimitive(filter) as FilterObject;
    }

    if (Array.isArray(filter)) {
      throw new Error('Filter cannot be an array at root level');
    }

    const keys = Object.keys(filter);
    if (keys.length > this.MAX_OBJECT_KEYS) {
      throw new Error(`Filter object exceeds maximum of ${this.MAX_OBJECT_KEYS} keys`);
    }

    const sanitized: FilterObject = {};

    for (const [key, value] of Object.entries(filter)) {
      if (this.FORBIDDEN_OPERATORS.has(key)) {
        violations.push(`Blocked forbidden operator: ${key}`);
        if (options.logger) {
          options.logger.warn('Security: Forbidden operator blocked', { operator: key });
        }
        continue;
      }

      if (this.PROTECTED_FIELDS.has(key) || options.customProtectedFields?.includes(key)) {
        violations.push(`Blocked protected field: ${key}`);
        continue;
      }

      if (options.allowedFields && !key.startsWith('$') && !options.allowedFields.has(key)) {
        violations.push(`Field not in whitelist: ${key}`);
        continue;
      }

      if (key === '$and' || key === '$or') {
        const sanitizedArray = this.sanitizeLogicalOperator(key, value, depth, options, violations);
        if (sanitizedArray && sanitizedArray.length > 0) {
          sanitized[key] = sanitizedArray;
        }
        continue;
      }

      if (key === '$not') {
        if (typeof value !== 'object' || value === null) {
          violations.push('$not operator requires an object value');
          continue;
        }
        const sanitizedNot = this.sanitizeRecursive(value, depth + 1, options, violations);
        if (Object.keys(sanitizedNot).length > 0) {
          sanitized[key] = sanitizedNot;
        }
        continue;
      }

      if (key.startsWith('$')) {
        if (!this.ALLOWED_OPERATORS.has(key)) {
          violations.push(`Blocked unknown operator: ${key}`);
          continue;
        }
        const primitiveValue = this.sanitizePrimitive(value);
        if (primitiveValue !== null || value === null) {
          sanitized[key] = primitiveValue as FilterValue;
        }
        continue;
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const fieldOperators = this.sanitizeFieldOperators(key, value, options, violations);
        if (Object.keys(fieldOperators).length > 0) {
          sanitized[key] = fieldOperators;
        }
      } else {
        const primitiveValue = this.sanitizePrimitive(value);
        if (primitiveValue !== null || value === null) {
          sanitized[key] = primitiveValue as FilterValue;
        }
      }
    }

    return sanitized;
  }

  private static sanitizeLogicalOperator(
    operator: string,
    value: unknown,
    depth: number,
    options: ISanitizerOptions,
    violations: string[]
  ): FilterObject[] | null {
    if (!Array.isArray(value)) {
      violations.push(`${operator} requires an array value`);
      return null;
    }

    if (value.length > this.MAX_ARRAY_LENGTH) {
      throw new Error(`${operator} array exceeds maximum length of ${this.MAX_ARRAY_LENGTH}`);
    }

    const sanitizedArray = value
      .map((item: unknown) => this.sanitizeRecursive(item, depth + 1, options, violations))
      .filter((item: FilterObject) => Object.keys(item).length > 0);

    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  private static sanitizeFieldOperators(
    field: string,
    operators: unknown,
    options: ISanitizerOptions,
    violations: string[]
  ): FilterOperators {
    const sanitized: FilterOperators = {};

    if (typeof operators !== 'object' || operators === null) {
      return sanitized;
    }

    for (const [op, opValue] of Object.entries(operators as Record<string, unknown>)) {
      if (!op.startsWith('$')) {
        const primitiveValue = this.sanitizePrimitive(opValue);
        if (primitiveValue !== null || opValue === null) {
          sanitized[op] = primitiveValue as FilterValue;
        }
        continue;
      }

      if (this.FORBIDDEN_OPERATORS.has(op)) {
        violations.push(`Blocked forbidden operator in field ${field}: ${op}`);
        continue;
      }

      if (!this.ALLOWED_OPERATORS.has(op)) {
        violations.push(`Blocked unknown operator in field ${field}: ${op}`);
        continue;
      }

      if (op === '$regex') {
        const sanitizedRegex = this.sanitizeRegex(opValue, field);
        if (sanitizedRegex !== null) {
          sanitized[op] = sanitizedRegex;
        } else {
          violations.push(`Invalid or dangerous regex pattern in field ${field}`);
        }
      } else if (op === '$in' || op === '$nin' || op === '$all') {
        const sanitizedArray = this.sanitizeArray(opValue, op, field);
        if (sanitizedArray !== null) {
          sanitized[op] = sanitizedArray;
        } else {
          violations.push(`Invalid array for operator ${op} in field ${field}`);
        }
      } else if (op === '$elemMatch') {
        if (typeof opValue === 'object' && opValue !== null) {
          sanitized[op] = this.sanitizeRecursive(opValue, 1, options, violations);
        }
      } else {
        const primitiveValue = this.sanitizePrimitive(opValue);
        if (primitiveValue !== null || opValue === null) {
          sanitized[op] = primitiveValue as FilterValue;
        }
      }
    }

    return sanitized;
  }

  private static sanitizeRegex(pattern: unknown, _field: string): string | null {
    if (typeof pattern !== 'string') {
      return null;
    }

    if (pattern.length > this.MAX_REGEX_LENGTH) {
      return null;
    }

    const dangerousPatterns = [
      /(\.\*){2,}/,
      /(\.\+){2,}/,
      /(\+){10,}/,
      /(\|){10,}/,
      /(\\x|\\u)/,
      /\(\?[<!=]/,
      /\(\?\(/
    ];

    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        return null;
      }
    }

    try {
      new RegExp(pattern);
      return pattern;
    } catch {
      return null;
    }
  }

  private static sanitizeArray(value: unknown, _operator: string, _field: string): unknown[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    if (value.length > this.MAX_ARRAY_LENGTH) {
      return null;
    }

    return value.map((item: unknown) => this.sanitizePrimitive(item));
  }

  private static sanitizePrimitive(value: unknown): FilterValue {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.length > this.MAX_STRING_LENGTH) {
        throw new Error(`String value exceeds maximum length of ${this.MAX_STRING_LENGTH}`);
      }
      return value;
    }

    if (value instanceof Date) {
      return value;
    }

    if (value instanceof RegExp) {
      return this.sanitizeRegex(value.source, 'regex') ? value : null;
    }

    if (Array.isArray(value)) {
      if (value.length > this.MAX_ARRAY_LENGTH) {
        throw new Error(`Array exceeds maximum length of ${this.MAX_ARRAY_LENGTH}`);
      }
      return value.map((item: unknown) => this.sanitizePrimitive(item));
    }

    if (typeof value === 'object' && value !== null) {
      const objValue = value as Record<string, unknown>;
      if (objValue._bsontype === 'ObjectID' || objValue.constructor?.name === 'ObjectId') {
        return value as FilterValue;
      }
      return null;
    }

    return null;
  }
}