import { FilterQuery } from 'mongoose';
import { ILoggerService } from '@core/services/LoggerService';

type FilterValue = string | number | boolean | Date | null | undefined | Record<string, unknown> | unknown[];
type FilterOperators = Record<string, FilterValue>;
type FilterObject = Record<string, FilterValue | FilterOperators>;

export interface ISanitizerOptions {
  allowedFields?: Set<string>;
  customProtectedFields?: string[];
  logger?: ILoggerService;
  maxDepth?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
  maxObjectKeys?: number;
}

export interface ISanitizationResult<T> {
  sanitized: FilterQuery<T>;
  violations: string[];
}

export class SecurityFilterSanitizer {
  // DSL-only: operadores lógicos permitidos (sin $)
  private static readonly ALLOWED_LOGICAL_OPS = new Set([
    'and',
    'or',
    'not'
  ]);

  // DSL-only: operadores de campo permitidos (sin $)
  private static readonly ALLOWED_FIELD_OPS = new Set([
    '=', 'eq',
    '!=', 'ne', '<>',
    '>', 'gt',
    '>=', 'gte',
    '<', 'lt',
    '<=', 'lte',
    'in',
    'nin', 'not in',
    'exists',
    'like',
    'not like',
    'between',
    '>*date',
    '<*date',
    'is null',
    'is not null'
  ]);

  private static readonly PROTECTED_FIELDS = new Set([
    'isDeleted',
    '__v',
    'deletedAt',
    'deletedBy',
    'systemFlags',
    '_bsontype'
  ]);

  private static readonly DEFAULT_MAX_DEPTH = 5;
  private static readonly DEFAULT_MAX_ARRAY_LENGTH = 100;
  private static readonly DEFAULT_MAX_STRING_LENGTH = 200;
  private static readonly DEFAULT_MAX_OBJECT_KEYS = 50;

  static sanitize<T>(
    filter: unknown,
    depth: number = 0,
    options: ISanitizerOptions = {}
  ): ISanitizationResult<T> {
    const violations: string[] = [];

    // Configurar límites con valores por defecto
    const maxDepth = options.maxDepth ?? this.DEFAULT_MAX_DEPTH;
    const maxArrayLength = options.maxArrayLength ?? this.DEFAULT_MAX_ARRAY_LENGTH;
    const maxStringLength = options.maxStringLength ?? this.DEFAULT_MAX_STRING_LENGTH;
    const maxObjectKeys = options.maxObjectKeys ?? this.DEFAULT_MAX_OBJECT_KEYS;

    try {
      const sanitized = this.sanitizeRecursive(
        filter,
        depth,
        { ...options, maxDepth, maxArrayLength, maxStringLength, maxObjectKeys },
        violations
      );
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
    options: ISanitizerOptions & {
      maxDepth: number;
      maxArrayLength: number;
      maxStringLength: number;
      maxObjectKeys: number;
    },
    violations: string[]
  ): FilterObject {
    if (depth > options.maxDepth) {
      throw new Error(`Filter depth exceeds maximum allowed depth of ${options.maxDepth}`);
    }

    // Valores primitivos se permiten (el builder los convertirá a { $eq: value })
    if (!filter || typeof filter !== 'object') {
      return filter as FilterObject;
    }

    if (Array.isArray(filter)) {
      // Arrays como valores directos se permiten (para igualdad de arrays)
      return filter as unknown as FilterObject;
    }

    const keys = Object.keys(filter);
    if (keys.length > options.maxObjectKeys) {
      throw new Error(`Filter object exceeds maximum of ${options.maxObjectKeys} keys`);
    }

    const sanitized: FilterObject = {};

    for (const [key, value] of Object.entries(filter)) {
      // DSL-only: Bloquear CUALQUIER clave que empiece con $
      if (key.startsWith('$')) {
        violations.push(`MongoDB operators not allowed. Use DSL operators instead. Found: ${key}`);
        if (options.logger) {
          options.logger.warn('Security: MongoDB operator blocked', { operator: key });
        }
        continue;
      }

      // Bloquear campos protegidos
      if (this.PROTECTED_FIELDS.has(key) || options.customProtectedFields?.includes(key)) {
        violations.push(`Blocked protected field: ${key}`);
        continue;
      }

      // Validar lista blanca de campos si existe
      if (options.allowedFields && !this.ALLOWED_LOGICAL_OPS.has(key) && !options.allowedFields.has(key)) {
        violations.push(`Field not in whitelist: ${key}`);
        continue;
      }

      // Operadores lógicos DSL
      if (key === 'and' || key === 'or') {
        const sanitizedArray = this.sanitizeLogicalOperator(key, value, depth, options, violations);
        if (sanitizedArray && sanitizedArray.length > 0) {
          sanitized[key] = sanitizedArray;
        }
        continue;
      }

      if (key === 'not') {
        if (typeof value !== 'object' || value === null) {
          violations.push('not operator requires an object value');
          continue;
        }
        const sanitizedNot = this.sanitizeRecursive(value, depth + 1, options, violations);
        if (Object.keys(sanitizedNot).length > 0) {
          sanitized[key] = sanitizedNot;
        }
        continue;
      }

      // Campo normal
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Objeto con operadores DSL
        const fieldOperators = this.sanitizeFieldOperators(key, value, options, violations);
        if (Object.keys(fieldOperators).length > 0) {
          sanitized[key] = fieldOperators;
        }
      } else {
        // Valor primitivo o array (igualdad directa)
        const sanitizedValue = this.sanitizePrimitive(value, options);
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
    }

    return sanitized;
  }

  private static sanitizeLogicalOperator(
    operator: string,
    value: unknown,
    depth: number,
    options: ISanitizerOptions & {
      maxDepth: number;
      maxArrayLength: number;
      maxStringLength: number;
      maxObjectKeys: number;
    },
    violations: string[]
  ): FilterObject[] | null {
    if (!Array.isArray(value)) {
      violations.push(`${operator} requires an array value`);
      return null;
    }

    if (value.length > options.maxArrayLength) {
      throw new Error(`${operator} array exceeds maximum length of ${options.maxArrayLength}`);
    }

    const sanitizedArray = value
      .map((item: unknown) => this.sanitizeRecursive(item, depth + 1, options, violations))
      .filter((item: FilterObject) => Object.keys(item).length > 0);

    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  private static sanitizeFieldOperators(
    field: string,
    operators: unknown,
    options: ISanitizerOptions & {
      maxDepth: number;
      maxArrayLength: number;
      maxStringLength: number;
      maxObjectKeys: number;
    },
    violations: string[]
  ): FilterOperators {
    const sanitized: FilterOperators = {};

    if (typeof operators !== 'object' || operators === null) {
      return sanitized;
    }

    for (const [op, opValue] of Object.entries(operators as Record<string, unknown>)) {
      // DSL-only: Bloquear cualquier operador que empiece con $
      if (op.startsWith('$')) {
        violations.push(`MongoDB operators not allowed in field ${field}. Use DSL operators instead. Found: ${op}`);
        continue;
      }

      // Validar que el operador esté en la lista blanca DSL
      if (!this.ALLOWED_FIELD_OPS.has(op)) {
        violations.push(`Unknown DSL operator in field ${field}: ${op}`);
        continue;
      }

      // Validaciones específicas por operador DSL
      if (op === 'like' || op === 'not like') {
        if (typeof opValue !== 'string') {
          violations.push(`${op} expects a string value in field ${field}`);
          continue;
        }
        if (opValue.length > options.maxStringLength) {
          violations.push(`${op} value too long in field ${field} (max ${options.maxStringLength} chars)`);
          continue;
        }
        sanitized[op] = opValue;
      } else if (op === 'in' || op === 'nin' || op === 'not in') {
        if (!Array.isArray(opValue)) {
          violations.push(`${op} expects an array in field ${field}`);
          continue;
        }
        if (opValue.length > options.maxArrayLength) {
          violations.push(`${op} array too long in field ${field} (max ${options.maxArrayLength} items)`);
          continue;
        }
        sanitized[op] = opValue.map((item: unknown) => this.sanitizePrimitive(item, options));
      } else if (op === 'between') {
        if (!Array.isArray(opValue) || opValue.length !== 2) {
          violations.push(`between expects [min, max] array in field ${field}`);
          continue;
        }
        sanitized[op] = opValue;
      } else if (op === 'exists') {
        if (typeof opValue !== 'boolean') {
          violations.push(`exists expects boolean value in field ${field}`);
          continue;
        }
        sanitized[op] = opValue;
      } else if (op === 'is null' || op === 'is not null') {
        // Estos operadores no necesitan valor
        sanitized[op] = true;
      } else {
        // Resto de operadores (=, !=, >, >=, <, <=, >*date, <*date)
        const sanitizedValue = this.sanitizePrimitive(opValue, options);
        if (sanitizedValue !== undefined) {
          sanitized[op] = sanitizedValue;
        }
      }
    }

    return sanitized;
  }

  // Método eliminado - ya no necesitamos sanitizar regex porque DSL-only no acepta $regex
  // Los operadores like/not like manejan el escape internamente

  // Método simplificado - ya no lo necesitamos porque validamos arrays en sanitizeFieldOperators
  private static sanitizeArray(
    value: unknown,
    _operator: string,
    _field: string,
    options: { maxArrayLength: number; maxStringLength: number }
  ): unknown[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    if (value.length > options.maxArrayLength) {
      return null;
    }

    return value.map((item: unknown) => this.sanitizePrimitive(item, options));
  }

  private static sanitizePrimitive(
    value: unknown,
    options?: { maxStringLength: number; maxArrayLength: number }
  ): FilterValue {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const maxLen = options?.maxStringLength ?? this.DEFAULT_MAX_STRING_LENGTH;
      if (value.length > maxLen) {
        throw new Error(`String value exceeds maximum length of ${maxLen}`);
      }
      return value;
    }

    if (value instanceof Date) {
      return value;
    }

    // DSL-only: No permitimos RegExp directas
    if (value instanceof RegExp) {
      return null;
    }

    if (Array.isArray(value)) {
      const maxLen = options?.maxArrayLength ?? this.DEFAULT_MAX_ARRAY_LENGTH;
      if (value.length > maxLen) {
        throw new Error(`Array exceeds maximum length of ${maxLen}`);
      }
      return value.map((item: unknown) => this.sanitizePrimitive(item, options));
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