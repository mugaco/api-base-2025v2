/**
 * Servicio para interacción con la consola
 */
import { ConsoleOptions, ConsoleService } from '../interfaces/IOInterface';

/**
 * Códigos de color ANSI para la consola
 */
const COLORS = {
  reset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
};

/**
 * Íconos predefinidos para mensajes
 */
const ICONS = {
  info: 'ℹ️ ',
  success: '✅ ',
  warning: '⚠️ ',
  error: '❌ ',
  debug: '🔍 ',
  log: '  ',
};

/**
 * Implementación del servicio de consola
 */
export class DefaultConsoleService implements ConsoleService {
  /**
   * Indica si el servicio está en modo silencioso (no muestra mensajes)
   */
  private isSilent: boolean = false;

  /**
   * Indica si el servicio está en modo debug
   */
  private isDebugMode: boolean = false;

  /**
   * Constructor
   * @param options Opciones de configuración
   */
  constructor(options?: { silent?: boolean; debug?: boolean }) {
    this.isSilent = options?.silent || false;
    this.isDebugMode = options?.debug || false;
  }

  /**
   * Activa o desactiva el modo silencioso
   */
  public setSilent(silent: boolean): void {
    this.isSilent = silent;
  }

  /**
   * Activa o desactiva el modo debug
   */
  public setDebugMode(debug: boolean): void {
    this.isDebugMode = debug;
  }

  /**
   * Muestra un mensaje informativo
   */
  public info(message: string, options?: ConsoleOptions): void {
    if (this.isSilent) return;
    
    this.print(message, {
      color: 'blue',
      icon: ICONS.info,
      ...options,
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  public success(message: string, options?: ConsoleOptions): void {
    if (this.isSilent) return;
    
    this.print(message, {
      color: 'green',
      icon: ICONS.success,
      ...options,
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  public warn(message: string, options?: ConsoleOptions): void {
    if (this.isSilent) return;
    
    this.print(message, {
      color: 'yellow',
      icon: ICONS.warning,
      ...options,
    });
  }

  /**
   * Muestra un mensaje de error
   */
  public error(message: string, options?: ConsoleOptions): void {
    if (this.isSilent) return;
    
    this.print(message, {
      color: 'red',
      icon: ICONS.error,
      ...options,
    });
  }

  /**
   * Muestra un mensaje de depuración
   */
  public debug(message: string, options?: ConsoleOptions): void {
    if (this.isSilent || !this.isDebugMode) return;
    
    this.print(message, {
      color: 'gray',
      icon: ICONS.debug,
      ...options,
    });
  }

  /**
   * Muestra un mensaje normal
   */
  public log(message: string, options?: ConsoleOptions): void {
    if (this.isSilent) return;
    
    this.print(message, {
      icon: ICONS.log,
      ...options,
    });
  }

  /**
   * Método auxiliar para dar formato y mostrar el mensaje en consola
   */
  private print(message: string, options: ConsoleOptions): void {
    let formattedMessage = '';
    
    // Agregar icono
    if (options.icon) {
      formattedMessage += options.icon;
    }
    
    // Aplicar color y estilo
    if (options.color && COLORS[options.color]) {
      formattedMessage += COLORS[options.color];
    }
    
    if (options.style && COLORS[options.style]) {
      formattedMessage += COLORS[options.style];
    }
    
    // Agregar mensaje
    formattedMessage += message;
    
    // Resetear formato
    formattedMessage += COLORS.reset;
    
    // Imprimir mensaje
    // eslint-disable-next-line no-console
    console.log(formattedMessage);
  }
} 