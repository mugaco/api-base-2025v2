// src/core/server.ts
import 'dotenv/config';
import { Container } from './Container';
import { bootstrap } from './bootstrap';
import { ILoggerService } from './services/LoggerService';

const port = process.env.PORT || 3000;

// Crear el contenedor una sola vez al inicio
Container.create();

// Usar la función bootstrap para inicializar la aplicación de forma asíncrona
bootstrap()
  .then(app => {
    app.listen(port, () => {
      // Ahora sí podemos obtener el logger porque bootstrap ya registró las dependencias
      const logger = Container.resolve<ILoggerService>('loggerService');
      logger.info(`Servidor iniciado en http://localhost:${port}`);
    });
  })
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error('Error crítico durante el inicio:', error);
    process.exit(1);
  });