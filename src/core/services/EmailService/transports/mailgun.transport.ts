import { 
  EmailOptions, 
  EmailTransport, 
  EmailTransportResult 
} from '../email.interfaces';
import * as nodemailer from 'nodemailer';
import mailgunTransport from 'nodemailer-mailgun-transport';

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  host?: string;
}

export class MailgunTransport implements EmailTransport {
  private transporter: nodemailer.Transporter;
  
  constructor(config: MailgunConfig) {
    // Crear el transporte de Nodemailer con Mailgun
    this.transporter = nodemailer.createTransport(
      mailgunTransport({
        auth: {
          api_key: config.apiKey,
          domain: config.domain
        },
        host: config.host || 'api.mailgun.net'
      })
    );
  }
  
  public async verify(): Promise<boolean> {
    try {
      // Nodemailer proporciona un método de verificación
      await this.transporter.verify();
      return true;
    } catch {
      // Mailgun transport verification failed
      return false;
    }
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
      
      // Enviar el email usando Nodemailer
      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        info: info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
} 