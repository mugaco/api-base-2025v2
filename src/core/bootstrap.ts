// src/core/bootstrap.ts
import { connectDB } from '@core/database/connection';
import { Application } from 'express';
import { Container } from './Container';
// import { setupAllEventListeners } from '@api/events/event.listeners.setup';
import { createExpressApp } from '@core/createExpressApp';
import { ILoggerService } from './services/LoggerService';
import { registerAllDependencies } from './dependencies';

/**
 * Inicializa la aplicación de forma asíncrona
 */
export async function bootstrap(): Promise<Application> {
  // El contenedor ya fue creado en server.ts, ahora registramos las dependencias
  const container = Container.get();

  // Registrar todas las dependencias
  registerAllDependencies(container);

  // Ahora podemos resolver el logger
  const logger = Container.resolve<ILoggerService>('loggerService');
  try {
    logger.info('Aplicación iniciando...');
    
    // 2. Inicializar servicios críticos
    await logger.initialize();
    
    // 3. Conectar a la base de datos
    await connectDB();
    logger.info('Conexión a base de datos establecida');
    
    // // 4. Inicializar otros servicios críticos
    // const translationService = container.resolve('translationService');
    // await translationService.initialize();
    // logger.info('Servicio de traducción inicializado');
    
    // // 5. Configurar Express (sin listeners de eventos todavía)
    const app = createExpressApp();
    logger.info('Aplicación Express configurada');
    
    // // 6. Configurar listeners después de que todos los servicios estén inicializados
    // setupAllEventListeners();
    // logger.info('Listeners de eventos configurados');
    
    return app;
  } catch (error) {
     logger.error('Error durante la inicialización de la aplicación:', { 
       error: error instanceof Error ? error.message : String(error),
       stack: error instanceof Error ? error.stack : undefined
     });
    throw error;
  }
}