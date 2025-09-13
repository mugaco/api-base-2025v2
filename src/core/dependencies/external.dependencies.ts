/**
 * Registro de dependencias de servicios externos
 * Incluye integraciones con APIs externas, servicios de terceros, etc.
 */
import { AwilixContainer } from 'awilix';
import { Container } from '@core/Container';

/**
 * Registra servicios que interactúan con sistemas externos
 */
export function registerExternalDependencies(_container: AwilixContainer): void {

  // ========================================
  // Servicios de Email
  // ========================================
  // Container.register('emailService').asClass(EmailService).singleton();
  // Container.register('mailgunService').asClass(MailgunService).singleton();
  // Container.register('sendgridService').asClass(SendgridService).singleton();
  // Container.register('emailTemplateService').asClass(EmailTemplateService).singleton();

  // ========================================
  // Servicios de Almacenamiento
  // ========================================
  // Container.register('storageService').asClass(StorageService).singleton();
  // Container.register('minioService').asClass(MinioService).singleton();
  // Container.register('s3Service').asClass(S3Service).singleton();
  // Container.register('fileUploadService').asClass(FileUploadService).scoped();

  // ========================================
  // Servicios de Base de Datos
  // ========================================
  // Container.register('databaseConnection').asFunction(createDatabaseConnection).singleton();
  // Container.register('mongoConnection').asFunction(createMongoConnection).singleton();
  // Container.register('redisClient').asFunction(createRedisClient).singleton();

  // ========================================
  // Servicios de Caché
  // ========================================
  // Container.register('cacheService').asClass(CacheService).singleton();
  // Container.register('redisCacheService').asClass(RedisCacheService).singleton();
  // Container.register('memoryCacheService').asClass(MemoryCacheService).singleton();

  // ========================================
  // Servicios de Mensajería/Queue
  // ========================================
  // Container.register('queueService').asClass(QueueService).singleton();
  // Container.register('rabbitMQService').asClass(RabbitMQService).singleton();
  // Container.register('bullQueueService').asClass(BullQueueService).singleton();

  // ========================================
  // Servicios de Pago
  // ========================================
  // Container.register('paymentService').asClass(PaymentService).scoped();
  // Container.register('stripeService').asClass(StripeService).singleton();
  // Container.register('paypalService').asClass(PaypalService).singleton();

  // ========================================
  // Servicios de Notificaciones Push
  // ========================================
  // Container.register('pushNotificationService').asClass(PushNotificationService).singleton();
  // Container.register('firebaseService').asClass(FirebaseService).singleton();
  // Container.register('oneSignalService').asClass(OneSignalService).singleton();

  // ========================================
  // Servicios de SMS
  // ========================================
  // Container.register('smsService').asClass(SmsService).singleton();
  // Container.register('twilioService').asClass(TwilioService).singleton();

  // ========================================
  // Servicios de Analytics
  // ========================================
  // Container.register('analyticsService').asClass(AnalyticsService).singleton();
  // Container.register('googleAnalyticsService').asClass(GoogleAnalyticsService).singleton();
  // Container.register('mixpanelService').asClass(MixpanelService).singleton();

  // ========================================
  // Servicios de Búsqueda
  // ========================================
  // Container.register('searchService').asClass(SearchService).singleton();
  // Container.register('elasticsearchService').asClass(ElasticsearchService).singleton();
  // Container.register('algoliaService').asClass(AlgoliaService).singleton();

  // Placeholder para evitar advertencias de función vacía
  if (Container) {
    // Los servicios se registrarán aquí cuando se implementen
  }
}