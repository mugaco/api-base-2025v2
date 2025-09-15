/**
 * Error personalizado para el CLI
 * Proporciona una estructura consistente para los errores en toda la aplicación
 */
export class CLIError extends Error {
  /**
   * Constructor del error
   * @param context Contexto donde ocurrió el error (comando, módulo, etc.)
   * @param message Mensaje de error específico
   * @param originalError Error original si existe
   */
  constructor(
    private readonly context: string,
    message: string,
    public readonly originalError?: Error | unknown
  ) {
    // Crear mensaje formateado que incluye el contexto
    const formattedMessage = `[${context}] ${message}${
      originalError instanceof Error 
        ? `: ${originalError.message}` 
        : originalError 
          ? `: ${String(originalError)}` 
          : ''
    }`;
    
    super(formattedMessage);
    
    // Preservar el nombre correcto de la clase para instanceof
    this.name = 'CLIError';
    
    // Capturar la traza de la pila si es posible
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }

  /**
   * Obtiene el contexto del error
   */
  public getContext(): string {
    return this.context;
  }

  /**
   * Obtiene el error original
   */
  public getOriginalError(): Error | unknown | undefined {
    return this.originalError;
  }
} 