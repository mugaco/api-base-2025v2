/**
 * Estrategia de generación para campos de tipo string
 */
import { ValueGenerationStrategy, GenerationContext } from '../../interfaces/GenerationStrategy';
import { FieldDefinition } from '../../interfaces/AnalysisStrategy';

export class StringGenerationStrategy implements ValueGenerationStrategy {
  readonly name = 'StringGenerationStrategy';
  readonly priority = 10; // Prioridad estándar

  /**
   * Determina si esta estrategia puede generar un valor para este campo
   */
  canGenerate(field: FieldDefinition, _context: GenerationContext): boolean {
    return field.type === 'string';
  }

  /**
   * Genera un valor para el campo
   */
  generateValue(field: FieldDefinition, context: GenerationContext): string {
    // Si no es realista, generar valores simples como "field_1", "field_2", etc.
    if (!context.realistic) {
      return `${field.name}_${context.index + 1}`;
    }

    const lowerName = field.name.toLowerCase();
    
    // Usar la descripción o nombre para generar valores más realistas
    if (field.isEnum && field.enumValues && field.enumValues.length > 0) {
      // Si es un enum, seleccionar un valor aleatorio
      const randomIndex = Math.floor(Math.random() * field.enumValues.length);
      return field.enumValues[randomIndex];
    }

    // Generar valor basado en el nombre o descripción del campo
    if (lowerName.includes('name') || lowerName.includes('nombre')) {
      return context.faker.person.fullName();
    } else if (lowerName.includes('email') || lowerName.includes('correo')) {
      return context.faker.internet.email();
    } else if (lowerName.includes('password') || lowerName.includes('contraseña') || lowerName.includes('pwd')) {
      return context.faker.internet.password({ length: 10 });
    } else if (lowerName.includes('phone') || lowerName.includes('telefono') || lowerName.includes('tel')) {
      return context.faker.phone.number();
    } else if (lowerName.includes('address') || lowerName.includes('direccion')) {
      return context.faker.location.streetAddress();
    } else if (lowerName.includes('city') || lowerName.includes('ciudad')) {
      return context.faker.location.city();
    } else if (lowerName.includes('country') || lowerName.includes('pais')) {
      return context.faker.location.country();
    } else if (lowerName.includes('zip') || lowerName.includes('postal') || lowerName.includes('codigo_postal')) {
      return context.faker.location.zipCode();
    } else if (lowerName.includes('company') || lowerName.includes('empresa') || lowerName.includes('compañia')) {
      return context.faker.company.name();
    } else if (lowerName.includes('job') || lowerName.includes('position') || lowerName.includes('puesto') || lowerName.includes('cargo')) {
      return context.faker.person.jobTitle();
    } else if (lowerName.includes('title') || lowerName.includes('titulo')) {
      return context.faker.lorem.sentence(5);
    } else if (lowerName.includes('description') || lowerName.includes('descripcion') || lowerName.includes('desc') || lowerName.includes('bio')) {
      return context.faker.lorem.paragraph(3);
    } else if (lowerName.includes('content') || lowerName.includes('contenido') || lowerName.includes('text') || lowerName.includes('texto')) {
      return context.faker.lorem.paragraphs(3);
    } else if (lowerName.includes('url') || lowerName.includes('website') || lowerName.includes('site') || lowerName.includes('web')) {
      return context.faker.internet.url();
    } else if (lowerName.includes('image') || lowerName.includes('imagen') || lowerName.includes('photo') || lowerName.includes('foto')) {
      return context.faker.image.url();
    } else if (lowerName.includes('color')) {
      return context.faker.color.rgb();
    } else if (lowerName.includes('username') || lowerName.includes('user') || lowerName.includes('usuario')) {
      return context.faker.internet.userName();
    } else if (lowerName.includes('id') || lowerName.includes('key') || lowerName.includes('code')) {
      return context.faker.string.uuid();
    } else if (lowerName.includes('comment') || lowerName.includes('comentario')) {
      return context.faker.lorem.sentences(2);
    } else if (lowerName.includes('status') || lowerName.includes('estado')) {
      return context.faker.helpers.arrayElement(['active', 'inactive', 'pending', 'completed']);
    } else if (lowerName.includes('category') || lowerName.includes('categoria')) {
      return context.faker.commerce.department();
    } else if (lowerName.includes('tag') || lowerName.includes('etiqueta')) {
      return context.faker.lorem.word();
    } else if (lowerName.includes('product') || lowerName.includes('producto')) {
      return context.faker.commerce.productName();
    } else if (lowerName.includes('slug')) {
      // Generar un slug basado en el nombre del modelo
      const words = context.faker.lorem.words(3);
      return words.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Para cualquier otro campo, generar un texto aleatorio basado en el nombre del campo
    return context.faker.lorem.words(2);
  }
} 