import { AsyncEmitOptions, EventContext, IEventListener, IEventService, ListenerOptions } from './event.interface';
import { LoggerService } from '@core/services/LoggerService/logger.service';

/**
 * Tipo interno para manejar los listeners con metadata adicional
 */
interface InternalListener<T = unknown> {
  listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean);
  priority: number;
  once: boolean;
}

/**
 * Implementación del servicio de eventos
 * Permite la emisión y suscripción a eventos en la aplicación
 */
export class EventService implements IEventService {
  /**
   * Mapa de eventos a sus listeners
   * @private
   */
  private listeners: Map<string, InternalListener<unknown>[]> = new Map();
  
  /**
   * Constructor del servicio de eventos
   * @param loggerService Servicio de logging
   */
  constructor(private loggerService: LoggerService) {}
  
  /**
   * Registra un listener para un evento específico
   * @param eventName Nombre del evento
   * @param listener Listener que manejará el evento
   * @param options Opciones adicionales para el listener
   */
  on<T>(
    eventName: string, 
    listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean),
    options?: ListenerOptions
  ): void {
    // Obtener los listeners actuales para este evento o crear un nuevo array
    const currentListeners = this.listeners.get(eventName) || [];
    
    // Crear un listener interno con los metadatos
    const internalListener: InternalListener<unknown> = {
      listener: listener as IEventListener<unknown> | ((data: unknown, context: EventContext) => Promise<void | boolean> | void | boolean),
      priority: options?.priority || 0,
      once: options?.once || false
    };
    
    // Añadir el nuevo listener
    currentListeners.push(internalListener);
    
    // Ordenar los listeners por prioridad (mayor número = mayor prioridad)
    currentListeners.sort((a, b) => b.priority - a.priority);
    
    // Actualizar el mapa de listeners
    this.listeners.set(eventName, currentListeners);
    
    this.loggerService.debug(`Listener registrado para evento: ${eventName}`, {
      eventName,
      listenerCount: currentListeners.length,
      priority: internalListener.priority,
      once: internalListener.once
    });
  }

  /**
   * Registra un listener que se ejecutará una sola vez
   * @param eventName Nombre del evento
   * @param listener Listener que manejará el evento
   * @param options Opciones adicionales para el listener (priority)
   */
  once<T>(
    eventName: string, 
    listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean),
    options?: Omit<ListenerOptions, 'once'>
  ): void {
    this.on(eventName, listener, { ...options, once: true });
  }
  
  /**
   * Emite un evento de forma síncrona (espera a que todos los listeners terminen)
   * @param eventName Nombre del evento
   * @param data Datos del evento
   */
  async emit<T>(eventName: string, data: T): Promise<void> {
    const eventListeners = this.listeners.get(eventName) || [];
    
    if (eventListeners.length === 0) {
      this.loggerService.debug(`Evento emitido sin listeners: ${eventName}`, { eventName });
      return;
    }
    
    this.loggerService.info(`Evento emitido: ${eventName}`, {
      eventName,
      listenerCount: eventListeners.length,
      data
    });
    
    // Creamos una lista de listeners a eliminar (para los once: true)
    const listenersToRemove: InternalListener[] = [];
    
    // Creamos el contexto del evento
    let shouldStopPropagation = false;
    const context: EventContext = {
      stopPropagation: () => { shouldStopPropagation = true; },
      eventName
    };
    
    // Ejecutar todos los listeners de forma secuencial
    for (const internalListener of eventListeners) {
      // Si se debe detener la propagación, salimos del bucle
      if (shouldStopPropagation) {
        break;
      }
      
      try {
        // Obtener el listener (puede ser función o objeto)
        const listenerFn = typeof internalListener.listener === 'function'
          ? internalListener.listener
          : internalListener.listener.handle.bind(internalListener.listener);
        
        // Ejecutar el listener
        const result = listenerFn(data, context);
        
        // Si el handler devuelve una promesa, esperamos a que se resuelva
        if (result instanceof Promise) {
          const promiseResult = await result;
          // Si devuelve false explícitamente, detenemos la propagación
          if (promiseResult === false) {
            shouldStopPropagation = true;
          }
        } else if (result === false) {
          // Si devuelve false directamente, detenemos la propagación
          shouldStopPropagation = true;
        }
        
        // Si es un listener de una sola ejecución, lo marcamos para eliminación
        if (internalListener.once) {
          listenersToRemove.push(internalListener);
        }
      } catch (error) {
        this.loggerService.error(`Error en listener para evento ${eventName}`, {
          eventName,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
    
    // Eliminamos los listeners de una sola ejecución si hay alguno
    if (listenersToRemove.length > 0) {
      const remainingListeners = eventListeners.filter(
        listener => !listenersToRemove.includes(listener)
      );
      
      if (remainingListeners.length === 0) {
        this.listeners.delete(eventName);
      } else {
        this.listeners.set(eventName, remainingListeners);
      }
    }
  }
  
  /**
   * Emite un evento de forma asíncrona (no espera a que los listeners terminen)
   * @param eventName Nombre del evento
   * @param data Datos del evento
   * @param options Opciones para la emisión asíncrona
   * @returns Promise que se resuelve cuando todos los listeners han terminado
   */
  async emitAsync<T>(eventName: string, data: T, options?: AsyncEmitOptions): Promise<void> {
    const concurrencyLimit = options?.concurrencyLimit || Infinity;
    const eventListeners = this.listeners.get(eventName) || [];
    
    if (eventListeners.length === 0) {
      this.loggerService.debug(`Evento emitido sin listeners: ${eventName}`, { eventName });
      return;
    }
    
    this.loggerService.info(`Evento emitido asíncronamente: ${eventName}`, {
      eventName,
      listenerCount: eventListeners.length,
      data,
      concurrencyLimit: concurrencyLimit !== Infinity ? concurrencyLimit : 'sin límite'
    });
    
    // Si no hay límite de concurrencia o hay menos listeners que el límite
    if (concurrencyLimit === Infinity || eventListeners.length <= concurrencyLimit) {
      try {
        await this.emit(eventName, data);
      } catch (error) {
        this.loggerService.error(`Error en emisión asíncrona del evento ${eventName}`, {
          eventName,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      return;
    }
    
    // Implementación real del límite de concurrencia
    try {
      // Creamos una lista de listeners a eliminar (para los once: true)
      const listenersToRemove: InternalListener[] = [];
      
      // Creamos el contexto del evento
      let shouldStopPropagation = false;
      const context: EventContext = {
        stopPropagation: () => { shouldStopPropagation = true; },
        eventName
      };
      
      // Procesamos los listeners en bloques según el límite de concurrencia
      for (let i = 0; i < eventListeners.length && !shouldStopPropagation; i += concurrencyLimit) {
        const batch = eventListeners.slice(i, i + concurrencyLimit);
        
        // Ejecutamos cada lote de listeners en paralelo
        await Promise.all(
          batch.map(async (internalListener) => {
            if (shouldStopPropagation) return;
            
            try {
              // Obtener el listener (puede ser función o objeto)
              const listenerFn = typeof internalListener.listener === 'function'
                ? internalListener.listener
                : internalListener.listener.handle.bind(internalListener.listener);
              
              // Ejecutar el listener
              const result = listenerFn(data, context);
              
              // Si el handler devuelve una promesa, esperamos a que se resuelva
              if (result instanceof Promise) {
                const promiseResult = await result;
                // Si devuelve false explícitamente, detenemos la propagación
                if (promiseResult === false) {
                  shouldStopPropagation = true;
                }
              } else if (result === false) {
                // Si devuelve false directamente, detenemos la propagación
                shouldStopPropagation = true;
              }
              
              // Si es un listener de una sola ejecución, lo marcamos para eliminación
              if (internalListener.once) {
                listenersToRemove.push(internalListener);
              }
            } catch (error) {
              this.loggerService.error(`Error en listener para evento ${eventName}`, {
                eventName,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
              });
            }
          })
        );
      }
      
      // Eliminamos los listeners de una sola ejecución si hay alguno
      if (listenersToRemove.length > 0) {
        const remainingListeners = eventListeners.filter(
          listener => !listenersToRemove.includes(listener)
        );
        
        if (remainingListeners.length === 0) {
          this.listeners.delete(eventName);
        } else {
          this.listeners.set(eventName, remainingListeners);
        }
      }
    } catch (error) {
      this.loggerService.error(`Error en emisión asíncrona del evento ${eventName}`, {
        eventName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  /**
   * Elimina un listener específico para un evento
   * @param eventName Nombre del evento
   * @param listener Listener a eliminar
   */
  off<T>(
    eventName: string, 
    listener: IEventListener<T> | ((data: T, context: EventContext) => Promise<void | boolean> | void | boolean)
  ): void {
    const eventListeners = this.listeners.get(eventName) || [];
    
    // Filtrar el listener específico (comparando por referencia)
    const updatedListeners = eventListeners.filter(l => l.listener !== listener);
    
    if (updatedListeners.length === 0) {
      // Si no quedan listeners, eliminamos la entrada del mapa
      this.listeners.delete(eventName);
    } else {
      // Actualizar el mapa con los listeners restantes
      this.listeners.set(eventName, updatedListeners);
    }
    
    this.loggerService.debug(`Listener eliminado para evento: ${eventName}`, {
      eventName,
      listenerCount: updatedListeners.length
    });
  }
  
  /**
   * Elimina todos los listeners para un evento específico
   * @param eventName Nombre del evento
   */
  removeAllListeners(eventName: string): void {
    this.listeners.delete(eventName);
    
    this.loggerService.debug(`Todos los listeners eliminados para evento: ${eventName}`, {
      eventName
    });
  }

  /**
   * Verifica si un evento tiene listeners registrados
   * @param eventName Nombre del evento
   * @returns true si hay listeners registrados, false en caso contrario
   */
  hasListeners(eventName: string): boolean {
    const listeners = this.listeners.get(eventName);
    return !!listeners && listeners.length > 0;
  }
  
  /**
   * Obtiene la cantidad de listeners para un evento específico
   * @param eventName Nombre del evento
   * @returns Número de listeners registrados
   */
  listenerCount(eventName: string): number {
    const listeners = this.listeners.get(eventName);
    return listeners?.length || 0;
  }
} 