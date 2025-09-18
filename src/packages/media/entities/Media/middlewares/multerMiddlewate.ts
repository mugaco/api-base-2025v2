import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { multerConfig, maxMultifileUpload } from '@/packages/media/config/multer.config';
import { useBadRequestError } from '@/core/hooks/useError';

// Configuración de multer con almacenamiento en memoria
const memoryStorage = multer.memoryStorage();

// Middleware multer básico para almacenar archivos en memoria
const upload = multer({
  storage: memoryStorage,
  ...multerConfig
});

// Middleware para subir un solo archivo
export const uploadSingleFile = upload.single('file');

// Middleware para subir múltiples archivos
export const uploadMultipleFiles = upload.array('files', maxMultifileUpload); // máximo 10 archivos

// Middleware para manejar errores de multer
export const handleMulterError = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeInMB = multerConfig.limits?.fileSize ? (multerConfig.limits.fileSize / (1024 * 1024)) : 1;
      return next(useBadRequestError(
        `El archivo excede el tamaño máximo permitido de ${maxSizeInMB}MB`,
        'FILE_SIZE_LIMIT_EXCEEDED'
      ));
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(useBadRequestError(
        `No se pueden subir más de ${maxMultifileUpload} archivos simultáneamente. Has intentado subir demasiados archivos.`,
        'FILE_COUNT_LIMIT_EXCEEDED'
      ));
    }
    // Proporcionar más contexto para otros errores de multer
    return next(useBadRequestError(
      `Error en la subida de archivo(s): ${err.message} (${err.code})`,
      'FILE_UPLOAD_ERROR'
    ));
  }
  next(err);
};

// Middleware compuesto para subir un solo archivo con manejo de errores
export const handleSingleFileUpload = [
  uploadSingleFile,
  handleMulterError
];

// Middleware compuesto para subir múltiples archivos con manejo de errores
export const handleMultipleFilesUpload = [
  uploadMultipleFiles,
  handleMulterError
];

