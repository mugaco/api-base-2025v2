// Esta versión asume que en la base de datos las referencias externas se guardan como ObjectId.
// Los campos que terminan en '_id' se convierten automáticamente a ObjectId si el valor es válido.
// Para evitar la conversión, añade un asterisco al final del nombre del campo: 'external_id*'
// Esto es útil cuando tienes IDs externos que son strings y no ObjectIds.
import { ObjectId } from 'mongodb';

/* eslint-disable */
export class MongoQueryBuilder {
    private query: any = {};
    private readonly MAX_RECURSION_DEPTH = 10;

    constructor(query: any) {
        this.query = this.parseQuery(query, 0);
    }

    private parseQuery(query: any, depth: number = 0): any {
        // Prevenir recursión infinita
        if (depth > this.MAX_RECURSION_DEPTH) {
            throw new Error(`Query depth exceeds maximum allowed depth of ${this.MAX_RECURSION_DEPTH}`);
        }

        const parsedQuery: any = {};

        for (const key in query) {
            if (key === '$and' || key === '$or') {
                if (!Array.isArray(query[key])) {
                    throw new Error(`${key} operator requires an array value`);
                }
                parsedQuery[key] = query[key].map((condition: any) => this.parseQuery(condition, depth + 1));
            } else if (key === '$not') {
                // MongoDB no soporta $not a nivel raíz de query
                throw new Error('$not operator is not supported at query root level. Use it within field operators instead.');
            } else {
                const field = key;
                const operators = query[key];

                for (const operator in operators) {
                    // Verificar si el campo debe convertirse a ObjectId
                    // El escape con * al final indica que NO se debe convertir
                    const hasEscape = field.endsWith('*');
                    const fieldName = hasEscape ? field.slice(0, -1) : field;
                    const shouldConvertToObjectId = fieldName.endsWith('_id') && !hasEscape;

                    const result = this.parseOperator(
                        operator,
                        operators[operator],
                        shouldConvertToObjectId
                    );

                    // Manejar múltiples operadores correctamente
                    if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
                        if (!parsedQuery[fieldName]) {
                            parsedQuery[fieldName] = {};
                        }
                        Object.assign(parsedQuery[fieldName], result);
                    } else {
                        parsedQuery[fieldName] = result;
                    }
                }
            }
        }

        return parsedQuery;
    }

    private parseOperator(operator: string, value: any, isIdField: boolean): any {
        // CAMBIO: Convertimos a ObjectId si es un campo _id y el valor es válido
        const convertedValue = isIdField && this.isValidObjectId(value) ? new ObjectId(value) : value;

        switch (operator.toLowerCase()) {
            case 'like':
                return { $regex: `.*${convertedValue}.*`, $options: 'i' };
            case 'not like':
                return { $not: { $regex: `.*${convertedValue}.*`, $options: 'i' } };
            case 'in':
                if (isIdField) {
                    return {
                        $in: Array.isArray(value)
                            ? value.map(v => this.isValidObjectId(v) ? new ObjectId(v) : v)
                            : [convertedValue]
                    };
                }
                // Asegurar que siempre sea un array
                return { $in: Array.isArray(value) ? value : [value] };
            case 'not in':
                if (isIdField) {
                    return {
                        $nin: Array.isArray(value)
                            ? value.map(v => this.isValidObjectId(v) ? new ObjectId(v) : v)
                            : [convertedValue]
                    };
                }
                // Asegurar que siempre sea un array
                return { $nin: Array.isArray(value) ? value : [value] };
            case 'between':
                if (!Array.isArray(value)) {
                    throw new Error(`'between' operator requires an array with exactly 2 values`);
                }
                if (value.length !== 2) {
                    throw new Error(`'between' operator requires exactly 2 values, got ${value.length}`);
                }
                // Convertir valores si es campo ID
                const [min, max] = isIdField && Array.isArray(value)
                    ? value.map(v => this.isValidObjectId(v) ? new ObjectId(v) : v)
                    : value;

                // Validar orden solo para valores no-ObjectId (números, fechas, strings)
                if (!isIdField && typeof min !== 'object' && typeof max !== 'object') {
                    if (min > max) {
                        throw new Error(`'between' operator: first value (${min}) must be less than or equal to second value (${max})`);
                    }
                }

                return { $gte: min, $lte: max };
            case '=':
            case '$eq':  // CAMBIO: Añadimos soporte para $eq
                return convertedValue;
            case '!=':
            case '<>':
                return { $ne: convertedValue };
            case '>':
                return { $gt: convertedValue };
            case '<':
                return { $lt: convertedValue };
            case '>*date':
                return { $gt: new Date(convertedValue) };
            case '<*date':
                return { $lt: new Date(convertedValue) };
            case '>=':
                return { $gte: convertedValue };
            case '<=':
                return { $lte: convertedValue };
            case 'is null':
                return null;
            case 'is not null':
                return { $ne: null };
            default:
                throw new Error(`Invalid operator: ${operator}`);
        }
    }

    private isValidObjectId(value: any): boolean {
        return ObjectId.isValid(value);
    }


    public getQuery(): any {

        return this.query;
    }
}