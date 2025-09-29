// simpleListener.ts
import { IEventListener, EventContext } from '@core/services/EventService/event.interface';
import { PruebaEventData } from '@api/eventsListeners/events/prueba/prueba.event';
import slugify from 'slugify';
/**
 * Listener simple que solo hace un console.log
 */
export class SimpleListener implements IEventListener<PruebaEventData> {
  handle(data: PruebaEventData, context: EventContext): void {
    const slug = slugify("El camión de la empresa española", { lower: true, strict: true });
    console.log('Soy un simple listener');
    console.log(slug)
    console.log(`Evento recibido: ${context.eventName}`);
    console.log(`Datos: ${JSON.stringify(data)}`);
    console.log(`Slug: ${slug}`);
    
    // No detenemos la propagación
    return;
  }
}