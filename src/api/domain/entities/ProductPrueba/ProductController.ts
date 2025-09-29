/**
 * Controlador para Product
 */
import { BaseController } from '@core/base/BaseController';
import { ProductService } from './ProductService';

/**
 * Controlador para la entidad Product heredando de BaseController
 */
export class ProductController extends BaseController<ProductService> {
  constructor(productService: ProductService) {
    super(productService);
  }

  // Aquí puedes sobrescribir cualquier método de BaseController si necesitas
  // comportamiento específico para Product. Por ejemplo:

  // create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const data = req.body as ICreateProduct;
  //     // Lógica específica para crear una Product
  //     const newItem = await this.service.create(data);
  //     this.sendSuccessResponse(res, newItem, 201);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const _id = req.params._id;
  //     const data = req.body as IUpdateProduct;
  //     // Lógica específica para actualizar una Product
  //     const updatedItem = await this.service.update(_id, data);
  //     this.sendSuccessResponse(res, updatedItem);
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}