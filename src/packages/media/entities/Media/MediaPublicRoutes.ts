/**
 * Rutas para Media
 */
import { Router, Request, Response, NextFunction } from 'express';
import { MediaController } from './MediaController';
// Crear el router
const router = Router();
/**
 * Resolver el controller desde el scope del request
 * Esto permite que cada request tenga su propia instancia de servicios scoped
 * @throws Error si el scope middleware no está configurado
 */
const getMediaController = (req: Request): MediaController => {
  if (!req.scope) {
    throw new Error('Scope middleware not configured. Please add scopeMiddleware to Express app.');
  }
  return req.scope.resolve<MediaController>('mediaController');
};

/**
 * Definición de rutas púbicas para Media
 */
//Rutas para descargar y servir archivos
router.get('/download/:library_slug/:file_slug', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.downloadFile(req, res, next);
});
// Nueva ruta para servir archivos mediante proxy (optimizado para imágenes y compatibilidad frontend)
// router.get('/proxy/:library_slug/:file_slug', (req: Request, res: Response, next: NextFunction) => {
//   const controller = getMediaController(req);
//   controller.proxyFile(req, res, next);
// });

// Ruta estándar con redirección (comportamiento original)
// router.get('/:library_slug/:file_slug', (req: Request, res: Response, next: NextFunction) => {
//   const controller = getMediaController(req);
//   controller.serveFile(req, res, next);
// });
router.get('/:library_slug/:file_slug', (req: Request, res: Response, next: NextFunction) => {
  const controller = getMediaController(req);
  controller.proxyFile(req, res, next);
});

export const MediaPublicRoutes = router; 