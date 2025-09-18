# Servicio de Almacenamiento

Este servicio proporciona una implementación modular y extensible para el almacenamiento de archivos en nuestra aplicación Node.js con Express 5.x y TypeScript. Permite cambiar fácilmente entre diferentes proveedores de almacenamiento como MinIO, Amazon S3 o almacenamiento local.

## Características

- Arquitectura modular que permite cambiar fácilmente entre diferentes proveedores
- Soporte para múltiples proveedores (MinIO, Local, etc.)
- Interfaz unificada para todas las operaciones
- Manejo de errores robusto
- Verificación de configuración
- Integración con Multer para la recepción de archivos

## Configuración

El servicio se configura a través de variables de entorno:

```
# Proveedor de almacenamiento a utilizar: "minio" o "local"
STORAGE_PROVIDER=minio

# Configuración de MinIO
MINIO_ENDPOINT=play.min.io
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=mediafiles

# Configuración para almacenamiento local (para futura implementación)
LOCAL_STORAGE_PATH=./uploads
LOCAL_STORAGE_BASE_URL=/media
```

## Ejemplos de uso

### Almacenar un archivo individual

```typescript
import { storageService } from '@core/services/StorageService';
import { Request, Response, NextFunction } from 'express';

// Ejemplo de controller para almacenar un archivo
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.file viene del middleware de Multer
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Almacenar el archivo usando el servicio
    const result = await storageService.storeFile(req.file, {
      path: 'documentos',
      isPublic: true,
    });

    // Devolver el resultado
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
```

### Almacenar múltiples archivos

```typescript
import { storageService } from '@core/services/StorageService';
import { Request, Response, NextFunction } from 'express';

// Ejemplo de controller para almacenar múltiples archivos
export const uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.files viene del middleware de Multer
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han subido archivos' });
    }

    // Almacenar los archivos usando el servicio
    const results = await storageService.storeFiles(req.files, {
      path: 'imagenes',
      isPublic: true,
    });

    // Devolver los resultados
    return res.status(201).json(results);
  } catch (error) {
    next(error);
  }
};
```

### Obtener la URL de un archivo

```typescript
import { storageService } from '@core/services/StorageService';

async function getFileUrl(fileId: string, isPublic: boolean = false) {
  try {
    const url = await storageService.getFileUrl(fileId, {
      forcePublic: isPublic,
      expiresIn: 3600, // 1 hora para URLs firmadas
    });

    return url;
  } catch (error) {
    console.error('Error al obtener URL del archivo:', error);
    throw error;
  }
}
```

### Servir archivos en aplicaciones frontend

Para servir archivos en aplicaciones frontend (especialmente imágenes en etiquetas HTML), existen dos enfoques:

1. **Redirección (enfoque estándar)**

   - Más eficiente en términos de uso de recursos del servidor
   - URL del tipo: `/api/media-public/{library_slug}/{file_slug}`
   - Redirige al cliente a una URL firmada de Minio

2. **Proxy (optimizado para compatibilidad con etiquetas HTML)**
   - Garantiza la compatibilidad con etiquetas `<img>`, `<v-img>` y frameworks frontend
   - URL del tipo: `/api/media-public/proxy/{library_slug}/{file_slug}`
   - El servidor actúa como proxy y transmite los datos binarios
   - Incluye optimizaciones de caché HTTP
   - Soluciona problemas de CORS con redirecciones

**Ejemplo de uso en frontend:**

```html
<!-- Uso recomendado para imágenes en etiquetas HTML -->
<img src="/api/media-public/proxy/my-library/thumbmd-my-image.png" />

<!-- Para archivos que se descargan directamente en el navegador -->
<a href="/api/media-public/my-library/document.pdf">Ver documento</a>
```

### Eliminar un archivo

```typescript
import { storageService } from '@core/services/StorageService';

async function deleteFile(fileId: string) {
  try {
    const success = await storageService.deleteFile(fileId);

    if (success) {
      console.log(`Archivo ${fileId} eliminado correctamente`);
    } else {
      console.error(`No se pudo eliminar el archivo ${fileId}`);
    }

    return success;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    throw error;
  }
}
```

## Extensibilidad

Para añadir un nuevo proveedor de almacenamiento, solo es necesario:

1. Implementar la interfaz `StorageTransport`
2. Añadir la configuración en `storage.config.ts`
3. Actualizar las variables de entorno

Por ejemplo, para añadir soporte para Amazon S3, se crearía un archivo `s3.transport.ts` que implemente la interfaz `StorageTransport` y se añadiría el caso correspondiente en la función `getConfiguredTransport` de `storage.config.ts`.
