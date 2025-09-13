/**
 * Rutas para Prueba
 */
import { Router } from 'express';
import { Container } from '@core/Container';
import { PruebaController } from './PruebaController';

// Crear el router
const router = Router();

// Resolver el controller desde el Container (lazy loading)
let pruebaController: PruebaController;

const getPruebaController = (): PruebaController => {
  if (!pruebaController) {
    pruebaController = Container.resolve<PruebaController>('pruebaController');
  }
  return pruebaController;
};

/**
 * Definición de rutas para Prueba
 */

// Rutas que requieren autenticación

// GET /api/pruebas - Obtener elementos (con o sin paginación según parámetro 'page')
router.get('/', (req, res, next) => getPruebaController().get(req, res, next));

// GET /api/pruebas/:_id - Obtener un elemento por ID
router.get('/:_id', (req, res, next) => getPruebaController().getById(req, res, next));

// POST /api/pruebas - Crear un nuevo elemento
router.post('/', (req, res, next) => getPruebaController().create(req, res, next));

// PUT /api/pruebas/:_id - Actualizar un elemento
router.put('/:_id', (req, res, next) => getPruebaController().update(req, res, next));

// DELETE /api/pruebas/:_id - Eliminar un elemento
router.delete('/:_id', (req, res, next) => getPruebaController().delete(req, res, next));

// PATCH /api/pruebas/:_id/soft-delete - Eliminación lógica
router.patch('/:_id/soft-delete', (req, res, next) => getPruebaController().softDelete(req, res, next));

// PATCH /api/pruebas/:_id/restore - Restaurar elemento
router.patch('/:_id/restore', (req, res, next) => getPruebaController().restore(req, res, next));

export const PruebaRoutes = router; 