/**
 * Servicio para Product
 */
import { BaseService } from '@core/base/BaseService';
import { ProductRepository } from './ProductRepository';
import { IProduct } from './ProductModel';
import { ICreateProduct, IUpdateProduct, IProductResponse } from './ProductSchema';

/**
 * Servicio para la entidad Product
 * Extiende BaseService para heredar operaciones CRUD estándar
 */
export class ProductService extends BaseService<
  IProduct,
  IProductResponse,
  ICreateProduct,
  IUpdateProduct
> {
  constructor(productRepository: ProductRepository) {
    super(productRepository);
  }

  // Métodos adicionales específicos del recurso pueden añadirse aquí
  // Los métodos CRUD estándar son heredados de BaseService:
  // - getAll
  // - findById
  // - findOne
  // - create
  // - update
  // - delete
  // - getPaginated
  // - softDelete (si está habilitado)
  // - restore (si está habilitado)
  // - search

  /**
   * Ejemplo de método personalizado específico del recurso
   * Descomentar y modificar según necesidad
   */
  /*
  async findByField(value: string): Promise<IProductResponse | null> {
    const result = await this.repository.findOne({ field: value });
    return result as IProductResponse | null;
  }
  */
}