// DSL-only Query Builder: Solo acepta operadores DSL, no operadores MongoDB nativos
// Los campos que terminan en '_id' se convierten automáticamente a ObjectId si el valor es válido.
// Para evitar la conversión, añade un asterisco al final del nombre del campo: 'external_id*'
import { ObjectId } from 'mongodb';

// Helper para escapar caracteres especiales en regex
const ESCAPE_REGEX = (str: string): string => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export interface IMongoQueryBuilderOptions {
  // Campos que NO deben auto-castear a ObjectId aunque terminen en _id
  noObjectIdCastFields?: string[];
  // Profundidad máxima de recursión
  maxRecursionDepth?: number;
}

/* eslint-disable */
export class MongoQueryBuilder {
  private readonly options: IMongoQueryBuilderOptions;
  private readonly MAX_RECURSION_DEPTH: number;

  constructor(options: IMongoQueryBuilderOptions = {}) {
    this.options = options;
    this.MAX_RECURSION_DEPTH = options.maxRecursionDepth ?? 10;
  }

  /**
   * Construye una query MongoDB a partir de un objeto DSL
   */
  public build(dslQuery: any): any {
    if (!dslQuery || typeof dslQuery !== 'object') {
      return {};
    }
    return this.parseQuery(dslQuery, 0);
  }

  /**
   * Parsea recursivamente el objeto DSL
   */
  private parseQuery(query: any, depth: number = 0): any {
    // Prevenir recursión infinita
    if (depth > this.MAX_RECURSION_DEPTH) {
      throw new Error(`Query depth exceeds maximum allowed depth of ${this.MAX_RECURSION_DEPTH}`);
    }

    // Si no es objeto, tratarlo como igualdad
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
      return query;
    }

    const parsedQuery: any = {};

    for (const key in query) {
      // DSL-only: Bloquear cualquier clave que empiece con $
      if (key.startsWith('$')) {
        throw new Error(`MongoDB operators not allowed. Use DSL operators instead. Found: ${key}`);
      }

      const value = query[key];

      // Operadores lógicos DSL
      if (key === 'and' || key === 'or') {
        if (!Array.isArray(value)) {
          throw new Error(`${key} operator requires an array value`);
        }
        const mongoOp = key === 'and' ? '$and' : '$or';
        parsedQuery[mongoOp] = value.map((condition: any) => this.parseQuery(condition, depth + 1));
        continue;
      }

      if (key === 'not') {
        // 'not' a nivel raíz no es soportado por MongoDB de forma directa
        // Lo transformamos en un $nor con una sola condición
        if (typeof value !== 'object' || value === null) {
          throw new Error('not operator requires an object value');
        }
        const innerQuery = this.parseQuery(value, depth + 1);
        parsedQuery['$nor'] = [innerQuery];
        continue;
      }

      // Campo normal - procesar valor
      this.parseField(parsedQuery, key, value, depth);
    }

    return parsedQuery;
  }

  /**
   * Procesa un campo y su valor/operadores
   */
  private parseField(parsedQuery: any, field: string, value: any, depth: number): void {
    // Detectar si el campo debe evitar conversión a ObjectId
    const hasEscape = field.endsWith('*');
    const fieldName = hasEscape ? field.slice(0, -1) : field;
    const shouldConvertToObjectId = this.shouldConvertToObjectId(fieldName, hasEscape);

    // Si el valor es primitivo o null, es una igualdad directa
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
      parsedQuery[fieldName] = { $eq: this.castValue(fieldName, value, shouldConvertToObjectId) };
      return;
    }

    // El valor es un objeto con operadores DSL
    const fieldConditions: any = {};
    let hasConditions = false;

    for (const operator in value) {
      // DSL-only: Bloquear operadores MongoDB
      if (operator.startsWith('$')) {
        throw new Error(`MongoDB operators not allowed in field ${fieldName}. Use DSL operators instead. Found: ${operator}`);
      }

      const opValue = value[operator];
      const mongoOps = this.parseOperator(operator, opValue, fieldName, shouldConvertToObjectId);

      // Combinar operadores (importante para casos como { ">=": 18, "<": 65 })
      Object.assign(fieldConditions, mongoOps);
      hasConditions = true;
    }

    if (hasConditions) {
      // Si ya existe el campo, hacer merge de condiciones
      if (parsedQuery[fieldName]) {
        Object.assign(parsedQuery[fieldName], fieldConditions);
      } else {
        parsedQuery[fieldName] = fieldConditions;
      }
    }
  }

  /**
   * Parsea un operador DSL y devuelve el equivalente MongoDB
   */
  private parseOperator(operator: string, value: any, fieldName: string, shouldConvertToObjectId: boolean): any {
    const convertedValue = this.castValue(fieldName, value, shouldConvertToObjectId);

    switch (operator.toLowerCase()) {
      case '=':
      case 'eq':
        // IMPORTANTE: Siempre devolver objeto para poder combinar con otros operadores
        return { $eq: convertedValue };

      case '!=':
      case 'ne':
      case '<>':
        return { $ne: convertedValue };

      case '>':
      case 'gt':
        return { $gt: convertedValue };

      case '>=':
      case 'gte':
        return { $gte: convertedValue };

      case '<':
      case 'lt':
        return { $lt: convertedValue };

      case '<=':
      case 'lte':
        return { $lte: convertedValue };

      case 'like': {
        // SEGURIDAD: Escapar caracteres especiales de regex
        const escapedValue = ESCAPE_REGEX(String(value));
        return { $regex: `.*${escapedValue}.*`, $options: 'i' };
      }

      case 'not like': {
        // SEGURIDAD: Escapar caracteres especiales de regex
        const escapedValue = ESCAPE_REGEX(String(value));
        return { $not: { $regex: `.*${escapedValue}.*`, $options: 'i' } };
      }

      case 'in': {
        if (!Array.isArray(value)) {
          // Si no es array, convertirlo en array de un elemento
          const castedValue = this.castValue(fieldName, value, shouldConvertToObjectId);
          return { $in: [castedValue] };
        }
        const castedArray = value.map(v => this.castValue(fieldName, v, shouldConvertToObjectId));
        return { $in: castedArray };
      }

      case 'nin':
      case 'not in': {
        if (!Array.isArray(value)) {
          // Si no es array, convertirlo en array de un elemento
          const castedValue = this.castValue(fieldName, value, shouldConvertToObjectId);
          return { $nin: [castedValue] };
        }
        const castedArray = value.map(v => this.castValue(fieldName, v, shouldConvertToObjectId));
        return { $nin: castedArray };
      }

      case 'between': {
        // Validación especial: no permitir between en _id
        if (fieldName === '_id') {
          throw new Error('between operator is not supported on _id field');
        }

        if (!Array.isArray(value)) {
          throw new Error(`'between' operator requires an array with exactly 2 values`);
        }
        if (value.length !== 2) {
          throw new Error(`'between' operator requires exactly 2 values, got ${value.length}`);
        }

        const [min, max] = value.map(v => this.castValue(fieldName, v, shouldConvertToObjectId));

        // Validar orden para valores comparables (no ObjectId)
        if (!(min instanceof ObjectId) && !(max instanceof ObjectId) &&
            typeof min !== 'object' && typeof max !== 'object') {
          if (min > max) {
            throw new Error(`'between' operator: first value (${min}) must be less than or equal to second value (${max})`);
          }
        }

        return { $gte: min, $lte: max };
      }

      case '>*date': {
        const dateValue = this.toValidDate(value);
        return { $gt: dateValue };
      }

      case '<*date': {
        const dateValue = this.toValidDate(value);
        return { $lt: dateValue };
      }

      case 'exists': {
        if (typeof value !== 'boolean') {
          throw new Error('exists operator expects a boolean value');
        }
        return { $exists: value };
      }

      case 'is null':
        return { $eq: null };

      case 'is not null':
        return { $ne: null };

      default:
        throw new Error(`Invalid DSL operator: ${operator}`);
    }
  }

  /**
   * Determina si un campo debe convertirse a ObjectId
   */
  private shouldConvertToObjectId(fieldName: string, hasEscape: boolean): boolean {
    // No convertir si tiene escape explícito
    if (hasEscape) {
      return false;
    }

    // No convertir si está en la lista de exclusión
    if (this.options.noObjectIdCastFields?.includes(fieldName)) {
      return false;
    }

    // Convertir si termina en _id
    return fieldName.endsWith('_id');
  }

  /**
   * Convierte el valor al tipo apropiado según el campo
   */
  private castValue(fieldName: string, value: any, shouldConvertToObjectId: boolean): any {
    // Null y undefined pasan sin cambios
    if (value === null || value === undefined) {
      return value;
    }

    // Conversión a ObjectId si aplica
    if (shouldConvertToObjectId) {
      if (value instanceof ObjectId) {
        return value;
      }
      if (this.isValidObjectId(value)) {
        return new ObjectId(value);
      }
      // Si no es válido para ObjectId, devolver tal cual
      // Esto permite que el campo falle en MongoDB si es requerido
      return value;
    }

    return value;
  }

  /**
   * Valida si un valor puede convertirse a ObjectId
   */
  private isValidObjectId(value: any): boolean {
    // Verificar que sea string de 24 caracteres hexadecimales
    if (typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)) {
      return true;
    }
    // También aceptar si MongoDB lo considera válido
    return ObjectId.isValid(value);
  }

  /**
   * Convierte un valor a Date y valida que sea válido
   */
  private toValidDate(value: any): Date {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }
    return date;
  }

  /**
   * Método público para compatibilidad con código existente
   */
  public getQuery(): any {
    // Este método ya no es necesario con el nuevo diseño
    // pero lo mantenemos para compatibilidad
    throw new Error('getQuery() is deprecated. Use build() method instead');
  }
}