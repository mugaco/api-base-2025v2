import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@core/services/TokenService';
import { useUnauthorizedError } from '@core/hooks/useError';
import { IAuthTokenPayload } from '@core/domain/entities/Access/AccessSchema';

// Servicio de tokens
const tokenService = new TokenService();

// Middleware para verificar si hay un token y es válido
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw useUnauthorizedError('Acceso no autorizado. Token no proporcionado');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Utilizar el servicio de tokens para verificar
    tokenService.verifyToken<IAuthTokenPayload>(token)
      .then(decoded => {
        // Añadir usuario al objeto request
        req.user = decoded;

        // Añadir user_id al body solo en métodos que suelen tener body
        const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (methodsWithBody.includes(req.method) && req.body) {
          req.body.user_id = req.user?._id;
        }
        
        next();
      })
      .catch(error => {
        next(useUnauthorizedError('Token inválido o expirado: ' + error.message));
      });
  } catch (error) {
    next(error);
  }
};

