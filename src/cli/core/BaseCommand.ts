/**
 * Clase base para todos los comandos
 */
import { Command, CommandOption, CommandOptions } from '../interfaces/CommandInterface';
import { ConsoleService } from '../interfaces/IOInterface';
import { PromptService } from '../interfaces/IOInterface';
import { CLIError } from './CLIError';

/**
 * Clase base abstracta para todos los comandos
 */
export abstract class BaseCommand implements Command {
  /**
   * Constructor de la clase
   * @param name Nombre del comando
   * @param description Descripción del comando
   * @param consoleService Servicio de consola
   * @param promptService Servicio de entrada interactiva
   */
  constructor(
    protected readonly name: string,
    protected readonly description: string,
    protected readonly consoleService: ConsoleService,
    protected readonly promptService: PromptService
  ) {}

  /**
   * Obtiene el nombre del comando
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Obtiene la descripción del comando
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Obtiene las opciones del comando
   * Debe ser implementado por las clases hijas
   */
  public abstract getOptions(): CommandOption[];

  /**
   * Ejecuta el comando con las opciones especificadas
   * @param options Opciones del comando
   */
  public async execute(options: CommandOptions): Promise<void> {
    try {
      this.consoleService.info(`Ejecutando comando: ${this.name}`);
      await this.run(options);
      this.consoleService.success(`Comando ${this.name} ejecutado correctamente`);
    } catch (error) {
      // Transformar el error a CLIError si no lo es ya
      const cliError = error instanceof CLIError 
        ? error 
        : new CLIError(this.name, 'Error de ejecución', error);
      
      this.consoleService.error(cliError.message);
      throw cliError;
    }
  }

  /**
   * Método que debe ser implementado por las clases hijas para ejecutar la lógica del comando
   * @param options Opciones del comando
   */
  protected abstract run(options: CommandOptions): Promise<void>;

  /**
   * Método auxiliar para validar que una opción requerida esté presente
   * @param options Opciones del comando
   * @param optionName Nombre de la opción
   * @param message Mensaje de error personalizado
   */
  protected validateRequiredOption(options: CommandOptions, optionName: string, message?: string): void {
    if (options[optionName] === undefined) {
      throw new CLIError(this.name, message || `La opción '${optionName}' es requerida`);
    }
  }

  /**
   * Método auxiliar para obtener una opción con un valor por defecto
   * @param options Opciones del comando
   * @param optionName Nombre de la opción
   * @param defaultValue Valor por defecto si la opción no está presente
   */
  protected getOption<T>(options: CommandOptions, optionName: string, defaultValue: T): T {
    return options[optionName] !== undefined ? (options[optionName] as T) : defaultValue;
  }
} 