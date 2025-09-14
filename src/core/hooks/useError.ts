// Tipo para errores detallados
export type ErrorDetails = Record<string, string | string[] | unknown>;

// Define la clase base de error
export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;
  code: string;
  errors?: ErrorDetails; // Nuevo campo para almacenar errores detallados

  constructor(message: string, statusCode: number, code?: string, errors?: ErrorDetails) {
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

export function useBadRequestError(message: string, code = 'BAD_REQUEST', errors?: ErrorDetails): HttpError {
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

// Tipo para errores de MongoDB
interface MongoError {
  name?: string;
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
  message?: string;
}

/**
 * Helper para manejar errores de MongoDB específicos
 */
export const handleMongoError = (error: MongoError | HttpError | Error): HttpError => {
  // Type guard para MongoError
  const isMongoError = (err: unknown): err is MongoError => {
    return typeof err === 'object' && err !== null && 'code' in err;
  };

  // Detectar errores de clave duplicada (E11000)
  if (isMongoError(error) && error.name === 'MongoServerError' && error.code === 11000) {
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