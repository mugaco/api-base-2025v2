// event.listeners.setup.ts
import { setupPruebaEventListener } from './prueba/prueba.subscriber';
// Importar otras funciones setup de eventos aquí a medida que se creen
// import { setupOtroEventListener } from './otroEvento/otroEvento.subscriber';

/**
 * Configura y registra todos los listeners de eventos de la aplicación
 * Esta función centraliza todas las configuraciones de eventos para
 * facilitar el mantenimiento y evitar tener que modificar app.ts
 * cada vez que se añade un nuevo evento.
 */
export function setupAllEventListeners(): void {
  // Registrar todos los listeners de eventos
  setupPruebaEventListener();
  

  // Añadir llamadas a otras funciones setup de eventos aquí
  // setupOtroEventListener();
  
  // Log opcional para indicar que todos los listeners se han configurado
  // console.log('Todos los event listeners han sido configurados');
} 