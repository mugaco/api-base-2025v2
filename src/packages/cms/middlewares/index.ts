/**
 * Middlewares de Aplanamiento Automático para Entidades CMS
 * 
 * Cada middleware intercepta las respuestas de su entidad correspondiente
 * y aplana automáticamente las traducciones cuando detecta un locale válido.
 * 
 * Comportamiento consistente:
 * - Detecta locale desde Accept-Language, query params o headers
 * - Solo aplana cuando hay un locale válido detectado
 * - Mantiene backward compatibility total
 * - Logging específico por entidad para debugging
 */

// Exportar todos los middlewares de aplanamiento
export { aplanaPublicationMiddleware } from './aplanaPublicationMiddleware';
export { aplanaCategoryMiddleware } from './aplanaCategoryMiddleware';
export { aplanaTagMiddleware } from './aplanaTagMiddleware';
export { aplanaMenuMiddleware } from './aplanaMenuMiddleware'; 