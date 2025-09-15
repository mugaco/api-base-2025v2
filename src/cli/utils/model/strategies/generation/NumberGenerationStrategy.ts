/**
 * Estrategia de generación para campos de tipo number
 */
import { ValueGenerationStrategy, GenerationContext } from '../../interfaces/GenerationStrategy';
import { FieldDefinition } from '../../interfaces/AnalysisStrategy';

export class NumberGenerationStrategy implements ValueGenerationStrategy {
  readonly name = 'NumberGenerationStrategy';
  readonly priority = 10; // Prioridad estándar

  /**
   * Determina si esta estrategia puede generar un valor para este campo
   */
  canGenerate(field: FieldDefinition, _context: GenerationContext): boolean {
    return field.type === 'number';
  }

  /**
   * Genera un valor para el campo
   */
  generateValue(field: FieldDefinition, context: GenerationContext): number {
    // Si no es realista, simplemente usar el índice más 1
    if (!context.realistic) {
      return context.index + 1;
    }

    const lowerName = field.name.toLowerCase();
    
    // Generar valores específicos basados en el nombre del campo
    if (lowerName.includes('age') || lowerName.includes('edad')) {
      return context.faker.number.int({ min: 18, max: 90 });
    } else if (lowerName.includes('year') || lowerName.includes('año')) {
      return context.faker.number.int({ min: 2000, max: 2030 });
    } else if (lowerName.includes('price') || lowerName.includes('precio') || lowerName.includes('cost') || lowerName.includes('costo')) {
      return parseFloat(context.faker.commerce.price());
    } else if (lowerName.includes('quantity') || lowerName.includes('cantidad') || lowerName.includes('qty') || lowerName.includes('count') || lowerName.includes('numero')) {
      return context.faker.number.int({ min: 1, max: 100 });
    } else if (lowerName.includes('rating') || lowerName.includes('calificacion') || lowerName.includes('rate') || lowerName.includes('nivel')) {
      return context.faker.number.float({ min: 0, max: 5, fractionDigits: 1 });
    } else if (lowerName.includes('version')) {
      return context.faker.number.float({ min: 1, max: 10, fractionDigits: 1 });
    } else if (lowerName.includes('order') || lowerName.includes('position') || lowerName.includes('posicion') || lowerName.includes('orden')) {
      return context.index;
    } else if (lowerName.includes('duration') || lowerName.includes('duracion') || lowerName.includes('tiempo')) {
      return context.faker.number.int({ min: 30, max: 180 });
    } else if (lowerName.includes('score') || lowerName.includes('points') || lowerName.includes('puntos') || lowerName.includes('puntaje')) {
      return context.faker.number.int({ min: 0, max: 1000 });
    } else if (lowerName.includes('height') || lowerName.includes('altura')) {
      return context.faker.number.int({ min: 150, max: 200 });
    } else if (lowerName.includes('width') || lowerName.includes('ancho')) {
      return context.faker.number.int({ min: 100, max: 500 });
    } else if (lowerName.includes('weight') || lowerName.includes('peso')) {
      return context.faker.number.float({ min: 50, max: 100, fractionDigits: 1 });
    } else if (lowerName.includes('discount') || lowerName.includes('descuento')) {
      return context.faker.number.int({ min: 5, max: 50 });
    } else if (lowerName.includes('percentage') || lowerName.includes('porcentaje')) {
      return context.faker.number.int({ min: 0, max: 100 });
    } else if (lowerName.includes('stock') || lowerName.includes('inventory') || lowerName.includes('inventario')) {
      return context.faker.number.int({ min: 0, max: 1000 });
    }
    
    // Para cualquier otro campo numérico, generar un valor aleatorio
    return context.faker.number.int({ min: 1, max: 1000 });
  }
} 