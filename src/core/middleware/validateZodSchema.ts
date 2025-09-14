// validateZodSchema

import { ZodError, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { useBadRequestError } from '@core/hooks/useError';


/**
 * Función de orden superior que retorna un middleware de Express.
 * Este middleware valida el cuerpo de la solicitud usando un esquema de Zod dado.
 * 
 * @param schema El esquema de Zod para la validación.
 * @returns Un middleware de Express que realiza la validación.
 */
const validateZodSchema = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            schema.parse({...req.body,...req.params});
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Transformar errores de Zod al formato ErrorDetails
                const errorDetails = error.errors.reduce((acc, issue) => {
                    const field = issue.path.join('.');
                    if (!acc[field]) {
                        acc[field] = [];
                    }
                    (acc[field] as string[]).push(issue.message);
                    return acc;
                }, {} as Record<string, string[]>);

                next(useBadRequestError('Error de validación', 'BAD_REQUEST', errorDetails));
            } else {
                next(error);
            }
        }
    };
};

export default validateZodSchema;
