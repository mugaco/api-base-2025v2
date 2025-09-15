/**
 * Utilidad simple para mapear tipos de esquema a TypeScript y Mongoose
 */
import { SchemaField } from '../interfaces/SchemaInterface';

export class TypeMapper {
  /**
   * Obtiene el tipo TypeScript equivalente para un campo del esquema
   */
  static getTypeScriptType(field: SchemaField): string {
    const baseType = this.getBaseTypeScriptType(field.type);

    if (field.isArray) {
      return `${baseType}[]`;
    }

    if (!field.required) {
      return `${baseType} | undefined`;
    }

    return baseType;
  }

  /**
   * Obtiene el tipo Mongoose equivalente para un campo del esquema
   */
  static getMongooseType(field: SchemaField): string {
    const baseType = this.getBaseMongooseType(field.type);

    if (field.isArray) {
      return `[${baseType}]`;
    }

    return baseType;
  }

  /**
   * Mapea el tipo base a TypeScript
   */
  private static getBaseTypeScriptType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'Date',
      'objectid': 'string',
      'object': 'Record<string, any>',
      'array': 'any[]',
      'enum': 'string',
      'mixed': 'any'
    };

    return typeMap[type.toLowerCase()] || 'any';
  }

  /**
   * Mapea el tipo base a Mongoose
   */
  private static getBaseMongooseType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean',
      'date': 'Date',
      'objectid': 'mongoose.Schema.Types.ObjectId',
      'object': 'mongoose.Schema.Types.Mixed',
      'array': 'mongoose.Schema.Types.Mixed',
      'enum': 'String',
      'mixed': 'mongoose.Schema.Types.Mixed'
    };

    return typeMap[type.toLowerCase()] || 'mongoose.Schema.Types.Mixed';
  }
}