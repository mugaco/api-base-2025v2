// Esta versión asume que en la base de datos
// las referencias externas se guardan como ObjectId y no como simples strings.
// Esto se debe a que el código convierte automáticamente cualquier campo que termina en '_id'
// a un ObjectId si el valor es un ObjectId válido.
import { ObjectId } from 'mongodb';

/* eslint-disable */
export class MongoQueryBuilder {
    private query: any = {};

    constructor(query: any) {
        this.query = this.parseQuery(query);
    }

    private parseQuery(query: any): any {
        const parsedQuery: any = {};
        for (const key in query) {
            if (key === '$and' || key === '$or' || key === '$not') {
                parsedQuery[key] = query[key].map((condition: any) => this.parseQuery(condition));
            } else {
                const field = key;
                const operators = query[key];
                for (const operator in operators) {
                    // CAMBIO: Pasamos un booleano que indica si el campo termina en '_id'
                    parsedQuery[field] = this.parseOperator(operator, operators[operator], field.endsWith('_id'));
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
                // CAMBIO: Manejamos la conversión a ObjectId para arrays
                if (isIdField) {
                    return { $in: Array.isArray(value) ? value.map(v => this.isValidObjectId(v) ? new ObjectId(v) : v) : [convertedValue] };
                }
                return { $in: convertedValue };
            case 'not in':
                // CAMBIO: Similar al caso 'in'
                if (isIdField) {
                    return { $nin: Array.isArray(value) ? value.map(v => this.isValidObjectId(v) ? new ObjectId(v) : v) : [convertedValue] };
                }
                return { $nin: convertedValue };
            case 'between':
                return { $gte: convertedValue[0], $lte: convertedValue[1] };
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