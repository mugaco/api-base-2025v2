/**
 * Registro de estrategias de generación
 */
import { ValueGenerationStrategy, GenerationContext } from './interfaces/GenerationStrategy';
import { FieldDefinition } from './interfaces/AnalysisStrategy';
import { StringGenerationStrategy } from './strategies/generation/StringGenerationStrategy';
import { NumberGenerationStrategy } from './strategies/generation/NumberGenerationStrategy';
import mongoose from 'mongoose';

/**
 * Clase para gestionar las estrategias de generación de valores
 */
export class GenerationStrategyRegistry {
  private strategies: ValueGenerationStrategy[] = [];

  /**
   * Constructor
   */
  constructor() {
    // Registrar estrategias predeterminadas
    this.registerDefaultStrategies();
  }

  /**
   * Registra las estrategias predeterminadas
   */
  private registerDefaultStrategies(): void {
    // Registrar estrategias para tipos básicos
    this.strategies.push(new StringGenerationStrategy());
    this.strategies.push(new NumberGenerationStrategy());
    
    // Estrategia para booleanos (inline)
    this.strategies.push({
      name: 'BooleanGenerationStrategy',
      priority: 10,
      canGenerate: (field) => field.type === 'boolean',
      generateValue: (field, context) => {
        // Si no es realista, alternar true/false basado en el índice
        if (!context.realistic) {
          return context.index % 2 === 0;
        }
        // Generar un valor booleano aleatorio
        return Math.random() > 0.5;
      }
    });
    
    // Estrategia para fechas (inline)
    this.strategies.push({
      name: 'DateGenerationStrategy',
      priority: 10,
      canGenerate: (field) => field.type === 'date',
      generateValue: (field, context) => {
        const lowerName = field.name.toLowerCase();
        
        // Generar fechas específicas basadas en el nombre del campo
        if (lowerName.includes('birth') || lowerName.includes('nacimiento')) {
          // Fecha de nacimiento (entre 18 y 80 años atrás)
          return context.faker.date.birthdate();
        } else if (lowerName.includes('created') || lowerName.includes('creacion') || lowerName.includes('start')) {
          // Fecha de creación (en los últimos 6 meses)
          return context.faker.date.recent({ days: 180 });
        } else if (lowerName.includes('updated') || lowerName.includes('modificacion') || lowerName.includes('modified')) {
          // Fecha de actualización (en el último mes)
          return context.faker.date.recent({ days: 30 });
        } else if (lowerName.includes('expiry') || lowerName.includes('expiracion') || lowerName.includes('end')) {
          // Fecha de expiración (en los próximos 6 meses)
          return context.faker.date.future({ years: 0.5 });
        } else if (lowerName.includes('future') || lowerName.includes('futuro')) {
          // Fecha futura (en los próximos 2 años)
          return context.faker.date.future({ years: 2 });
        }
        
        // Para cualquier otro campo de fecha, generar una fecha reciente
        return context.faker.date.recent({ days: 90 });
      }
    });
    
    // Estrategia para ObjectId (inline)
    this.strategies.push({
      name: 'ObjectIdGenerationStrategy',
      priority: 10,
      canGenerate: (field) => field.type === 'objectid',
      generateValue: () => {
        // Generar un nuevo ObjectId
        return new mongoose.Types.ObjectId();
      }
    });
    
    // Estrategia para arrays (inline)
    this.strategies.push({
      name: 'ArrayGenerationStrategy',
      priority: 10,
      canGenerate: (field) => field.type === 'array' || field.isArray === true,
      generateValue: (field, context) => {
        // Determinar la cantidad de elementos a generar (entre 1 y 5)
        const count = context.faker.number.int({ min: 1, max: 5 });
        const result = [];
        
        // Generar elementos simples para el array
        for (let i = 0; i < count; i++) {
          const lowerName = field.name.toLowerCase();
          
          if (lowerName.includes('tag') || lowerName.includes('etiqueta')) {
            result.push(context.faker.lorem.word());
          } else if (lowerName.includes('category') || lowerName.includes('categoria')) {
            result.push(context.faker.commerce.department());
          } else if (lowerName.includes('image') || lowerName.includes('imagen') || lowerName.includes('photo')) {
            result.push(context.faker.image.url());
          } else if (lowerName.includes('url') || lowerName.includes('link')) {
            result.push(context.faker.internet.url());
          } else if (lowerName.includes('name') || lowerName.includes('nombre')) {
            result.push(context.faker.person.fullName());
          } else if (lowerName.includes('color')) {
            result.push(context.faker.color.rgb());
          } else {
            // Valor por defecto
            result.push(`item_${i + 1}`);
          }
        }
        
        return result;
      }
    });
    
    // Estrategia para objetos (inline)
    this.strategies.push({
      name: 'ObjectGenerationStrategy',
      priority: 10,
      canGenerate: (field) => field.type === 'object',
      generateValue: (field, context) => {
        const lowerName = field.name.toLowerCase();
        
        // Generar objetos específicos basados en el nombre del campo
        if (lowerName.includes('metadata') || lowerName.includes('meta')) {
          return {
            title: context.faker.lorem.sentence(5),
            description: context.faker.lorem.paragraph(2),
            keywords: context.faker.lorem.words(5).split(' ')
          };
        } else if (lowerName.includes('address') || lowerName.includes('direccion')) {
          return {
            street: context.faker.location.streetAddress(),
            city: context.faker.location.city(),
            state: context.faker.location.state(),
            country: context.faker.location.country(),
            zipCode: context.faker.location.zipCode()
          };
        } else if (lowerName.includes('config') || lowerName.includes('settings') || lowerName.includes('configuracion')) {
          return {
            enabled: Math.random() > 0.5,
            theme: context.faker.helpers.arrayElement(['dark', 'light', 'auto']),
            notifications: Math.random() > 0.5
          };
        } else if (lowerName.includes('location') || lowerName.includes('coords') || lowerName.includes('ubicacion')) {
          return {
            lat: Number(context.faker.location.latitude()),
            lng: Number(context.faker.location.longitude())
          };
        } else if (lowerName.includes('social')) {
          return {
            twitter: context.faker.internet.userName(),
            facebook: context.faker.internet.userName(),
            instagram: context.faker.internet.userName(),
            linkedin: context.faker.internet.userName()
          };
        }
        
        // Objeto genérico con 2-5 propiedades
        const result: Record<string, any> = {};
        const propCount = context.faker.number.int({ min: 2, max: 5 });
        
        for (let i = 0; i < propCount; i++) {
          const propName = `prop${i + 1}`;
          result[propName] = `value_${context.index}_${i + 1}`;
        }
        
        return result;
      }
    });
  }

  /**
   * Registra una nueva estrategia
   */
  public registerStrategy(strategy: ValueGenerationStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Genera un valor para un campo usando la estrategia más adecuada
   */
  public generateValue(field: FieldDefinition, context: GenerationContext): any {
    // Si el campo no es obligatorio, ocasionalmente retornar undefined
    if (!field.required && Math.random() > 0.8) {
      return undefined;
    }
    
    // Verificar si hay un valor personalizado para este campo en el contexto
    if (context.customValues && context.customValues[field.name]) {
      const customValue = context.customValues[field.name];
      
      // Si es un array de opciones, seleccionar una aleatoriamente
      if (Array.isArray(customValue)) {
        const randomIndex = Math.floor(Math.random() * customValue.length);
        return customValue[randomIndex];
      }
      
      // Devolver el valor personalizado directamente
      return customValue;
    }
    
    // Ordenar estrategias por prioridad (mayor primero)
    const sortedStrategies = [...this.strategies].sort((a, b) => b.priority - a.priority);
    
    // Encontrar la primera estrategia que puede generar un valor para este campo
    for (const strategy of sortedStrategies) {
      if (strategy.canGenerate(field, context)) {
        // Generating value with strategy
        return strategy.generateValue(field, context);
      }
    }
    
    // Si no se encontró ninguna estrategia, devolver un valor predeterminado
    // eslint-disable-next-line no-console
    console.warn(`No se encontró una estrategia para generar valor para el campo ${field.name} de tipo ${field.type}`);
    return `${field.name}_${context.index + 1}`;
  }
}