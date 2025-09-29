// prueba.event.ts

/**
 * Definición del tipo de datos para el evento PRUEBAEVENT
 */
export interface PruebaEventData {
    name: string;
    timestamp: Date;
    // Otros datos que quieras incluir
  }
  
  // Constante con el nombre del evento para evitar errores de tipeo
  export const PRUEBA_EVENT = 'PRUEBAEVENT';