import { LoggerTransport } from './transports/logger.transport';
import * as path from 'path';
import * as fs from 'fs';

// Configurar la ruta del log para pruebas
const logsDir = path.join(process.cwd(), 'logs');
const logFilePath = path.join(logsDir, 'direct-test-emails.log');

// Verificar si ya existe la carpeta de logs
if (!fs.existsSync(logsDir)) {
  console.log(`Creando directorio de logs: ${logsDir}`);
  fs.mkdirSync(logsDir, { recursive: true });
}

console.log('🔄 Probando el transporte Logger directamente');
console.log(`📁 Ruta de logs: ${logFilePath}`);

async function testLoggerDirectly() {
  // Crear una instancia del transporte Logger directamente
  const loggerTransport = new LoggerTransport({
    logToConsole: true,
    logToFile: true,
    logFilePath: logFilePath
  });
  
  console.log('\n📨 Enviando email de prueba directamente...');
  const result = await loggerTransport.send({
    from: 'prueba@ejemplo.com',
    to: 'destinatario@ejemplo.com',
    subject: 'Email de prueba directa',
    text: 'Este es un email de prueba enviado directamente.',
    html: '<h1>Email de prueba directa</h1><p>Este es un <strong>email de prueba</strong> enviado directamente al transporte.</p>'
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
      
      // Intentar listar archivos en el directorio
      console.log(`\n📂 Contenido del directorio ${logsDir}:`);
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        files.forEach(file => {
          console.log(`- ${file}`);
        });
      } else {
        console.log(`❌ El directorio ${logsDir} no existe`);
      }
    }
  } else {
    console.error('❌ Error al enviar el email:', result.error?.message);
  }
}

// Ejecutar la prueba
testLoggerDirectly()
  .then(() => console.log('\n✅ Prueba completada'))
  .catch(err => console.error('\n❌ Error en la prueba:', err)); 