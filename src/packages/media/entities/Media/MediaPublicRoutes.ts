/**
 * Rutas para Media
 */
import { Router } from 'express';
import { MediaController } from './MediaController';
import { MediaService } from './MediaService';
import { MediaRepository } from './MediaRepository';

const mediaRepository = new MediaRepository();
const mediaService = new MediaService(mediaRepository);
const mediaController = new MediaController(mediaService);

// Crear el router
const router = Router();

/**
 * Definición de rutas púbicas para Media
 */
//Rutas para descargar y servir archivos
router.get('/download/:library_slug/:file_slug', mediaController.downloadFile);
// Nueva ruta para servir archivos mediante proxy (optimizado para imágenes y compatibilidad frontend)
// router.get('/proxy/:library_slug/:file_slug', mediaController.proxyFile);
// Ruta estándar con redirección (comportamiento original)
// router.get('/:library_slug/:file_slug', mediaController.serveFile);
router.get('/:library_slug/:file_slug', mediaController.proxyFile);


export const MediaPublicRoutes = router; 