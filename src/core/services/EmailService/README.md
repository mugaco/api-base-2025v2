# Servicio de Email

Este servicio proporciona una implementación modular y extensible para el envío de correos electrónicos en nuestra aplicación Node.js con Express 5.x y TypeScript. Utiliza Nodemailer como biblioteca principal para el envío de correos, junto con transportes específicos como Mailgun.

## Características

- Arquitectura modular que permite cambiar fácilmente entre diferentes proveedores de email
- Soporte para transportes múltiples (Mailgun, Logger, etc.)
- Interfaz unificada para todos los transportes
- Manejo de errores robusto
- Verificación de configuración
- Soporte para texto plano, HTML y adjuntos

## Configuración

El servicio se configura a través de variables de entorno:

```
# Transporte a utilizar: "mailgun" o "logger"
EMAIL_TRANSPORT=logger

# Configuración de Logger Transport
EMAIL_LOG_TO_CONSOLE=true
EMAIL_LOG_TO_FILE=false
EMAIL_LOG_FILE_PATH=./logs/emails.log

# Configuración de Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
MAILGUN_HOST=api.mailgun.net
```

## Ejemplos de uso

### Enviar un email básico

```typescript
import { emailService } from 'core/services/EmailService';

// Ejemplo de cómo enviar un email
async function sendWelcomeEmail(to: string, name: string) {
  try {
    const result = await emailService.sendEmail({
      from: 'no-reply@example.com',
      to,
      subject: 'Bienvenido a nuestra plataforma',
      text: `Hola ${name}, ¡gracias por registrarte!`,
      html: `<h1>¡Bienvenido!</h1><p>Hola <strong>${name}</strong>, gracias por registrarte en nuestra plataforma.</p>`
    });
    
    if (result.success) {
      console.log(`Email sent to ${to} with ID: ${result.messageId}`);
    } else {
      console.error(`Failed to send email: ${result.error?.message}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
```

### Verificar el transporte antes de usar

```typescript
emailService.verifyTransport()
  .then(isValid => {
    if (isValid) {
      console.log('Email transport is working correctly');
    } else {
      console.error('Email transport verification failed');
    }
  });
```

### Ver transportes disponibles y cambiar entre ellos

```typescript
// Ver qué transportes están disponibles
const transports = emailService.getAvailableTransports();
console.log('Available transports:', transports);

// Cambiar a otro transporte
if (transports.includes('mailgun')) {
  emailService.useTransport('mailgun');
  console.log('Switched to mailgun transport');
}
```

### Enviar un email con adjuntos

```typescript
import { readFileSync } from 'fs';
import { emailService } from 'core/services/EmailService';

async function sendEmailWithAttachment(to: string) {
  try {
    const pdfBuffer = readFileSync('./documents/info.pdf');
    
    const result = await emailService.sendEmail({
      from: 'system@example.com',
      to,
      subject: 'Información solicitada',
      text: 'Adjunto encontrarás la información solicitada.',
      html: '<p>Adjunto encontrarás la <strong>información solicitada</strong>.</p>',
      attachments: [
        {
          filename: 'information.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    
    if (result.success) {
      console.log(`Email with attachment sent successfully`);
    } else {
      console.error(`Failed to send email: ${result.error?.message}`);
    }
  } catch (error) {
    console.error('Error sending email with attachment:', error);
  }
}
```

## Extensibilidad

Para añadir un nuevo transporte:

1. Crear un nuevo archivo en el directorio `transports/` (p.ej. `sendgrid.transport.ts`)
2. Implementar la interfaz `EmailTransport`
3. Actualizar `email.config.ts` para incluir el nuevo transporte
4. Añadir el nuevo tipo a `TransportType` en `email.interfaces.ts` 