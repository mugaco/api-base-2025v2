# CLI para API Base 2025

Esta herramienta de línea de comandos facilita el desarrollo de APIs utilizando la arquitectura API Base 2025. Permite generar esquemas, recursos, mocks y más funcionalidades para acelerar el desarrollo.

## Arquitectura del CLI

El CLI está estructurado bajo un patrón de composición, utilizando interfaces claras y servicios modulares:

```
src/cli/
  ├── commands/           # Comandos disponibles
  ├── core/               # Componentes centrales
  ├── interfaces/         # Interfaces para desacoplamiento
  ├── templates/          # Plantillas para generación de código
  ├── utils/              # Servicios de utilidad (FS, Console, Prompt)
  ├── cli.ts              # Punto de entrada principal
  ├── index.ts            # Inicializador del CLI
  └── README.md           # Documentación
```

## Comandos Disponibles

### Schema

Crea un nuevo esquema para definir la estructura de un recurso.

```bash
api-cli schema [opciones]
```

Opciones:
- `-n, --name <nombre>`: Nombre del esquema a crear
- `-o, --output <ruta>`: Directorio de salida para el esquema
- `-f, --force`: Sobrescribir el esquema si ya existe

### Resource

Genera un nuevo recurso completo a partir de un esquema existente.

```bash
api-cli resource [opciones]
```

Opciones:
- `-s, --schema <esquema>`: Nombre del archivo de esquema (sin extensión)
- `-o, --overwrite`: Sobrescribir archivos existentes
- `-t, --tests`: Generar tests para el recurso
- `-p, --postman`: Actualizar colección de Postman (por defecto: true)

### Mock

Genera datos ficticios para pruebas basados en modelos del sistema.

```bash
api-cli mock [opciones]
```

Opciones:
- `-m, --model <modelo>`: Nombre del modelo para generar datos (ejemplo: Content, Category)
- `-c, --count <número>`: Cantidad de registros a generar (por defecto: 10)
- `-o, --output <archivo>`: Archivo de salida para los datos generados
- `-s, --scenario <escenario>`: Escenario predefinido a generar (blog, ecommerce, cms-basico, porfolio)
- `-r, --realistic`: Generar datos más realistas (por defecto: true)
- `-f, --force-references`: Crear automáticamente datos para referencias que no existan (por defecto: true)
- `-a, --all`: Generar datos para todos los modelos disponibles
- `--format, --fmt <formato>`: Formato de salida (json, mongodb, db) (por defecto: json)

### Formatos de salida

El comando ofrece tres formatos de salida:

1. **json**: Guarda los datos generados en un archivo JSON
2. **mongodb**: Genera un script de importación para MongoDB
3. **db**: Guarda los datos directamente en la base de datos MongoDB configurada

#### Uso con formato de base de datos

```bash
# Generar 5 registros para el modelo User e insertarlos directamente en la base de datos
api-cli mock --model User --count 5 --format db

# Generar un escenario completo de blog y guardar en la base de datos
api-cli mock --scenario blog --format db 

# Generar datos para todos los modelos y guardar en la base de datos
api-cli mock --all --format db
```

### Docs

Genera documentación de API en formatos OpenAPI (Swagger) y/o Postman.

```bash
api-cli docs [opciones]
```

Opciones:
- `-a, --action <acción>`: Acción a realizar (generate, serve, convert)
- `-f, --format <formato>`: Formato de salida (openapi, postman, both)
- `-i, --input <entrada>`: Ruta o contenido de entrada
- `-o, --output <salida>`: Ruta o contenido de salida
- `-c, --config <configuración>`: Ruta al archivo de configuración

## Modo Interactivo

Si ejecutas el CLI sin ningún comando, entrará en modo interactivo, presentando un menú para seleccionar la acción deseada:

```bash
api-cli
```

## Extendiendo el CLI

Para añadir nuevos comandos, crea una nueva clase que extienda `BaseCommand` e impleméntala siguiendo el patrón existente:

```typescript
export class MiComando extends BaseCommand {
  constructor(
    consoleService: ConsoleService,
    promptService: PromptService,
    private readonly fileSystemService: FileSystemService
  ) {
    super('mi-comando', 'Descripción del comando', consoleService, promptService);
  }

  public getOptions(): CommandOption[] {
    return [
      // Definir opciones
    ];
  }

  protected async run(options: CommandOptions): Promise<void> {
    // Implementar lógica
  }
}
```

Luego, registra el comando en `cli.ts` añadiéndolo al array de comandos.

## Servicios Disponibles

### ConsoleService

Gestiona la salida en consola con diferentes niveles:

- `info()`: Mensajes informativos
- `success()`: Mensajes de éxito
- `warn()`: Advertencias
- `error()`: Errores
- `debug()`: Mensajes de depuración (solo en modo debug)

### PromptService

Maneja la entrada interactiva:

- `promptInput()`: Solicita entrada de texto
- `promptConfirm()`: Solicita confirmación (sí/no)
- `promptSelect()`: Permite seleccionar una opción de una lista
- `promptCheckbox()`: Permite seleccionar múltiples opciones

### FileSystemService

Operaciones de sistema de archivos:

- `readFile()`: Lee un archivo
- `writeFile()`: Escribe un archivo
- `readJsonFile()`: Lee un archivo JSON
- `writeJsonFile()`: Escribe un archivo JSON
- `listFiles()`: Lista archivos en un directorio
- Y muchas más...

## Funcionalidades

- Creación de esquemas de recursos
- Generación de recursos completos (modelo, repositorio, servicio, controlador, DTOs, rutas)
- Integración con Postman
- Generación de documentación de API (OpenAPI/Swagger y Postman)

## Requisitos

- Node.js >= 16
- TypeScript
- Dependencias instaladas (`npm install`)

## Uso

### Iniciar el CLI

```bash
npm run cli
```

### Generar un nuevo esquema (schema)

Este comando te permite crear un nuevo esquema para un recurso en el sistema.

```bash
npm run cli schema
```

### Generar un recurso desde un esquema (resource)

Este comando genera todos los archivos necesarios para un nuevo recurso a partir de un esquema existente.

```bash
npm run cli resource
```

### Generar datos ficticios para pruebas (mock)

Este comando permite crear datos ficticios (mock) para diferentes modelos del sistema,
basándose en sus esquemas y reglas de validación.

```bash
npm run cli mock
```

#### Modos de generación

El comando ofrece dos modos de generación:

1. **Un solo tipo de documento**: Genera múltiples instancias de un modelo específico.
2. **Escenario completo**: Genera diferentes modelos con relaciones entre ellos según escenarios predefinidos.

#### Escenarios predefinidos

- **blog-basico**: Genera 5 usuarios y 10 artículos relacionados con esos usuarios
- **admin-sistema**: Genera un usuario administrador, 10 usuarios regulares y registros de acceso

#### Opciones de almacenamiento

Los datos generados pueden:
- Guardarse directamente en la base de datos
- Exportarse a un archivo JSON
- Mostrarse en la consola (sin guardarse)

### Gestionar migraciones de base de datos (migration)

Este comando permite gestionar migraciones para realizar cambios controlados en la estructura
de la base de datos y mantener sincronizados los entornos de desarrollo y producción.

```bash
npm run cli migration
```

#### Subcomandos disponibles

- **create**: Crea una nueva migración
  ```bash
  npm run cli migration create -- --name add_nuevo_campo
  ```

- **status**: Muestra el estado de todas las migraciones
  ```bash
  npm run cli migration status
  ```

- **up**: Ejecuta las migraciones pendientes
  ```bash
  npm run cli migration up             # Ejecuta todas las migraciones pendientes
  npm run cli migration up -- --steps 2  # Ejecuta solo las 2 próximas migraciones
  ```

- **down**: Revierte migraciones aplicadas
  ```bash
  npm run cli migration down           # Revierte la última migración
  npm run cli migration down -- --steps 3  # Revierte las últimas 3 migraciones
  ```

- **refresh**: Revierte y vuelve a aplicar migraciones
  ```bash
  npm run cli migration refresh        # Refresca todas las migraciones
  npm run cli migration refresh -- --steps 2  # Refresca las últimas 2 migraciones
  ```

#### Estructura de las migraciones

Cada migración tiene métodos `up()` y `down()`:
- **up**: Código para aplicar la migración
- **down**: Código para revertir la migración

Ejemplo:
```typescript
export default {
  name: 'add_views_field',
  up: async (db) => {
    await db.collection('contents').updateMany({}, { $set: { views: 0 } });
  },
  down: async (db) => {
    await db.collection('contents').updateMany({}, { $unset: { views: "" } });
  }
};
```

#### Requisitos para ejecutar migraciones

Para ejecutar las migraciones, se requiere:

1. **Conexión activa a MongoDB**: El sistema verificará que existe una conexión activa antes de ejecutar cualquier migración.
2. **Roles adecuados**: El usuario de la base de datos debe tener permisos para modificar esquemas y datos.

Para los comandos que requieren conexión a la base de datos (status, up, down, refresh), primero debes asegurarte de que la aplicación está conectada a MongoDB. Típicamente, esto significa:

```bash
# Opción 1: Ejecutar la aplicación en modo desarrollo
npm run dev

# Opción 2: En otra terminal, ejecutar las migraciones
npm run cli migration status
```

## Estructura de esquemas

Los esquemas son archivos JSON ubicados en el directorio `/schemas` y definen la estructura de los recursos:

```json
{
  "name": "content",
  "description": "Descripción del recurso",
  "apiPath": "contents",
  "timestamps": true,
  "softDelete": true,
  "fields": [
    {
      "name": "title",
      "type": "string",
      "required": true,
      "min": 3,
      "description": "Título del contenido"
    },
    // ... más campos
  ],
  "routesMiddlewares": {
    "getAll": {
      "middlewares": ["authenticate"]
    },
    // ... configuración para otras rutas
  }
}
```

## Tipos de campos soportados

- `string`: Para textos
- `email`: Para direcciones de correo
- `number`: Para valores numéricos
- `boolean`: Para valores verdadero/falso
- `date`: Para fechas
- `array`: Para listas
- `object`: Para objetos

## Personalización

Las plantillas utilizadas para generar los archivos se encuentran en `src/cli/templates` y utilizan Handlebars para el formateo. Puedes personalizarlas según tus necesidades.

## Integración con el proyecto

Los recursos generados se crean en el directorio `src/api/entities/{NombreDelRecurso}` y se integran automáticamente con la configuración de rutas del proyecto.

## Contribución

Puedes contribuir al desarrollo de este CLI mejorando las plantillas, añadiendo nuevas funcionalidades o corrigiendo errores.

## Comandos disponibles

### Comando `schema`

Permite crear y gestionar esquemas de recursos.

```bash
# Crear un nuevo esquema
api-cli schema create --name Usuario
```

### Comando `resource`

Genera código para un recurso basado en un esquema existente.

```bash
# Generar un recurso
api-cli resource generate --schema Usuario
```

### Comando `mock`

Genera datos ficticios para pruebas.

```bash
# Generar datos de prueba
api-cli mock --schema Usuario --count 20
```

### Comando `docs`

Genera documentación de API en formatos OpenAPI (Swagger) y/o Postman.

```bash
# Generar documentación en ambos formatos
api-cli docs --action generate --format both

# Generar solo documentación OpenAPI
api-cli docs --action generate --format openapi

# Iniciar un servidor para visualizar la documentación Swagger UI
api-cli docs --action serve --input openapi.yaml --port 3001

# Convertir entre formatos
api-cli docs --action convert --source openapi --target postman --input openapi.yaml --output postman.json
```

#### Configuración de la documentación

El comando de documentación busca recursos en las rutas predefinidas `src/api/entities` y `src/core/entities`. 
Puedes personalizar las ubicaciones y otros parámetros creando un archivo `docs.config.json` en la raíz del proyecto:

```json
{
  "resourceDirectories": [
    "src/api/entities",
    "src/core/entities",
    "src/other/custom/path"
  ],
  "apiTitle": "Mi API Personalizada",
  "apiVersion": "2.0.0",
  "apiDescription": "Descripción personalizada de la API"
}
```

También puedes especificar una ruta a un archivo de configuración personalizado:

```bash
api-cli docs --action generate --config my-custom-config.json
``` 