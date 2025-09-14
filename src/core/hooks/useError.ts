// Define la clase base de error
export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;
  code: string;
  errors?: any; // Nuevo campo para almacenar errores detallados

  constructor(message: string, statusCode: number, code?: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indica si es un error operacional conocido
    this.code = code || this.getDefaultCode(statusCode);
    this.errors = errors; // Asignar los errores detallados si se proporcionan

    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultCode(statusCode: number): string {
    switch(statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 500: return 'INTERNAL_SERVER_ERROR';
      default: return `ERROR_${statusCode}`;
    }
  }
}

// Hooks para crear errores HTTP
export function useNotFoundError(resource: string): HttpError {
  return new HttpError(`${resource} no encontrado`, 404, 'NOT_FOUND');
}

export function useBadRequestError(message: string, code = 'BAD_REQUEST', errors?: any): HttpError {
  return new HttpError(message, 400, code, errors);
}

export function useUnauthorizedError(message = 'No autorizado', code = 'UNAUTHORIZED'): HttpError {
  return new HttpError(message, 401, code);
}

export function useForbiddenError(message = 'Acceso prohibido', code = 'FORBIDDEN'): HttpError {
  return new HttpError(message, 403, code);
}

export function useInternalServerError(message = 'Error interno del servidor', code = 'INTERNAL_SERVER_ERROR'): HttpError {
  return new HttpError(message, 500, code);
}

/**
 * Helper para manejar errores de MongoDB específicos
 */
export const handleMongoError = (error: any): HttpError => {
  // Detectar errores de clave duplicada (E11000)
  if (error.name === 'MongoServerError' && error.code === 11000) {
    // Extraer información del error
    const keyPattern = error.keyPattern || {};
    const keyValue = error.keyValue || {};
    
    // Si el error es sobre un archivo duplicado
    if (keyPattern.originalFilename && keyPattern.library_id) {
      return useBadRequestError(
        `Ya existe un archivo con el nombre "${keyValue.originalFilename}" en esta biblioteca`,
        'FILE_ALREADY_EXISTS',
        { originalFilename: ['Ya existe un archivo con este nombre en esta biblioteca'] }
      );
    }
    
    // Manejo general de duplicidad para otros casos
    const fieldName = Object.keys(keyValue).join(', ');
    return useBadRequestError(
      `Elemento duplicado: ${fieldName}`,
      'DUPLICATE_ENTITY',
      { [fieldName]: ['Este valor ya existe en el sistema'] }
    );
  }
  
  // Retornar el error original para otros casos
  if (error instanceof HttpError) {
    return error;
  }
  
  // Convertir cualquier otro error en un error del servidor
  return useInternalServerError(error.message || 'Error inesperado en la base de datos');
};

// // Funciones con nombres antiguos para mantener compatibilidad
// export const AppError = HttpError;
// export const notFoundError = useNotFoundError;
// export const badRequestError = useBadRequestError;
// export const unauthorizedError = useUnauthorizedError;
// export const forbiddenError = useForbiddenError;
// export const internalServerError = useInternalServerError; 