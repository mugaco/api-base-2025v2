import { Router } from 'express';
import { Container } from '@core/Container';
import { TestController } from './TestController';

// Crear el router
const router = Router();

// Resolver el controller desde el Container (lazy loading)
let testController: TestController;

const getTestController = (): TestController => {
  if (!testController) {
    testController = Container.resolve<TestController>('testController');
  }
  return testController;
};

// GET /api/test - Endpoint de prueba
router.get('/', (req, res, _next) => getTestController().test(req, res));

export const TestRoutes = router;