// src/core/server.ts
import 'dotenv/config';
import { Container } from './Container';
import { bootstrap } from './bootstrap';
import { ILoggerService } from './services/LoggerService';

const port = process.env.PORT || 3000;

// Crear el contenedor una sola vez al inicio
Container.create();
const logger = Container.resolve<ILoggerService>('loggerService');
// Usar la función bootstrap para inicializar la aplicación de forma asíncrona
bootstrap()
  .then(app => {
    app.listen(port, () => {
      // logger.info(`Servidor iniciado en http://localhost:${port}`);
      logger.info(`Servidor iniciado en http://localhost:${port}`);
    });
  })
  .catch(error => {
    logger.error(`Error al iniciar la aplicación: ${error}`);
    // logger.error(`Error al iniciar la aplicación: ${error}`);
    process.exit(1);
  });