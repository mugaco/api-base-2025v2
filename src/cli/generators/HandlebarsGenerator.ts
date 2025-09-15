/**
 * Generador de código basado en Handlebars
 */
import Handlebars from 'handlebars';
import { BaseGenerator } from './BaseGenerator';
import { TemplateProvider } from '../interfaces/GeneratorInterface';
import { FileSystemService, ConsoleService } from '../interfaces/IOInterface';

/**
 * Implementación de generador de código usando Handlebars
 */
export class HandlebarsGenerator extends BaseGenerator {
  /**
   * Caché de plantillas compiladas
   */
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Constructor de la clase
   * @param templateProvider Proveedor de plantillas
   * @param fileSystem Servicio de sistema de archivos
   * @param console Servicio de consola
   */
  constructor(
    templateProvider: TemplateProvider,
    fileSystem: FileSystemService,
    console: ConsoleService
  ) {
    super(templateProvider, fileSystem, console);
    
    // Registrar ayudantes (helpers) por defecto
    this.registerDefaultHelpers();
  }

  /**
   * Verifica si el generador puede manejar un tipo de plantilla
   * @param templateName Nombre de la plantilla
   */
  public canHandle(_templateName: string): boolean {
    // Este generador puede manejar cualquier plantilla
    return true;
  }

  /**
   * Registra un ayudante (helper) personalizado de Handlebars
   * @param name Nombre del ayudante
   * @param fn Función del ayudante
   */
  public registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn);
  }

  /**
   * Registra un ayudante de bloque (block helper) personalizado de Handlebars
   * @param name Nombre del ayudante
   * @param fn Función del ayudante
   */
  public registerBlockHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn);
  }

  /**
   * Registra una parcial (partial) de Handlebars
   * @param name Nombre de la parcial
   * @param template Contenido de la parcial
   */
  public registerPartial(name: string, template: string): void {
    Handlebars.registerPartial(name, template);
  }

  /**
   * Compila una plantilla con los datos proporcionados
   * @param template Contenido de la plantilla
   * @param data Datos para la compilación
   */
  protected compile(template: string, data: Record<string, unknown>): string {
    try {
      // Compilar la plantilla si no está en caché
      let compiledTemplate = this.compiledTemplates.get(template);
      
      if (!compiledTemplate) {
        compiledTemplate = Handlebars.compile(template);
        this.compiledTemplates.set(template, compiledTemplate);
      }
      
      // Ejecutar la plantilla con los datos
      return compiledTemplate(data);
    } catch (error) {
      throw new Error(`Error al compilar plantilla: ${(error as Error).message}`);
    }
  }

  /**
   * Registra los ayudantes por defecto de Handlebars
   */
  private registerDefaultHelpers(): void {
    // Convertir a mayúsculas
    Handlebars.registerHelper('uppercase', (text) => {
      return typeof text === 'string' ? text.toUpperCase() : text;
    });

    // Convertir a minúsculas
    Handlebars.registerHelper('lowercase', (text) => {
      return typeof text === 'string' ? text.toLowerCase() : text;
    });

    // Convertir a camelCase
    Handlebars.registerHelper('camelCase', (text) => {
      if (typeof text !== 'string') return text;
      return text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (Number(match) === 0) return '';
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      }).replace(/[^a-zA-Z0-9]+/g, '');
    });

    // Convertir a PascalCase
    Handlebars.registerHelper('pascalCase', (text) => {
      if (typeof text !== 'string') return text;
      return text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, _index) => {
        if (Number(match) === 0) return '';
        return match.toUpperCase();
      }).replace(/[^a-zA-Z0-9]+/g, '');
    });

    // Convertir a snake_case
    Handlebars.registerHelper('snakeCase', (text) => {
      if (typeof text !== 'string') return text;
      return text.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    });

    // Convertir a kebab-case
    Handlebars.registerHelper('kebabCase', (text) => {
      if (typeof text !== 'string') return text;
      return text.replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    });

    // Pluralizar
    Handlebars.registerHelper('pluralize', (text) => {
      if (typeof text !== 'string') return text;
      
      // Reglas básicas de pluralización en inglés
      if (text.endsWith('y')) {
        return text.slice(0, -1) + 'ies';
      } else if (text.endsWith('s') || text.endsWith('x') || text.endsWith('z')) {
        return text + 'es';
      } else {
        return text + 's';
      }
    });

    // Condicional igual
    Handlebars.registerHelper('eq', function(this: Handlebars.HelperOptions['data'], a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    // Condicional distinto
    Handlebars.registerHelper('ne', function(this: Handlebars.HelperOptions['data'], a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a !== b ? options.fn(this) : options.inverse(this);
    });

    // Formatear fecha
    Handlebars.registerHelper('formatDate', (date, _format) => {
      if (!date) return '';
      
      const d = new Date(date);
      
      // Formato simple: YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    });

    // Concatenar strings
    Handlebars.registerHelper('concat', (...args) => {
      // Eliminar el último argumento (options)
      args.pop();
      return args.join('');
    });
  }
} 