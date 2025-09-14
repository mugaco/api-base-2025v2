import { Router } from 'express';
import { PruebaRoutes } from '@api/domain/entities/Prueba/PruebaRoutes';
import { TestRoutes } from '@api/domain/entities/Test/TestRoutes';

const router = Router();

// Configurar rutas
router.use('/prueba', PruebaRoutes);
router.use('/test', TestRoutes);

export const apiRoutes = router;