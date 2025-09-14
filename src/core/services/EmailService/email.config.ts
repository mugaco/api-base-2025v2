import { EmailTransport, TransportType } from './email.interfaces';
import { MailgunTransport } from './transports/mailgun.transport';
import { LoggerTransport } from './transports/logger.transport';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno
dotenv.config();

interface ConfiguredTransport {
  name: string;
  transport: EmailTransport;
}

/**
 * Obtiene el tipo de transporte configurado en las variables de entorno
 */
function getTransportType(): TransportType {
  const transportType = process.env.EMAIL_TRANSPORT;
  return (transportType || 'logger') as TransportType;
}

/**
 * Devuelve el transporte configurado de acuerdo a las variables de entorno
 */
export function getConfiguredTransport(): ConfiguredTransport {
  const transportType = getTransportType();
  
  switch (transportType) {
    case 'mailgun': {
      // Verificar que existan las variables requeridas
      const apiKey = process.env.MAILGUN_API_KEY;
      const domain = process.env.MAILGUN_DOMAIN;
      
      if (!apiKey || !domain) {
        // Mailgun credentials not found, falling back to logger transport
        return {
          name: 'logger',
          transport: new LoggerTransport()
        };
      }
      
      return {
        name: 'mailgun',
        transport: new MailgunTransport({
          apiKey,
          domain,
          host: process.env.MAILGUN_HOST
        })
      };
    }
    
    case 'logger':
    default: {
      // Convertir string a booleano para logToFile
      const logToFile = process.env.EMAIL_LOG_TO_FILE === 'true';
      const logToConsole = process.env.EMAIL_LOG_TO_CONSOLE !== 'false';

      // Configurar la ruta del archivo de logs (asegurándose que sea absoluta)
      let logFilePath = process.env.EMAIL_LOG_FILE_PATH;
      
      if (logToFile) {
        if (!logFilePath) {
          // Usar ruta predeterminada
          logFilePath = path.join(process.cwd(), 'logs', 'emails.log');
        } else if (!path.isAbsolute(logFilePath)) {
          // Convertir a ruta absoluta si es relativa
          logFilePath = path.join(process.cwd(), logFilePath);
        }
        
        // Asegurarnos que el directorio existe
        const logsDir = path.dirname(logFilePath);
        if (!fs.existsSync(logsDir)) {
          // Creando directorio para logs
          fs.mkdirSync(logsDir, { recursive: true });
        }
      }
      
      // Configuración de Logger Transport aplicada
      return {
        name: 'logger',
        transport: new LoggerTransport({
          logToConsole,
          logToFile,
          logFilePath
        })
      };
    }
  }
} 