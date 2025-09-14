import { Router } from 'express';
import { PruebaRoutes } from '@api/domain/entities/Prueba/PruebaRoutes';
import { TestRoutes } from '@api/domain/entities/Test/TestRoutes';

// Core domain routes
import { UserRoutes } from '@core/domain/entities/User/UserRoutes';
import { AccessRoutes } from '@core/domain/entities/Access/AccessRoutes';
import { AuthRoutes } from '@core/domain/orchestrators/Auth/AuthRoutes';

const router = Router();

// Configurar rutas core
router.use('/user', UserRoutes);
router.use('/access', AccessRoutes);
router.use('/auth', AuthRoutes);

// Configurar rutas API
router.use('/prueba', PruebaRoutes);
router.use('/test', TestRoutes);

export const apiRoutes = router;