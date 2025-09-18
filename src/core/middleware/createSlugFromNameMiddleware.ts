import { Request, Response, NextFunction } from 'express';
import slugify from 'slugify';

// Middleware para añadir el slug de un name
export const createSlugFromNameMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (req.body.name) {

            req.body.slug = slugify(req.body.name, { lower: true, strict: true });
        }

        return next();
    } catch (error) {
        return next(error);
    }
}; 