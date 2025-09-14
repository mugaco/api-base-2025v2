import { EmailService } from './email.service';
import * as path from 'path';
import * as fs from 'fs';

// Crear instancia del servicio
const emailService = new EmailService();

// Configurar la ruta del log para pruebas
const logsDir = path.join(process.cwd(), 'logs');
const logFilePath = path.join(logsDir, 'test-emails.log');

// Verificar si ya existe la carpeta de logs
if (!fs.existsSync(logsDir)) {
  console.log(`Creando directorio de logs: ${logsDir}`);
  fs.mkdirSync(logsDir, { recursive: true });
}

// Ahora configuramos el servicio directamente en lugar de usar variables de entorno
console.log('🔧 Configurando directamente el servicio de email');
console.log(`📁 Ruta de logs: ${logFilePath}`);

emailService.configureLogger({
  logToConsole: true,
  logToFile: true,
  logFilePath: logFilePath
});

async function testEmailService() {
  console.log('\n🚀 Probando el servicio de email...');
  
  // Verificar transportes disponibles
  const transports = emailService.getAvailableTransports();
  console.log('📋 Transportes disponibles:', transports);
  
  // Verificar que el transporte funcione
  const isValid = await emailService.verifyTransport();
  console.log('✅ ¿El transporte es válido?', isValid);
  
  if (isValid) {
    // Enviar un email de prueba
    console.log('\n📨 Enviando email de prueba...');
    const result = await emailService.sendEmail({
      from: 'prueba@ejemplo.com',
      to: 'destinatario@ejemplo.com',
      subject: 'Email de prueba',
      text: 'Este es un email de prueba enviado por el servicio de email.',
      html: '<h1>Email de prueba</h1><p>Este es un <strong>email de prueba</strong> enviado por el servicio de email.</p>'
    });
    
    console.log('📊 Resultado del envío:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Email enviado correctamente con ID:', result.messageId);
      
      // Verificar si el archivo de log existe
      if (fs.existsSync(logFilePath)) {
        console.log(`✅ El archivo de log existe en: ${logFilePath}`);
        console.log(`📝 Contenido del archivo de log:\n`);
        console.log(fs.readFileSync(logFilePath, 'utf8'));
      } else {
        console.error(`❌ El archivo de log NO existe en: ${logFilePath}`);
      }
    } else {
      console.error('❌ Error al enviar el email:', result.error?.message);
    }
  }
}

// Ejecutar la prueba
testEmailService()
  .then(() => console.log('\n✅ Prueba completada'))
  .catch(err => console.error('\n❌ Error en la prueba:', err)); 