// simpleListener.ts
import { IEventListener, EventContext } from '@core/services/EventService/event.interface';
import { PruebaEventData } from '@api/eventsListeners/events/prueba/prueba.event';
// import { Container } from '@core/Container';
// import { useTranslation } from '@core/hooks/useTranslation';

// const emailService = Container.resolve('emailService');
// const { t } = useTranslation();

/**
 * Listener simple que solo hace un console.log
 */
export class SimpleListenerDos implements IEventListener<PruebaEventData> {
  handle(data: PruebaEventData, context: EventContext): void {
    console.log('Soy un simple listener dos');
    console.log(`Evento recibido: ${context.eventName}`);
    console.log(`Datos: ${JSON.stringify(data)}`);


    // async function sendSimpleEmail() {
    //   try {
    //     const asunto = t('email.subject.welcome');
    //     const v = t('email.subject.account_verified');
    //     const result = await emailService.sendEmail({
    //       from: 'no-reply@gun.josemanuelmunoz.com',
    //       to: 'mg.jmanuel@gmail.com',
    //       subject: asunto,
    //       text: v, // Versión texto plano
    //       html: '<p>' + v + '</p>' // Versión HTML opcional
    //     });

    //     if (result.success) {
    //       console.log(`Email enviado correctamente. ID: ${result.messageId}`);
    //     } else {
    //       console.error(`Error al enviar el email: ${result.error?.message}`);
    //     }
    //   } catch (error) {
    //     console.error('Error enviando email:', error);
    //   }
    // }

    // // Ejecutar la función
    // sendSimpleEmail();

    // No detenemos la propagación
    return;
  }
}