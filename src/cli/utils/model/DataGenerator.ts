/**
 * Clase para generar datos de prueba
 */
import { faker } from '@faker-js/faker/locale/es';
import * as mongoose from 'mongoose';

/**
 * Clase para generar datos de prueba basados en modelos
 */
export class DataGenerator {
  /**
   * Constructor de la clase
   */
  constructor(private readonly faker: any) {}

  /**
   * Genera un registro completo basado en la estructura del modelo
   */
  public async generateRecord(
    modelStructure: any,
    index: number,
    realistic: boolean,
    customValues: Record<string, any> = {}
  ): Promise<any> {
    // Validar que modelStructure tenga la estructura esperada
    if (!modelStructure || !modelStructure.fields || !Array.isArray(modelStructure.fields)) {
      // eslint-disable-next-line no-console
      console.warn(`Estructura de modelo inválida: ${JSON.stringify(modelStructure).substring(0, 100)}...`);
      
      // Devolver un objeto con ID y timestamps como mínimo
      return {
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        __warning: "Estructura de modelo incompleta, datos parciales generados"
      };
    }
    
    // Si no hay campos definidos, verificar si hay campos por defecto
    if (modelStructure.fields.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(`El modelo ${modelStructure.name} no tiene campos definidos. Usando campos por defecto.`);
      return this.generateDefaultRecord(modelStructure.name, index, realistic, customValues);
    }
    
    const record: any = {
      _id: new mongoose.Types.ObjectId()
    };
    
    // Generating record for model
    
    // Generar valores para cada campo
    for (const field of modelStructure.fields) {
      // Omitir campos especiales que se manejan de otra forma
      if (field.name === '_id' || field.name === '__v' || field.name === 'createdAt' || field.name === 'updatedAt') {
        continue;
      }
      
      // Processing field
      
      // Si hay un valor personalizado específico para este campo, usarlo
      if (customValues[field.name]) {
        const customValueOptions = customValues[field.name];
        
        // Si es un array de opciones, seleccionar una aleatoriamente
        if (Array.isArray(customValueOptions)) {
          const randomIndex = Math.floor(Math.random() * customValueOptions.length);
          record[field.name] = customValueOptions[randomIndex];
        } else {
          // Si es un valor estático, usarlo directamente
          record[field.name] = customValueOptions;
        }
        
        continue;
      }
      
      // Generar valor según el tipo del campo
      record[field.name] = this.generateValueForField(field, index, realistic);
      // Value generated successfully
    }
    
    // Añadir timestamps
    const now = new Date();
    record.createdAt = now;
    record.updatedAt = now;
    
    return record;
  }

  /**
   * Genera un valor para un campo específico
   */
  private generateValueForField(field: any, index: number, realistic: boolean): any {
    // Si el campo no es obligatorio, ocasionalmente retornar null/undefined
    if (!field.required && Math.random() > 0.8) {
      return undefined;
    }
    
    // Si es un campo enum, seleccionar un valor de la lista
    if (field.isEnum && field.enumValues && field.enumValues.length > 0) {
      const randomIndex = Math.floor(Math.random() * field.enumValues.length);
      return field.enumValues[randomIndex];
    }
    
    // Generar valor según el tipo
    switch (field.type) {
      case 'string':
        return this.generateStringValue(field.name, index, realistic);
        
      case 'number':
        return this.generateNumberValue(field.name, index, realistic);
        
      case 'boolean':
        return Math.random() > 0.5;
        
      case 'date':
        return this.generateDateValue(field.name, realistic);
        
      case 'objectid':
        // Estos se manejarán después con el ReferenceResolver
        return new mongoose.Types.ObjectId();
        
      case 'array':
        return this.generateArrayValue(field, index, realistic);
        
      case 'object':
        return this.generateObjectValue(field.name, index, realistic);
        
      default:
        return `${field.name}_${index + 1}`;
    }
  }

  /**
   * Genera un valor de tipo string basado en el nombre del campo
   */
  private generateStringValue(fieldName: string, index: number, realistic: boolean): string {
    if (!realistic) {
      return `${fieldName}_${index + 1}`;
    }
    
    // Generar valores más realistas basados en el nombre del campo
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('name')) {
      return this.faker.person.fullName();
    } else if (lowerName.includes('first')) {
      return this.faker.person.firstName();
    } else if (lowerName.includes('last')) {
      return this.faker.person.lastName();
    } else if (lowerName.includes('email')) {
      return this.faker.internet.email();
    } else if (lowerName.includes('phone')) {
      return this.faker.phone.number();
    } else if (lowerName.includes('address')) {
      return this.faker.location.streetAddress();
    } else if (lowerName.includes('city')) {
      return this.faker.location.city();
    } else if (lowerName.includes('country')) {
      return this.faker.location.country();
    } else if (lowerName.includes('zip') || lowerName.includes('postal')) {
      return this.faker.location.zipCode();
    } else if (lowerName.includes('company')) {
      return this.faker.company.name();
    } else if (lowerName.includes('job') || lowerName.includes('position')) {
      return this.faker.person.jobTitle();
    } else if (lowerName.includes('title')) {
      return this.faker.lorem.sentence(5);
    } else if (lowerName.includes('description') || lowerName.includes('bio')) {
      return this.faker.lorem.paragraph(3);
    } else if (lowerName.includes('content')) {
      return this.faker.lorem.paragraphs(5);
    } else if (lowerName.includes('url') || lowerName.includes('website')) {
      return this.faker.internet.url();
    } else if (lowerName.includes('image') || lowerName.includes('avatar') || lowerName.includes('photo')) {
      return this.faker.image.url();
    } else if (lowerName.includes('color')) {
      return this.faker.internet.color();
    } else if (lowerName.includes('username')) {
      return this.faker.internet.userName();
    } else if (lowerName.includes('password')) {
      return this.faker.internet.password();
    } else if (lowerName.includes('comment')) {
      return this.faker.lorem.paragraph(1);
    } else if (lowerName.includes('slug')) {
      return this.faker.helpers.slugify(this.faker.lorem.words(3).toLowerCase());
    } else if (lowerName.includes('uuid') || lowerName.includes('_id')) {
      return this.faker.string.uuid();
    } else if (lowerName.includes('ip')) {
      return this.faker.internet.ip();
    } else if (lowerName.includes('locale') || lowerName.includes('lang')) {
      return this.faker.helpers.arrayElement(['es', 'en', 'fr', 'de', 'it']);
    } else {
      // Para otros campos de texto general
      return this.faker.lorem.words(3);
    }
  }

  /**
   * Genera un valor numérico basado en el nombre del campo
   */
  private generateNumberValue(fieldName: string, index: number, realistic: boolean): number {
    if (!realistic) {
      return index + 1;
    }
    
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('age')) {
      return this.faker.number.int({ min: 18, max: 90 });
    } else if (lowerName.includes('year')) {
      return this.faker.number.int({ min: 2000, max: 2030 });
    } else if (lowerName.includes('price') || lowerName.includes('cost')) {
      return parseFloat(this.faker.commerce.price());
    } else if (lowerName.includes('quantity') || lowerName.includes('count')) {
      return this.faker.number.int({ min: 1, max: 100 });
    } else if (lowerName.includes('rating')) {
      return this.faker.number.float({ min: 0, max: 5, precision: 0.1 });
    } else if (lowerName.includes('version')) {
      return this.faker.number.int({ min: 1, max: 10 });
    } else if (lowerName.includes('order')) {
      return index;
    } else if (lowerName.includes('duration')) {
      return this.faker.number.int({ min: 30, max: 180 });
    } else {
      // Valor numérico aleatorio general
      return this.faker.number.int({ min: 1, max: 1000 });
    }
  }

  /**
   * Genera un valor de tipo fecha
   */
  private generateDateValue(fieldName: string, realistic: boolean): Date {
    if (!realistic) {
      return new Date();
    }
    
    const lowerName = fieldName.toLowerCase();
    const now = new Date();
    
    if (lowerName.includes('birth')) {
      // Fecha de nacimiento (18-70 años atrás)
      return this.faker.date.birthdate();
    } else if (lowerName.includes('future') || lowerName.includes('next')) {
      // Fecha futura (próximos 90 días)
      return this.faker.date.future({ days: 90 });
    } else if (lowerName.includes('past') || lowerName.includes('prev')) {
      // Fecha pasada (últimos 90 días)
      return this.faker.date.past({ days: 90 });
    } else if (lowerName.includes('expir')) {
      // Fecha de expiración (entre 1 y 3 años en el futuro)
      return this.faker.date.future({ years: 3 });
    } else if (lowerName.includes('created')) {
      // Fecha de creación (último año)
      return this.faker.date.past({ years: 1 });
    } else if (lowerName.includes('updated')) {
      // Fecha de actualización (últimos 30 días)
      return this.faker.date.recent({ days: 30 });
    } else if (lowerName.includes('published')) {
      // Fecha de publicación (últimos 6 meses)
      return this.faker.date.past({ days: 180 });
    } else if (lowerName.includes('start')) {
      // Fecha de inicio (próximos 30 días)
      return this.faker.date.soon({ days: 30 });
    } else if (lowerName.includes('end')) {
      // Fecha de fin (próximos 60-90 días)
      const start = this.faker.date.soon({ days: 30 });
      const end = new Date(start);
      end.setDate(end.getDate() + this.faker.number.int({ min: 30, max: 60 }));
      return end;
    } else {
      // Fecha aleatoria en los últimos 2 años
      return this.faker.date.between({ from: new Date(now.getFullYear() - 2, 0, 1), to: now });
    }
  }

  /**
   * Genera un array de valores
   */
  private generateArrayValue(field: any, index: number, realistic: boolean): any[] {
    // Determinar el número de elementos
    const count = realistic ? this.faker.number.int({ min: 0, max: 5 }) : 2;
    
    const result = [];
    
    for (let i = 0; i < count; i++) {
      // Si hay información sobre el tipo de los elementos, usarla
      if (field.items && field.items.type) {
        const itemField = {
          ...field.items,
          name: field.name + 'Item',
          required: true // Para asegurar que se genera un valor
        };
        
        result.push(this.generateValueForField(itemField, index + i, realistic));
      } else {
        // Valor genérico si no hay información específica
        result.push(`${field.name}_item_${i + 1}`);
      }
    }
    
    return result;
  }

  /**
   * Genera un objeto con propiedades aleatorias
   */
  private generateObjectValue(fieldName: string, index: number, realistic: boolean): any {
    if (!realistic) {
      return { prop: `value_${index + 1}` };
    }
    
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('metadata') || lowerName.includes('meta')) {
      return {
        title: this.faker.lorem.sentence(5),
        description: this.faker.lorem.paragraph(2),
        keywords: this.faker.lorem.words(5).split(' ')
      };
    } else if (lowerName.includes('address')) {
      return {
        street: this.faker.location.streetAddress(),
        city: this.faker.location.city(),
        state: this.faker.location.state(),
        country: this.faker.location.country(),
        zipCode: this.faker.location.zipCode()
      };
    } else if (lowerName.includes('config') || lowerName.includes('settings')) {
      return {
        enabled: Math.random() > 0.5,
        theme: this.faker.helpers.arrayElement(['dark', 'light', 'auto']),
        notifications: Math.random() > 0.5
      };
    } else if (lowerName.includes('location') || lowerName.includes('coords')) {
      return {
        lat: parseFloat(this.faker.location.latitude()),
        lng: parseFloat(this.faker.location.longitude())
      };
    } else if (lowerName.includes('social')) {
      return {
        twitter: this.faker.internet.userName(),
        facebook: this.faker.internet.userName(),
        instagram: this.faker.internet.userName(),
        linkedin: this.faker.internet.userName()
      };
    } else {
      // Objeto genérico con 2-5 propiedades
      const result: any = {};
      const propCount = this.faker.number.int({ min: 2, max: 5 });
      
      for (let i = 0; i < propCount; i++) {
        const propName = `prop${i + 1}`;
        result[propName] = `value_${index}_${i + 1}`;
      }
      
      return result;
    }
  }

  /**
   * Genera un registro con campos por defecto cuando el modelStructure no tiene campos
   */
  private async generateDefaultRecord(
    modelName: string,
    index: number,
    realistic: boolean,
    customValues: Record<string, any> = {}
  ): Promise<any> {
    // Generating record with default fields
    
    // Crear un registro básico
    const record: any = {
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Campos comunes que podrían existir
    const commonFields = [
      { name: 'name', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
      { name: 'status', type: 'string', required: false, isEnum: true, enumValues: ['active', 'inactive', 'pending'] },
      { name: 'date', type: 'date', required: false },
      { name: 'user_id', type: 'objectid', required: false, isReference: true },
      { name: 'category', type: 'string', required: false },
      { name: 'tags', type: 'array', required: false },
      { name: 'price', type: 'number', required: false },
      { name: 'quantity', type: 'number', required: false },
      { name: 'published', type: 'boolean', required: false },
      { name: 'active', type: 'boolean', required: false },
      { name: 'position', type: 'number', required: false },
      { name: 'image', type: 'string', required: false },
      { name: 'url', type: 'string', required: false },
      { name: 'metadata', type: 'object', required: false }
    ];
    
    // Determinar qué campos usar basado en el nombre del modelo
    const fieldsToUse = [];
    
    // Añadir los campos básicos para todos los modelos
    fieldsToUse.push(commonFields[0]); // name
    
    // Añadir campos específicos según el tipo de modelo
    const modelNameLower = modelName.toLowerCase();
    
    if (modelNameLower.includes('user')) {
      fieldsToUse.push({ name: 'email', type: 'string', required: true });
      fieldsToUse.push({ name: 'password', type: 'string', required: true });
      fieldsToUse.push({ name: 'role', type: 'string', required: true, isEnum: true, enumValues: ['admin', 'user'] });
    }
    
    if (modelNameLower.includes('post') || modelNameLower.includes('article') || modelNameLower.includes('blog')) {
      fieldsToUse.push(commonFields[1]); // title
      fieldsToUse.push(commonFields[2]); // description
      fieldsToUse.push({ name: 'content', type: 'string', required: true });
      fieldsToUse.push({ name: 'author_id', type: 'objectid', required: true, isReference: true });
      fieldsToUse.push(commonFields[6]); // category
      fieldsToUse.push(commonFields[7]); // tags
      fieldsToUse.push({ name: 'published_at', type: 'date', required: false });
    }
    
    if (modelNameLower.includes('product')) {
      fieldsToUse.push(commonFields[2]); // description
      fieldsToUse.push(commonFields[8]); // price
      fieldsToUse.push(commonFields[9]); // quantity
      fieldsToUse.push(commonFields[6]); // category
      fieldsToUse.push({ name: 'sku', type: 'string', required: true });
    }
    
    if (modelNameLower.includes('order')) {
      fieldsToUse.push({ name: 'customer_id', type: 'objectid', required: true, isReference: true });
      fieldsToUse.push({ name: 'order_date', type: 'date', required: true });
      fieldsToUse.push({ name: 'total', type: 'number', required: true });
      fieldsToUse.push({ name: 'status', type: 'string', required: true, isEnum: true, enumValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] });
    }
    
    if (modelNameLower.includes('comment')) {
      fieldsToUse.push({ name: 'content', type: 'string', required: true });
      fieldsToUse.push({ name: 'author_id', type: 'objectid', required: true, isReference: true });
      fieldsToUse.push({ name: 'post_id', type: 'objectid', required: true, isReference: true });
    }
    
    if (modelNameLower.includes('category')) {
      fieldsToUse.push(commonFields[1]); // title
      fieldsToUse.push(commonFields[2]); // description
      fieldsToUse.push({ name: 'slug', type: 'string', required: true });
      fieldsToUse.push({ name: 'parent_id', type: 'objectid', required: false, isReference: true });
    }
    
    if (modelNameLower.includes('media') || modelNameLower.includes('file') || modelNameLower.includes('image')) {
      fieldsToUse.push({ name: 'filename', type: 'string', required: true });
      fieldsToUse.push({ name: 'mimetype', type: 'string', required: true });
      fieldsToUse.push({ name: 'size', type: 'number', required: true });
      fieldsToUse.push({ name: 'path', type: 'string', required: true });
      fieldsToUse.push({ name: 'uploader_id', type: 'objectid', required: false, isReference: true });
    }
    
    if (modelNameLower.includes('settings')) {
      fieldsToUse.push({ name: 'site_name', type: 'string', required: true });
      fieldsToUse.push({ name: 'site_description', type: 'string', required: false });
      fieldsToUse.push({ name: 'theme', type: 'string', required: false });
      fieldsToUse.push({ name: 'maintenance_mode', type: 'boolean', required: false });
    }
    
    // Si no hay campos específicos, usar campos genéricos
    if (fieldsToUse.length <= 1) {
      // name ya está incluido, agregar 3 campos genéricos más
      fieldsToUse.push(commonFields[2]); // description
      fieldsToUse.push(commonFields[3]); // status
      fieldsToUse.push(commonFields[10]); // published
    }
    
    // Recorrer los campos y generar valores
    for (const field of fieldsToUse) {
      // Si hay un valor personalizado específico para este campo, usarlo
      if (customValues[field.name]) {
        const customValueOptions = customValues[field.name];
        
        if (Array.isArray(customValueOptions)) {
          const randomIndex = Math.floor(Math.random() * customValueOptions.length);
          record[field.name] = customValueOptions[randomIndex];
        } else {
          record[field.name] = customValueOptions;
        }
        continue;
      }
      
      // Generar valor para el campo
      record[field.name] = this.generateValueForField(field, index, realistic);
    }
    
    // Record generated with default fields
    return record;
  }
} 