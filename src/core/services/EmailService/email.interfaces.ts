// Define las interfaces para los emails, transportes y opciones

export interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailOptions extends EmailContent {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailTransportConfig {
  name: string;
  [key: string]: unknown;
}

export interface EmailTransportResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  info?: Record<string, unknown>;
}

export interface EmailTransport {
  send(options: EmailOptions): Promise<EmailTransportResult>;
  verify(): Promise<boolean>;
}

export type TransportType = 'mailgun' | 'logger' | string; 