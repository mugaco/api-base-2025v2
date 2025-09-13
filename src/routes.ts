import { Router } from 'express';
import { PruebaRoutes } from '@api/entities/Prueba/PruebaRoutes';
import { TestRoutes } from '@api/entities/Test/TestRoutes';

const router = Router();

// Configurar rutas
router.use('/prueba', PruebaRoutes);
router.use('/test', TestRoutes);

export const apiRoutes = router;