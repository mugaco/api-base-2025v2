// prueba.subscriber.ts
import { Container } from '@core/Container';
import { PRUEBA_EVENT } from './prueba.event';
import { SimpleListener } from '@api/eventsListeners/listeners/SimpleListener';
import { SimpleListenerDos } from '@api/eventsListeners/listeners/SimpleListenerDos';
import { IEventService } from '@core/services/EventService/event.interface';

/**
 * Registra el SimpleListener para el evento PRUEBAEVENT
 */
export function setupPruebaEventListener(): void {
  // Obtener el servicio de eventos del contenedor
  const eventService: IEventService = Container.resolve('eventService');
  
  // Crear el listener
  const simpleListener = new SimpleListener();
  const simpleListenerDos = new SimpleListenerDos();
  // Registro de listeners para el evento PRUEBAEVENT
  eventService.on(PRUEBA_EVENT, simpleListener, { priority: 100 });
  eventService.on(PRUEBA_EVENT, simpleListenerDos, { priority: 50 });
  // console.log(`Listener registrado para el evento: ${PRUEBA_EVENT}`);
}