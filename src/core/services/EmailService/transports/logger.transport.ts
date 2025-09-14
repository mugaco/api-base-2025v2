import { 
  EmailOptions, 
  EmailTransport, 
  EmailTransportResult 
} from '../email.interfaces';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface LoggerTransportConfig {
  logToConsole?: boolean;
  logToFile?: boolean;
  logFilePath?: string;
}

export class LoggerTransport implements EmailTransport {
  private transporter: nodemailer.Transporter;
  private config: LoggerTransportConfig;
  
  constructor(config: LoggerTransportConfig = {}) {
    console.log('⚓ Inicializando LoggerTransport con config:', JSON.stringify(config, null, 2));
    
    this.config = {
      logToConsole: config.logToConsole !== false,
      logToFile: config.logToFile === true,
      logFilePath: config.logFilePath || path.join(process.cwd(), 'logs', 'emails.log')
    };
    
    console.log('⚓ Config final de LoggerTransport:', JSON.stringify(this.config, null, 2));
    
    // Crear el transporte stream de Nodemailer
    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix'
    });
    
    // Asegurarse de que el directorio de logs existe si está habilitado
    if (this.config.logToFile) {
      try {
        const logPath = this.config.logFilePath || '';
        console.log(`⚓ Creando directorio para logs en: ${logPath}`);
        
        const dir = path.dirname(logPath);
        if (!fs.existsSync(dir)) {
          console.log(`⚓ El directorio ${dir} no existe, creándolo...`);
          fs.mkdirSync(dir, { recursive: true });
          console.log(`⚓ Directorio creado: ${dir}`);
        } else {
          console.log(`⚓ El directorio ${dir} ya existe`);
        }
        
        // Verificar que podemos escribir en el directorio
        const testFile = path.join(dir, '.test_write');
        fs.writeFileSync(testFile, 'test', 'utf8');
        fs.unlinkSync(testFile);
        console.log(`⚓ Prueba de escritura en ${dir} exitosa`);
      } catch (error) {
        console.error('❌ Error al preparar el directorio de logs:', error);
      }
    }
  }
  
  public async verify(): Promise<boolean> {
    console.log('⚓ Verificando LoggerTransport');
    return true; // Siempre funciona
  }
  
  public async send(options: EmailOptions): Promise<EmailTransportResult> {
    console.log('⚓ Enviando email con LoggerTransport');
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
      
      // Transformar el contenido a una cadena legible 
      let rawContent: string;
      
      try {
        // Intentar convertir el mensaje a string si es un stream
        if (info.message) {
          if (typeof info.message.toString === 'function') {
            rawContent = info.message.toString();
          } else {
            rawContent = JSON.stringify(info.message);
          }
        } else {
          rawContent = 'No message content available';
        }
      } catch (err) {
        rawContent = `Error al convertir el mensaje: ${err}`;
      }
      
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
        console.log('\n=== EMAIL LOGGER TRANSPORT ===');
        console.log(emailSummary);
        console.log('==============================\n');
      }
      
      // Guardar en archivo si está configurado
      if (this.config.logToFile) {
        try {
          const logPath = this.config.logFilePath;
          console.log(`⚓ Intentando escribir el email en: ${logPath}`);
          
          if (!logPath) {
            throw new Error('La ruta del archivo de logs es undefined');
          }
          
          // Asegurarnos que existe el directorio
          const dir = path.dirname(logPath);
          if (!fs.existsSync(dir)) {
            console.log(`⚓ Creando directorio ${dir}...`);
            fs.mkdirSync(dir, { recursive: true });
          }
          
          const logEntry = `\n=== EMAIL ${new Date().toISOString()} ===\n${emailSummary}\n---\n`;
          
          // Intentar escribir directamente con writeFileSync primero si el archivo no existe
          if (!fs.existsSync(logPath)) {
            console.log(`⚓ El archivo ${logPath} no existe, creándolo...`);
            fs.writeFileSync(logPath, logEntry, 'utf8');
          } else {
            console.log(`⚓ Añadiendo contenido al archivo existente ${logPath}`);
            fs.appendFileSync(logPath, logEntry, 'utf8');
          }
          
          console.log(`✅ Email guardado en el archivo: ${logPath}`);
        } catch (error) {
          console.error('❌ Error al escribir en el archivo de logs:', error);
        }
      }
      
      return {
        success: true,
        messageId: info.messageId,
        info: info
      };
    } catch (error) {
      console.error('❌ Error en LoggerTransport:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
} 