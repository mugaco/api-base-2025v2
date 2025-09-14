/**
 * Interfaz para un listener de eventos
 * @template T Tipo de datos del evento
 */
export interface IEventListener<T = unknown> {
  /**
   * Método que maneja el evento
   * @param data Datos del evento
   * @param context Contexto del evento con métodos útiles
   * @returns Puede devolver una promesa o void. Si devuelve false, se cancela la propagación
   */
  handle(data: T, context: EventContext): Promise<void | boolean> | void | boolean;
  
  /**
   * Prioridad del listener (mayor número = mayor prioridad)
   * Los listeners se ejecutan en orden descendente de prioridad
   * @default 0
   */
  priority?: number;
}

/**
 * Contexto del evento que se pasa a los listeners
 */
export interface EventContext {
  /**
   * Cancela la propagación del evento a los siguientes listeners
   */
  stopPropagation(): void;
  
  /**
   * Nombre del evento actual
   */
  readonly eventName: string;
}

/**
 * Opciones para el registro de listeners
 */
export interface ListenerOptions {
  /**
   * Si es true, el listener se eliminará después de ejecutarse una vez
   * @default false
   */
  once?: boolean;
  
  /**
   * Prioridad del listener (mayor número = mayor prioridad)
   * @default 0
   */
  priority?: number;
}

/**
 * Opciones para la emisión de eventos asíncronos
 */
export interface AsyncEmitOptions {
  /**
   * Límite de concurrencia para la ejecución de listeners
   * @default Infinity (sin límite)
   */
  concurrencyLimit?: number;
}

/**
 * Interfaz para el servicio de eventos
 */
export interface IEventService {
  /**
   * Registra un listener para un evento específico
   * @param eventName Nombre del evento
   * @param listener Listener que manejará el evento
   * @param options Opciones adicionales para el listener
   */
  on<T>(eventName: string, listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean), options?: ListenerOptions): void;
  
  /**
   * Registra un listener que se ejecutará una sola vez
   * @param eventName Nombre del evento
   * @param listener Listener que manejará el evento
   * @param options Opciones adicionales para el listener (priority)
   */
  once<T>(eventName: string, listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean), options?: Omit<ListenerOptions, 'once'>): void;
  
  /**
   * Emite un evento de forma síncrona (espera a que todos los listeners terminen)
   * @param eventName Nombre del evento
   * @param data Datos del evento
   */
  emit<T>(eventName: string, data: T): Promise<void>;
  
  /**
   * Emite un evento de forma asíncrona (no espera a que los listeners terminen)
   * @param eventName Nombre del evento
   * @param data Datos del evento
   * @param options Opciones para la emisión asíncrona
   * @returns Promise que se resuelve cuando todos los listeners han terminado
   */
  emitAsync<T>(eventName: string, data: T, options?: AsyncEmitOptions): Promise<void>;
  
  /**
   * Elimina un listener específico para un evento
   * @param eventName Nombre del evento
   * @param listener Listener a eliminar
   */
  off<T>(eventName: string, listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean)): void;
  
  /**
   * Elimina todos los listeners para un evento específico
   * @param eventName Nombre del evento
   */
  removeAllListeners(eventName: string): void;
  
  /**
   * Verifica si un evento tiene listeners registrados
   * @param eventName Nombre del evento
   * @returns true si hay listeners registrados, false en caso contrario
   */
  hasListeners(eventName: string): boolean;
  
  /**
   * Obtiene la cantidad de listeners para un evento específico
   * @param eventName Nombre del evento
   * @returns Número de listeners registrados
   */
  listenerCount(eventName: string): number;
} 