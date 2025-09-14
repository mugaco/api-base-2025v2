/**
 * Interfaz para el contexto de solicitud basado en req
 */
export interface IRequestContext {
  /**
   * Identificador único de la transacción
   */
  transactionId: string;
  
  /**
   * Información del usuario actual (si está autenticado)
   */
  user?: {
    _id: string;
    role: string;
    [key: string]: unknown;
  };
  
  /**
   * Timestamp de inicio de la solicitud
   */
  startTime: number;
  
  /**
   * Datos adicionales del contexto de la transacción
   */
  transactionData: Record<string, unknown>;

  /**
   * Metadatos de la solicitud
   */
  metadata: Record<string, unknown>;
  
  /**
   * Añade datos al contexto de la transacción actual
   * @param key Clave para los datos
   * @param value Valor a almacenar
   */
  addTransactionData(key: string, value: unknown): void;

  /**
   * Establece la información del usuario en el contexto actual
   * @param userId ID del usuario
   * @param role Rol del usuario
   * @param additionalData Datos adicionales del usuario
   */
  setUser(userId: string, role: string, additionalData?: Record<string, unknown>): void;
}

// Exportar para que otros módulos puedan usar la interfaz
export {}; 