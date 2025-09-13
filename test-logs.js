const winston = require('winston');
const fs = require('fs');
const path = require('path');

console.log('Test de sistema de logs');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Crear directorios si no existen
const logsDir = path.join(process.cwd(), 'logs');
const testLogsDir = path.join(logsDir, 'test');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Directorio logs creado:', logsDir);
}

if (!fs.existsSync(testLogsDir)) {
  fs.mkdirSync(testLogsDir, { recursive: true });
  console.log('Directorio test-logs creado:', testLogsDir);
}

// Crear un logger de prueba
const testLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'log-test' },
  transports: [
    // Consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Archivo
    new winston.transports.File({
      filename: path.join(testLogsDir, 'test.log'),
      maxsize: 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Escribir algunos logs
testLogger.info('Mensaje de prueba INFO');
testLogger.warn('Mensaje de prueba WARN');
testLogger.error('Mensaje de prueba ERROR', { error: new Error('Error de prueba') });

console.log('\nLogs escritos. Verificando archivos creados...');

// Verificar archivos creados
setTimeout(() => {
  const checkPath = path.join(testLogsDir, 'test.log');
  
  if (fs.existsSync(checkPath)) {
    const stats = fs.statSync(checkPath);
    console.log(`✅ Archivo creado: ${checkPath}`);
    console.log(`   Tamaño: ${stats.size} bytes`);
    console.log(`   Permisos: ${stats.mode.toString(8)}`);
    console.log(`   Usuario: ${stats.uid}, Grupo: ${stats.gid}`);
    
    // Mostrar las últimas líneas
    const content = fs.readFileSync(checkPath, 'utf8');
    console.log('\nContenido del archivo:');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
  } else {
    console.log(`❌ Error: No se pudo crear el archivo ${checkPath}`);
  }
}, 500); 