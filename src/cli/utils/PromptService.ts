/**
 * Servicio para entrada interactiva en la consola
 */
import inquirer from 'inquirer';
import { PromptOptions, PromptService } from '../interfaces/IOInterface';

// Interfaz extendida para opciones de prompt con validación
interface ExtendedPromptOptions {
  required?: boolean;
  validator?: (input: string) => boolean | string | Promise<boolean | string>;
}

/**
 * Implementación del servicio de entrada interactiva utilizando inquirer
 */
export class InquirerPromptService implements PromptService {
  /**
   * Solicita un valor de entrada
   * @param options Opciones de la pregunta
   */
  public async prompt<T = unknown>(options: PromptOptions): Promise<T> {
    try {
      // Adaptar las opciones al formato esperado por inquirer
      const question = this.adaptOptions('value', options);
      
      // Realizar la pregunta
      const response = await inquirer.prompt([question]);
      
      // Devolver el valor de la respuesta
      return response.value as T;
    } catch (error) {
      throw new Error(`Error al solicitar entrada: ${(error as Error).message}`);
    }
  }

  /**
   * Solicita múltiples valores de entrada
   * @param questions Lista de preguntas
   */
  public async promptMany<T = Record<string, unknown>>(
    questions: Array<PromptOptions & { name: string }>
  ): Promise<T> {
    try {
      // Adaptar las preguntas al formato esperado por inquirer
      const inquirerQuestions = questions.map(q => this.adaptOptions(q.name, q));
      
      // Realizar las preguntas
      const response = await inquirer.prompt(inquirerQuestions);
      
      // Devolver las respuestas
      return response as T;
    } catch (error) {
      throw new Error(`Error al solicitar múltiples entradas: ${(error as Error).message}`);
    }
  }

  /**
   * Método para seleccionar un elemento de una lista
   * @param message Mensaje de la pregunta
   * @param choices Opciones disponibles
   * @param defaultValue Valor por defecto
   */
  public async promptSelect<T extends string | number | boolean = string>(
    message: string,
    choices: Array<{ name: string; value: T; checked?: boolean }>,
    defaultValue?: T
  ): Promise<T> {
    return this.prompt<T>({
      type: 'list',
      message,
      choices,
      default: defaultValue,
    });
  }

  /**
   * Método para seleccionar múltiples elementos de una lista
   * @param message Mensaje de la pregunta
   * @param choices Opciones disponibles
   */
  public async promptCheckbox<T = string[]>(
    message: string,
    choices: Array<{ name: string; value: string | number | boolean; checked?: boolean }>
  ): Promise<T> {
    return this.prompt<T>({
      type: 'checkbox',
      message,
      choices,
    });
  }

  /**
   * Método para solicitar confirmación (sí/no)
   * @param message Mensaje de la pregunta
   * @param defaultValue Valor por defecto
   */
  public async promptConfirm(message: string, defaultValue: boolean = false): Promise<boolean> {
    return this.prompt<boolean>({
      type: 'confirm',
      message,
      default: defaultValue,
    });
  }

  /**
   * Método para solicitar entrada de texto
   * @param message Mensaje de la pregunta
   * @param options Opciones adicionales (valor por defecto, validación, etc.)
   */
  public async promptInput(
    message: string, 
    options?: ExtendedPromptOptions & { default?: string }
  ): Promise<string> {
    const validateFn = this.createValidator(options);
    
    return this.prompt<string>({
      type: 'input',
      message,
      default: options?.default,
      validate: validateFn,
    });
  }

  /**
   * Método para solicitar entrada de texto oculto (contraseña)
   * @param message Mensaje de la pregunta
   * @param options Opciones adicionales (validación, etc.)
   */
  public async promptPassword(
    message: string,
    options?: ExtendedPromptOptions
  ): Promise<string> {
    const validateFn = this.createValidator(options);
    
    return this.prompt<string>({
      type: 'password',
      message,
      validate: validateFn,
    });
  }

  /**
   * Crea una función de validación basada en las opciones proporcionadas
   */
  private createValidator(options?: ExtendedPromptOptions): ((input: string) => boolean | string | Promise<boolean | string>) | undefined {
    if (!options) return undefined;
    
    return (input: string) => {
      // Validar si es requerido
      if (options.required && !input.trim()) {
        return 'Este campo es obligatorio';
      }
      
      // Aplicar validador personalizado si existe
      if (options.validator) {
        return options.validator(input);
      }
      
      return true;
    };
  }

  /**
   * Adapta las opciones de nuestra interfaz al formato esperado por inquirer
   * @param name Nombre de la pregunta
   * @param options Opciones de la pregunta
   */
  private adaptOptions(name: string, options: PromptOptions): inquirer.QuestionCollection {
    // Mapear propiedades a formato inquirer
    return {
      name,
      type: options.type,
      message: options.message,
      default: options.default,
      choices: options.choices,
      validate: options.validate,
      filter: options.transform,
      when: options.when,
    };
  }
} 