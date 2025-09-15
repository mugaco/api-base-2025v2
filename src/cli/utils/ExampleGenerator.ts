/**
 * Utilidad para generar ejemplos de datos a partir de esquemas
 */
import { Field, DataSource } from '../interfaces/DataSourceInterfaces';

/**
 * Clase para generar datos de ejemplo para documentación
 */
export class ExampleGenerator {
  /**
   * Genera un ejemplo JSON completo para un esquema
   */
  public generateExampleFromSchema(schema: DataSource): any {
    const example: any = {};
    
    // Generar ID de ejemplo
    example._id = "60d21b4667d0d8992e610c85";
    
    // Generar ejemplos para cada campo
    if (schema && schema.fields && Array.isArray(schema.fields)) {
      schema.fields.forEach(field => {
        example[field.name] = this.generateExampleValue(field);
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Advertencia: El esquema no tiene campos definidos o no es un array:', schema?.name);
    }
    
    // Añadir timestamps si están habilitados
    if (schema && schema.timestamps) {
      example.createdAt = new Date().toISOString();
      example.updatedAt = new Date().toISOString();
    }
    
    return example;
  }
  
  /**
   * Genera un ejemplo para un único campo
   */
  public generateExampleValue(field: Field): any;
  public generateExampleValue(type: string, name?: string): any;
  public generateExampleValue(fieldOrType: Field | string, name?: string): any {
    // Si el primer parámetro es un objeto Field
    if (typeof fieldOrType === 'object') {
      const field = fieldOrType;
      
      // Si el campo tiene un ejemplo definido, usarlo
      if (field.example !== undefined) {
        return field.example;
      }
      
      // Si el campo tiene un valor por defecto, usarlo
      if (field.default !== undefined) {
        return field.default;
      }
      
      // Generar basado en el tipo
      return this.generateExampleValueByType(field.type, field.name);
    } else {
      // Si el primer parámetro es un string (tipo)
      return this.generateExampleValueByType(fieldOrType, name || 'campo');
    }
  }
  
  /**
   * Genera un valor de ejemplo basado en el tipo y nombre
   */
  private generateExampleValueByType(type: string, name: string): any {
    switch (type) {
      case 'string':
        return `Ejemplo de ${name}`;
        
      case 'email':
        return 'usuario@ejemplo.com';
        
      case 'number':
      case 'integer':
        return 42;
        
      case 'boolean':
        return true;
        
      case 'date':
        return new Date().toISOString();
        
      case 'array':
        return ['Ejemplo'];
        
      case 'objectid':
        return "60d21b4667d0d8992e610c85";
        
      case 'object':
        return { ejemplo: "valor" };
        
      default:
        return `Valor para ${name}`;
    }
  }
  
  /**
   * Genera un ejemplo JSON como string para un esquema
   */
  public generateJsonExample(schema: DataSource | any): string {
    if (!schema) {
      // eslint-disable-next-line no-console
      console.warn('Advertencia: Se llamó a generateJsonExample con un esquema vacío');
      return '{}';
    }
    
    try {
      const example = this.generateExampleFromSchema(schema);
      return JSON.stringify(example, null, 2);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al generar ejemplo JSON:', error);
      return '{}';
    }
  }
  
  /**
   * Genera un ejemplo para crear un nuevo recurso (sin campos automáticos)
   */
  public generateCreateExample(schema: DataSource): any {
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
      // eslint-disable-next-line no-console
      console.warn('Advertencia: Esquema inválido en generateCreateExample');
      return {}; // Devolver objeto vacío en lugar de esquema incompleto
    }
    
    const example: any = {};
    
    // Generar valores para cada campo
    schema.fields.forEach(field => {
      example[field.name] = this.generateExampleValue(field);
    });
    
    return example;
  }
  
  /**
   * Genera un ejemplo para actualizar un recurso (todos los campos son opcionales)
   */
  public generateUpdateExample(schema: DataSource): any {
    if (!schema || !schema.fields || !Array.isArray(schema.fields)) {
      // eslint-disable-next-line no-console
      console.warn('Advertencia: Esquema inválido en generateUpdateExample');
      return {}; // Devolver objeto vacío en lugar de esquema incompleto
    }
    
    const example: any = {};
    
    // Para el ejemplo de actualización, incluir solo algunos campos
    const fields = schema.fields;
    
    // Seleccionar aleatoriamente algunos campos (al menos 1, máximo la mitad)
    const numFields = Math.max(1, Math.floor(Math.random() * (fields.length / 2)));
    for (let i = 0; i < numFields && i < fields.length; i++) {
      const field = fields[i];
      example[field.name] = this.generateExampleValue(field);
    }
    
    return example;
  }
} 