import {
  EmailOptions,
  EmailTransport,
  EmailTransportResult
} from '../email.interfaces';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Container } from '@core/Container';
import { ILoggerService } from '@core/services/LoggerService';

export interface LoggerTransportConfig {
  logToConsole?: boolean;
  logToFile?: boolean;
  logFilePath?: string;
}

export class LoggerTransport implements EmailTransport {
  private transporter: nodemailer.Transporter;
  private config: LoggerTransportConfig;
  private logger: ILoggerService;
  
  constructor(config: LoggerTransportConfig = {}) {

    this.config = {
      logToConsole: config.logToConsole !== false,
      logToFile: config.logToFile === true,
      logFilePath: config.logFilePath || path.join(process.cwd(), 'logs', 'emails.log')
    };

    // Obtener el logger del contenedor
    this.logger = Container.resolve<ILoggerService>('loggerService');
    
    
    // Crear el transporte stream de Nodemailer
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix'
    });
    
    // Asegurarse de que el directorio de logs existe si está habilitado
    if (this.config.logToFile) {
      try {
        const logPath = this.config.logFilePath || '';
        
        const dir = path.dirname(logPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        } 
        
        // Verificar que podemos escribir en el directorio
        const testFile = path.join(dir, '.test_write');
        fs.writeFileSync(testFile, 'test', 'utf8');
        fs.unlinkSync(testFile);
        // Prueba de escritura exitosa
      } catch (error) {
        throw new Error(`Error al preparar el directorio de logs: ${error}`);
      }
    }
  }
  
  public async verify(): Promise<boolean> {
    return true; // Siempre funciona
  }
  
  public async send(options: EmailOptions): Promise<EmailTransportResult> {
    try {
      // Adaptar las opciones al formato de Nodemailer
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType
        }))
      };
      
      // Enviar a través del transporte stream de Nodemailer
      const info = await this.transporter.sendMail(mailOptions);

      // Crear un resumen formateado del email para el log
      const emailSummary = `
FROM: ${options.from}
TO: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}
${options.cc ? `CC: ${Array.isArray(options.cc) ? options.cc.join(', ') : options.cc}\n` : ''}
${options.bcc ? `BCC: ${Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc}\n` : ''}
SUBJECT: ${options.subject}
MESSAGE-ID: ${info.messageId}
DATE: ${new Date().toISOString()}

${options.text ? `TEXT CONTENT:
---------------------------------------------
${options.text}
---------------------------------------------\n` : ''}

${options.html ? `HTML CONTENT:
---------------------------------------------
${options.html}
---------------------------------------------\n` : ''}

${options.attachments && options.attachments.length > 0 ? 
`ATTACHMENTS (${options.attachments.length}):
${options.attachments.map(a => `- ${a.filename} (${a.contentType || 'unknown type'})`).join('\n')}
---------------------------------------------\n` : ''}
      `;
      
      // Manejar la salida según la configuración
      if (this.config.logToConsole) {
        this.logger.info('EMAIL LOGGER TRANSPORT', {
          summary: emailSummary,
          messageId: info.messageId
        });
      }
      
      // Guardar en archivo si está configurado
      if (this.config.logToFile) {
        try {
          const logPath = this.config.logFilePath;
          // Escribir el email en el archivo de log
          
          if (!logPath) {
            throw new Error('La ruta del archivo de logs es undefined');
          }
          
          // Asegurarnos que existe el directorio
          const dir = path.dirname(logPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          const logEntry = `\n=== EMAIL ${new Date().toISOString()} ===\n${emailSummary}\n---\n`;
          
          // Intentar escribir directamente con writeFileSync primero si el archivo no existe
          if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, logEntry, 'utf8');
          } else {
            fs.appendFileSync(logPath, logEntry, 'utf8');
          }
          
          // Email guardado exitosamente
        } catch {
          // Error silencioso al escribir logs - no interrumpir el flujo del email
        }
      }
      
      return {
        success: true,
        messageId: info.messageId,
        info: info
      };
    } catch (error) {
      // Error al enviar email
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
} 