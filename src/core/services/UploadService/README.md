# Servicio de Subida de Archivos (UploadService)

## Descripción

Este servicio es responsable de manejar todas las operaciones relacionadas con la subida de archivos y el procesamiento de imágenes. Está diseñado para trabajar conjuntamente con el `StorageService`, que se encarga del almacenamiento físico de los archivos.

## Funcionalidades

- Subida de archivos individuales
- Subida de múltiples archivos
- Subida de imágenes con generación automática de thumbnails
- Validación de tipos de archivos
- Integración con el sistema de almacenamiento

## Arquitectura

El servicio sigue una arquitectura basada en inyección de dependencias y está compuesto por:

- **Interfaz:** `UploadServiceInterface` define el contrato que debe implementar el servicio.
- **Servicio:** `UploadService` implementa la lógica de procesamiento de archivos y delegación al almacenamiento.
- **Hook:** `useUpload` proporciona una forma sencilla de acceder al servicio desde controladores y otros componentes.

## Uso desde un controlador

```typescript
// En un controlador
import { useUpload } from '@core/hooks/useUpload';

export class SomeController {
  async uploadEndpoint(req, res, next) {
    try {
      const { uploadSingleFile } = useUpload();

      const result = await uploadSingleFile(req.file, {
        libraryId: 'some-library-_id',
        userId: 'user-_id',
        // Más opciones...
      });

      // Guardar en base de datos...

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

## Diagrama de Flujo

```
┌───────────┐    ┌─────────────┐    ┌───────────────┐
│ Controller│───>│ UploadService│───>│ StorageService│
└───────────┘    └─────────────┘    └───────────────┘
      │                │                    │
      │                │                    │
      │                ▼                    │
      │          ┌───────────┐             │
      │          │ImageService│             │
      │          └───────────┘             │
      │                                    │
      ▼                                    ▼
┌─────────────┐                     ┌──────────────┐
│ MediaService│                     │ Storage (S3, │
│ (MongoDB)   │                     │ Local, etc)  │
└─────────────┘                     └──────────────┘
```

## Proceso de Subida de Imágenes

1. Recepción del archivo en el controlador
2. Validación del archivo (tipo, tamaño, etc.)
3. Procesamiento de la imagen (thumbnails)
4. Almacenamiento físico de los archivos
5. Creación del registro en la base de datos

## Ventajas

- **Separación de responsabilidades:** Cada servicio tiene una responsabilidad clara.
- **Reusabilidad:** Los servicios pueden ser utilizados en diferentes partes de la aplicación.
- **Mantenibilidad:** La lógica de subida está centralizada y es fácil de mantener.
- **Testabilidad:** Cada componente puede ser probado de forma aislada.
