import { Request, Response, NextFunction } from 'express';

export const addLibrarySlugNameMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (req.body.library) {
            // Verificar si library ya es un objeto o si es un string que necesita ser parseado
            const library = typeof req.body.library === 'string' 
                ? JSON.parse(req.body.library) 
                : req.body.library;
            
            req.body.libraryId = library._id;
            req.body.library_slug = library.slug;
            req.body.library_name = library.name;
        }
        return next();
    } catch (error) {
        return next(error);
    }
}; 