import { 
  EmailOptions, 
  EmailTransport, 
  EmailTransportResult,
  TransportType
} from './email.interfaces';
import { getConfiguredTransport } from './email.config';
import { LoggerTransport } from './transports/logger.transport';
import { MailgunTransport } from './transports/mailgun.transport';

export class EmailService {
  private transports: Map<string, EmailTransport> = new Map();
  private activeTransport: string | null = null;

  constructor() {
    // El constructor inicializa con el transporte por defecto
    this.initialize();
  }

  /**
   * Inicializa el servicio con la configuración actual
   * Útil para reinicializar después de cambiar variables de entorno
   */
  public initialize(): void {
    this.transports.clear();
    this.activeTransport = null;
    
    const defaultTransport = getConfiguredTransport();
    if (defaultTransport) {
      this.registerTransport(defaultTransport.name, defaultTransport.transport);
      this.activeTransport = defaultTransport.name;
    }
  }

  /**
   * Configura directamente un transporte de logger
   */
  public configureLogger(options: {
    logToConsole?: boolean;
    logToFile?: boolean;
    logFilePath?: string;
  }): void {
    const loggerTransport = new LoggerTransport(options);
    this.registerTransport('logger', loggerTransport);
    this.activeTransport = 'logger';
  }

  /**
   * Configura directamente un transporte de Mailgun
   */
  public configureMailgun(options: {
    apiKey: string;
    domain: string;
    host?: string;
  }): void {
    const mailgunTransport = new MailgunTransport(options);
    this.registerTransport('mailgun', mailgunTransport);
    this.activeTransport = 'mailgun';
  }

  /**
   * Registra un nuevo transporte
   */
  public registerTransport(name: string, transport: EmailTransport): void {
    this.transports.set(name, transport);
    // Si es el primer transporte, hacerlo el activo
    if (!this.activeTransport) {
      this.activeTransport = name;
    }
  }

  /**
   * Cambia el transporte activo
   */
  public useTransport(name: TransportType): boolean {
    if (this.transports.has(name)) {
      this.activeTransport = name;
      return true;
    }
    return false;
  }

  /**
   * Obtiene la lista de transportes disponibles
   */
  public getAvailableTransports(): string[] {
    return Array.from(this.transports.keys());
  }

  /**
   * Verifica que el transporte activo funcione correctamente
   */
  public async verifyTransport(): Promise<boolean> {
    if (!this.activeTransport) {
      throw new Error('No active transport configured');
    }
    
    const transport = this.transports.get(this.activeTransport);
    if (!transport) {
      throw new Error(`Transport ${this.activeTransport} not found`);
    }
    
    return transport.verify();
  }

  /**
   * Envía un email usando el transporte activo
   */
  public async sendEmail(options: EmailOptions): Promise<EmailTransportResult> {
    if (!this.activeTransport) {
      throw new Error('No active transport configured');
    }
    
    const transport = this.transports.get(this.activeTransport);
    if (!transport) {
      throw new Error(`Transport ${this.activeTransport} not found`);
    }
    
    try {
      return await transport.send(options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

// Exportar una instancia singleton para ser usada en toda la aplicación
// export const emailService = new EmailService(); 