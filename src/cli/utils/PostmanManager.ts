/**
 * Gestor para colecciones de Postman
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { FileUtils } from './FileUtils';
import { StringUtils } from './StringUtils';
import { DataSource } from '../interfaces/DataSourceInterfaces';
import { ExampleGenerator } from './ExampleGenerator';
import { PostmanResponseGenerator } from './PostmanResponseGenerator';
import { getDocsConfig } from '../config/docs.config';

interface RouteInfo {
  method: string;
  path: string;
  description?: string;
}

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: any[];
    body?: any;
    url: {
      raw: string;
      host: string[];
      path: string[];
    };
    description?: string;
  };
  response: any[];
  event?: {
    listen: string;
    script: {
      type: string;
      exec: string[];
    };
  }[];
}

interface PostmanFolder {
  name: string;
  item: PostmanRequest[];
  description?: string;
}

interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: (PostmanFolder | PostmanRequest)[];
}

interface PostmanEnvironmentValue {
  key: string;
  value: any;
  enabled: boolean;
}

interface PostmanEnvironment {
  _id: string;
  name: string;
  values: PostmanEnvironmentValue[];
}

export class PostmanManager {
  private collectionPath: string;
  private environmentPath: string;
  private collection: PostmanCollection;
  private environment: PostmanEnvironment;
  private exampleGenerator: ExampleGenerator;
  private responseGenerator: PostmanResponseGenerator;
  private docsConfig: ReturnType<typeof getDocsConfig>;

  constructor() {
    const { rootDir } = FileUtils.getProjectPaths();
    this.collectionPath = path.join(rootDir, 'postman_collection.json');
    this.environmentPath = path.join(rootDir, 'postman_environment.json');
    
    this.exampleGenerator = new ExampleGenerator();
    this.responseGenerator = new PostmanResponseGenerator();
    this.docsConfig = getDocsConfig();
    
    this.initializeCollection();
    this.initializeEnvironment();
  }

  /**
   * Inicializa o lee la colección existente
   */
  private initializeCollection(): void {
    try {
      if (FileUtils.fileExists(this.collectionPath)) {
        this.collection = FileUtils.readJsonFile<PostmanCollection>(this.collectionPath);
      } else {
        // Crear una nueva colección
        this.collection = {
          info: {
            name: this.docsConfig.apiTitle,
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
          },
          item: []
        };
        FileUtils.writeJsonFile(this.collectionPath, this.collection);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al inicializar la colección de Postman:', error);
      throw error;
    }
  }

  /**
   * Inicializa o lee el environment existente
   */
  private initializeEnvironment(): void {
    try {
      // Cargar variables de entorno
      const { rootDir } = FileUtils.getProjectPaths();
      dotenv.config({ path: path.join(rootDir, '.env') });
      
      // Obtener base_url desde variables de entorno o usar valor por defecto
      const baseUrl = process.env.BASE_URL || 'localhost:3000';
      const baseUrlPrefix = baseUrl.startsWith('http') ? '' : 'http://';
      
      if (FileUtils.fileExists(this.environmentPath)) {
        this.environment = FileUtils.readJsonFile<PostmanEnvironment>(this.environmentPath);
        
        // Actualizar base_url si existe en el environment
        const baseUrlVar = this.environment.values.find(v => v.key === 'base_url');
        if (baseUrlVar) {
          baseUrlVar.value = `${baseUrlPrefix}${baseUrl}`;
        } else {
          this.environment.values.push({
            key: 'base_url',
            value: `${baseUrlPrefix}${baseUrl}`,
            enabled: true
          });
        }
      } else {
        // Crear un nuevo environment
        this.environment = {
          _id: this.generateUUID(),
          name: `${this.docsConfig.apiTitle} Environment`,
          values: [
            {
              key: 'base_url',
              value: `${baseUrlPrefix}${baseUrl}`,
              enabled: true
            },
            {
              key: 'access_token',
              value: "",
              enabled: true
            },
            {
              key: 'refresh_token',
              value: "",
              enabled: true
            },
            {
              key: 'auth_token',
              value: "",
              enabled: true
            }
          ]
        };
      }
      
      // Asegurar que existan las variables de autenticación en cualquier caso
      this.addEnvironmentVariable('access_token');
      this.addEnvironmentVariable('refresh_token');
      this.addEnvironmentVariable('auth_token');
      
      FileUtils.writeJsonFile(this.environmentPath, this.environment);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al inicializar el environment de Postman:', error);
      throw error;
    }
  }

  /**
   * Genera un UUID simple para IDs de Postman
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Agrega o actualiza una variable en el environment
   */
  private addEnvironmentVariable(key: string, value: any = ''): void {
    const existingVariable = this.environment.values.find(v => v.key === key);
    if (existingVariable) {
      if (value) existingVariable.value = value;
    } else {
      this.environment.values.push({
        key,
        value,
        enabled: true
      });
    }
  }

  /**
   * Añade una carpeta de recurso con sus rutas a la colección
   */
  public addResourceFolder(
    resourceName: string, 
    routes: RouteInfo[], 
    apiBasePath: string = ''
  ): void {
    const resourceNameLower = StringUtils.toCamelCase(resourceName);
    const resourceIdParam = `${resourceNameLower}Id`;
    
    // Añadir variable de ID para este recurso
    this.addEnvironmentVariable(resourceIdParam);
    
    // Crear la carpeta para el recurso
    const folder: PostmanFolder = {
      name: StringUtils.toPascalCase(resourceName),
      item: routes.map(route => {
        const method = route.method.toUpperCase();
        const isGetById = method === 'GET' && route.path.includes(`:${resourceIdParam}`);
        const isCreate = method === 'POST';
        
        // Formatear la ruta reemplazando parámetros con variables de Postman
        const formattedPath = route.path.split('/').filter(Boolean).map(segment => {
          if (segment.startsWith(':')) {
            const paramName = segment.substring(1);
            
            // Si el parámetro es '_id' y estamos en una ruta específica del recurso,
            // usar el nombre específico del recurso (resourceIdParam)
            const variableName = (paramName === '_id') ? resourceIdParam : paramName;
            
            // Asegurar que existe la variable
            this.addEnvironmentVariable(variableName);
            
            return `{{${variableName}}}`;
          }
          return segment;
        });
        
        // Construir la ruta formateada completa como string
        const formattedPathString = '/' + formattedPath.join('/');
        
        // Construir el objeto de request de Postman
        const request: PostmanRequest = {
          name: `${method} ${route.path}`,
          request: {
            method,
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            url: {
              raw: `{{base_url}}${apiBasePath ? '/' + apiBasePath : ''}${formattedPathString}`,
              host: ['{{base_url}}'],
              path: [...(apiBasePath ? apiBasePath.split('/').filter(Boolean) : []), ...formattedPath]
            },
            description: route.description
          },
          response: []
        };
        
        // Configurar body para métodos POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          request.request.body = {
            mode: 'raw',
            raw: '{\n  // Add request body here\n}',
            options: {
              raw: {
                language: 'json'
              }
            }
          };
        }
        
        return request;
      })
    };
    
    // Buscar si ya existe una carpeta para este recurso
    const existingFolderIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === folder.name
    );
    
    if (existingFolderIndex >= 0) {
      // Actualizar la carpeta existente
      this.collection.item[existingFolderIndex] = folder;
    } else {
      // Añadir la nueva carpeta
      this.collection.item.push(folder);
    }
    
    // Guardar los cambios
    this.saveCollection();
    this.saveEnvironment();
  }

  /**
   * Añade una carpeta de recurso con documentación mejorada (ejemplos y descripciones)
   */
  public addEnhancedResourceFolder(
    resourceName: string, 
    routes: RouteInfo[], 
    apiBasePath: string = '',
    schema: DataSource
  ): void {
    const resourceNameLower = StringUtils.toCamelCase(resourceName);
    const resourceIdParam = `${resourceNameLower}Id`;
    
    // Añadir variable de ID para este recurso
    this.addEnvironmentVariable(resourceIdParam);
    
    // Crear la carpeta para el recurso con descripción
    const folder: PostmanFolder = {
      name: StringUtils.toPascalCase(resourceName),
      description: schema.description || `API para gestionar ${resourceName}`,
      item: routes.map(route => {
        const method = route.method.toUpperCase();
        const isGetById = method === 'GET' && route.path.includes(`:${resourceIdParam}`);
        const isPaginated = method === 'GET' && route.path.includes('paginated');
        
        // Formatear la ruta reemplazando parámetros con variables de Postman
        const formattedPath = route.path.split('/').filter(Boolean).map(segment => {
          if (segment.startsWith(':')) {
            const paramName = segment.substring(1);
            
            // Si el parámetro es '_id' y estamos en una ruta específica del recurso,
            // usar el nombre específico del recurso (resourceIdParam)
            const variableName = (paramName === '_id') ? resourceIdParam : paramName;
            
            // Asegurar que existe la variable
            this.addEnvironmentVariable(variableName);
            
            return `{{${variableName}}}`;
          }
          return segment;
        });
        
        // Construir la ruta formateada completa como string
        const formattedPathString = '/' + formattedPath.join('/');
        
        // Construir el objeto de request de Postman
        const request: PostmanRequest = {
          name: `${method} ${route.path}`,
          request: {
            method,
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              },
              {
                key: 'Authorization',
                value: 'Bearer {{accessToken}}',
                disabled: true
              }
            ],
            url: {
              raw: `{{base_url}}${apiBasePath ? '/' + apiBasePath : ''}${formattedPathString}`,
              host: ['{{base_url}}'],
              path: [...(apiBasePath ? apiBasePath.split('/').filter(Boolean) : []), ...formattedPath]
            },
            description: this.buildRequestDescription(route, schema)
          },
          response: []
        };
        
        // Configurar body para métodos POST/PUT/PATCH con ejemplos
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          let exampleObject;
          
          if (method === 'POST') {
            exampleObject = this.exampleGenerator.generateCreateExample(schema);
          } else {
            exampleObject = this.exampleGenerator.generateUpdateExample(schema);
          }
          
          const exampleJson = JSON.stringify(exampleObject, null, 2);
          
          request.request.body = {
            mode: 'raw',
            raw: exampleJson,
            options: {
              raw: {
                language: 'json'
              }
            }
          };
        }
        
        // Añadir ejemplos de respuesta
        request.response = [
          this.responseGenerator.generateSuccessResponse(method, schema, request.request, isPaginated)
        ];
        
        // Añadir ejemplos de error
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          request.response.push(
            this.responseGenerator.generateErrorResponse(method, 'validation', request.request)
          );
        }
        
        if (['GET', 'PUT', 'DELETE'].includes(method) && isGetById) {
          request.response.push(
            this.responseGenerator.generateErrorResponse(method, 'notFound', request.request)
          );
        }
        
        // Añadir ejemplo de error de autenticación si la ruta requiere autenticación
        const routeType = this.getRouteType(method, isGetById, isPaginated);
        if (schema.routesMiddlewares && 
            schema.routesMiddlewares[routeType] && 
            schema.routesMiddlewares[routeType].middlewares.includes('authenticate')) {
          request.response.push(
            this.responseGenerator.generateErrorResponse(method, 'unauthorized', request.request)
          );
        }
        
        return request;
      })
    };
    
    // Buscar si ya existe una carpeta para este recurso
    const existingFolderIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === folder.name
    );
    
    if (existingFolderIndex >= 0) {
      // Actualizar la carpeta existente
      this.collection.item[existingFolderIndex] = folder;
    } else {
      // Añadir la nueva carpeta
      this.collection.item.push(folder);
    }
    
    // Guardar los cambios
    this.saveCollection();
    this.saveEnvironment();
  }

  /**
   * Construye una descripción detallada para una petición
   */
  private buildRequestDescription(route: RouteInfo, schema: DataSource): string {
    const method = route.method.toUpperCase();
    const isGetById = route.path.includes(':');
    const isPaginated = route.path.includes('paginated');
    
    let description = route.description || '';
    
    // Añadir información de autenticación
    const routeType = this.getRouteType(method, isGetById, isPaginated);
    if (schema.routesMiddlewares && 
        schema.routesMiddlewares[routeType] && 
        schema.routesMiddlewares[routeType].middlewares.includes('authenticate')) {
      description += '\n\n**Requiere autenticación**: Sí';
    } else {
      description += '\n\n**Requiere autenticación**: No';
    }
    
    // Añadir información de parámetros
    if (isGetById) {
      const paramName = route.path.split('/').find(segment => segment.startsWith(':'))?.substring(1);
      if (paramName) {
        description += `\n\n**Parámetros**:\n- \`${paramName}\`: ID único del recurso`;
      }
    }
    
    // Añadir información de paginación
    if (isPaginated) {
      description += '\n\n**Paginación**:';
      description += '\n- \`page\`: Número de página (por defecto: 1)';
      description += '\n- \`itemsPerPage\`: Elementos por página (por defecto: 10)';
    }
    
    // Añadir información sobre el cuerpo para métodos que lo requieren
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      description += '\n\n**Cuerpo de la petición**:';
      const requiredFields = schema.fields.filter(f => f.required).map(f => f.name);
      
      if (method === 'POST' && requiredFields.length > 0) {
        description += `\nCampos requeridos: ${requiredFields.map(f => `\`${f}\``).join(', ')}`;
      } else if (method === 'PUT' || method === 'PATCH') {
        description += '\nTodos los campos son opcionales para actualizaciones parciales.';
      }
    }
    
    return description;
  }

  /**
   * Obtiene el tipo de ruta basado en el método y características
   */
  private getRouteType(method: string, isGetById: boolean, isPaginated: boolean): string {
    if (method === 'GET') {
      if (isPaginated) return 'getPaginated';
      if (isGetById) return 'getById';
      return 'getAll';
    }
    
    if (method === 'POST') return 'create';
    if (method === 'PUT') return 'update';
    if (method === 'DELETE') return 'delete';
    
    return 'getAll'; // Por defecto
  }

  /**
   * Añade información general de la API a la colección
   */
  public addApiOverview(): void {
    // Crear una carpeta para la información general
    const overviewFolder: PostmanFolder = {
      name: "Información General",
      description: `Información general sobre ${this.docsConfig.apiTitle}`,
      item: [
        {
          name: "Introducción",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}",
              host: ["{{base_url}}"],
              path: []
            },
            description: `# ${this.docsConfig.apiTitle}

${this.docsConfig.apiDescription || 'Esta API proporciona acceso completo a la funcionalidad del sistema, permitiendo la gestión de contenidos, usuarios, archivos y más.'}

## Características principales

- Gestión completa de contenidos
- Autenticación segura mediante JWT
- Sistema de roles y permisos
- Subida y gestión de archivos
- API RESTful con soporte para paginación, ordenación y filtrado

## Base URL

Todas las solicitudes deben realizarse a la URL base: \`{{base_url}}\``
          },
          response: []
        }
      ]
    };
    
    // Añadir o actualizar la carpeta en la colección
    const existingIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === overviewFolder.name
    );
    
    if (existingIndex >= 0) {
      this.collection.item[existingIndex] = overviewFolder;
    } else {
      // Añadir al principio de la colección
      this.collection.item.unshift(overviewFolder);
    }
    
    this.saveCollection();
  }

  /**
   * Añade documentación sobre autenticación a la colección
   */
  public addAuthenticationDocs(): void {
    // Crear una carpeta para la información de autenticación
    const authFolder: PostmanFolder = {
      name: "Autenticación",
      description: "Información sobre autenticación y gestión de sesiones",
      item: [
        {
          name: "Información de Autenticación",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/auth",
              host: ["{{base_url}}"],
              path: ["auth"]
            },
            description: `# Autenticación

La API utiliza autenticación basada en tokens JWT (JSON Web Tokens).

## Proceso de autenticación

1. Obtener token de acceso mediante login (\`POST /auth/login\`)
2. Incluir el token en el encabezado Authorization: \`Bearer {token}\`
3. Cuando el token expire, utilizar el refresh token (\`POST /auth/refresh-token\`)

## Variables de entorno disponibles

- \`access_token\`: Token JWT principal para autenticación
- \`refresh_token\`: Token de actualización para renovar el access_token
- \`auth_token\`: Alias para access_token (compatible con ambos nombres)

Para usar estas variables en las peticiones, incluye el header:
\`Authorization: Bearer {{access_token}}\`

## Seguridad

- Los tokens de acceso expiran después de 1 hora
- Los refresh tokens expiran después de 7 días
- Para cerrar sesión, revocar el refresh token (\`POST /auth/logout\`)`
          },
          response: []
        },
        {
          name: "Login",
          request: {
            method: "POST",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "usuario@ejemplo.com",
                password: "contraseña123"
              }, null, 2),
              options: {
                raw: {
                  language: "json"
                }
              }
            },
            url: {
              raw: "{{base_url}}/auth/login",
              host: ["{{base_url}}"],
              path: ["auth", "login"]
            },
            description: "Inicia sesión y obtiene tokens de acceso y refresco"
          },
          response: [
            {
              name: "Login exitoso",
              originalRequest: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    email: "usuario@ejemplo.com",
                    password: "contraseña123"
                  }, null, 2),
                  options: {
                    raw: {
                      language: "json"
                    }
                  }
                },
                url: {
                  raw: "{{base_url}}/auth/login",
                  host: ["{{base_url}}"],
                  path: ["auth", "login"]
                }
              },
              status: "OK",
              code: 200,
              _postman_previewlanguage: "json",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              cookie: [],
              body: JSON.stringify({
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: 3600,
                user: {
                  _id: "60d21b4667d0d8992e610c85",
                  name: "Usuario Ejemplo",
                  email: "usuario@ejemplo.com",
                  role: "user"
                }
              }, null, 2)
            }
          ],
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "// Guardar tokens en variables de entorno si la respuesta es exitosa",
                  "if (pm.response.code === 200) {",
                  "    var jsonData = pm.response.json();",
                  "    if (jsonData.accessToken) {",
                  "        pm.environment.set('access_token', jsonData.accessToken);",
                  "        pm.environment.set('auth_token', jsonData.accessToken);",
                  "        console.log('Token de acceso guardado en variables de entorno');",
                  "    }",
                  "    if (jsonData.refreshToken) {",
                  "        pm.environment.set('refresh_token', jsonData.refreshToken);",
                  "        console.log('Token de actualización guardado en variables de entorno');",
                  "    }",
                  "}"
                ]
              }
            }
          ]
        },
        {
          name: "Refresh Token",
          request: {
            method: "POST",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refreshToken: "{{refresh_token}}"
              }, null, 2),
              options: {
                raw: {
                  language: "json"
                }
              }
            },
            url: {
              raw: "{{base_url}}/auth/refresh-token",
              host: ["{{base_url}}"],
              path: ["auth", "refresh-token"]
            },
            description: "Renueva el token de acceso usando el refresh token"
          },
          response: [
            {
              name: "Refresh exitoso",
              originalRequest: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    refreshToken: "{{refresh_token}}"
                  }, null, 2),
                  options: {
                    raw: {
                      language: "json"
                    }
                  }
                },
                url: {
                  raw: "{{base_url}}/auth/refresh-token",
                  host: ["{{base_url}}"],
                  path: ["auth", "refresh-token"]
                }
              },
              status: "OK",
              code: 200,
              _postman_previewlanguage: "json",
              header: [
                {
                  key: "Content-Type",
                  value: "application/json"
                }
              ],
              cookie: [],
              body: JSON.stringify({
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: 3600
              }, null, 2)
            }
          ],
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  "// Guardar el nuevo token de acceso en variables de entorno si la respuesta es exitosa",
                  "if (pm.response.code === 200) {",
                  "    var jsonData = pm.response.json();",
                  "    if (jsonData.accessToken) {",
                  "        pm.environment.set('access_token', jsonData.accessToken);",
                  "        pm.environment.set('auth_token', jsonData.accessToken);",
                  "        console.log('Nuevo token de acceso guardado en variables de entorno');",
                  "    }",
                  "}"
                ]
              }
            }
          ]
        }
      ]
    };
    
    // Añadir o actualizar la carpeta en la colección
    const existingIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === authFolder.name
    );
    
    if (existingIndex >= 0) {
      this.collection.item[existingIndex] = authFolder;
    } else {
      // Buscar si existe la carpeta de información general para insertar después
      const infoIndex = this.collection.item.findIndex(
        item => 'name' in item && item.name === "Información General"
      );
      
      if (infoIndex >= 0) {
        this.collection.item.splice(infoIndex + 1, 0, authFolder);
      } else {
        this.collection.item.unshift(authFolder);
      }
    }
    
    this.saveCollection();
  }

  /**
   * Añade documentación sobre errores comunes
   */
  public addCommonErrorsDocs(): void {
    // Crear una carpeta para errores comunes
    const errorsFolder: PostmanFolder = {
      name: "Errores Comunes",
      description: "Documentación sobre códigos de error comunes",
      item: [
        {
          name: "Códigos de Error",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/errors",
              host: ["{{base_url}}"],
              path: ["errors"]
            },
            description: `# Códigos de Error

La API utiliza códigos de estado HTTP estándar para indicar el éxito o fracaso de las solicitudes.

## Errores comunes

- **400 Bad Request**: La solicitud contiene datos inválidos o falta información requerida
- **401 Unauthorized**: Se requiere autenticación o las credenciales proporcionadas son inválidas
- **403 Forbidden**: El usuario no tiene permisos para realizar la acción solicitada
- **404 Not Found**: El recurso solicitado no existe
- **422 Unprocessable Entity**: La solicitud contiene errores de validación
- **500 Internal Server Error**: Error interno del servidor

## Formato de respuesta de error

\`\`\`json
{
  "message": "Descripción del error",
  "errors": [
    {
      "field": "campo_con_error",
      "message": "Descripción específica del error"
    }
  ]
}
\`\`\``
          },
          response: []
        }
      ]
    };
    
    // Añadir o actualizar la carpeta en la colección
    const existingIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === errorsFolder.name
    );
    
    if (existingIndex >= 0) {
      this.collection.item[existingIndex] = errorsFolder;
    } else {
      // Buscar si existe la carpeta de autenticación para insertar después
      const authIndex = this.collection.item.findIndex(
        item => 'name' in item && item.name === "Autenticación"
      );
      
      if (authIndex >= 0) {
        this.collection.item.splice(authIndex + 1, 0, errorsFolder);
      } else {
        // Buscar si existe la carpeta de información general para insertar después
        const infoIndex = this.collection.item.findIndex(
          item => 'name' in item && item.name === "Información General"
        );
        
        if (infoIndex >= 0) {
          this.collection.item.splice(infoIndex + 1, 0, errorsFolder);
        } else {
          this.collection.item.unshift(errorsFolder);
        }
      }
    }
    
    this.saveCollection();
  }

  /**
   * Guarda la colección en el archivo
   */
  public saveCollection(): void {
    try {
      FileUtils.writeJsonFile(this.collectionPath, this.collection);
      // Collection successfully updated
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar la colección de Postman:', error);
    }
  }

  /**
   * Guarda el environment en el archivo
   */
  private saveEnvironment(): void {
    try {
      FileUtils.writeJsonFile(this.environmentPath, this.environment);
      // Environment successfully updated
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al guardar el environment de Postman:', error);
    }
  }

  /**
   * Método para añadir una carpeta de recurso basada en un recurso analizado
   * TODO: Corregir errores de tipos en la generación de respuestas
   */
  public addResourceFolderFromResource(
    resourceName: string, 
    routes: { method: string; path: string; description?: string }[], 
    apiBasePath: string = '',
    resource: any
  ): void {
    const resourceNameLower = StringUtils.toCamelCase(resourceName);
    const resourceIdParam = `${resourceNameLower}Id`;
    
    // Añadir variable de ID para este recurso
    this.addEnvironmentVariable(resourceIdParam);
    
    // Crear la carpeta para el recurso
    const folder: PostmanFolder = {
      name: StringUtils.toPascalCase(resourceName),
      item: [],
      description: resource.model?.description || `Endpoints para ${resourceName}`
    };
    
    // Añadir un ítem para cada ruta
    for (const route of routes) {
      const method = route.method.toUpperCase();
      const routePath = route.path;
      
      // Determinar si es una ruta de obtener por ID, crear, etc.
      const isGetById = method === 'GET' && routePath.includes(':');
      const isCreate = method === 'POST' && routePath === '/';
      const isPaginated = method === 'GET' && routePath.includes('paginated');
      
      // Formatear la ruta reemplazando parámetros con variables de Postman
      const formattedPath = routePath.split('/').filter(Boolean).map(segment => {
        if (segment.startsWith(':')) {
          const paramName = segment.substring(1);
          
          // Si el parámetro es '_id' y estamos en una ruta específica del recurso,
          // usar el nombre específico del recurso (resourceIdParam)
          const variableName = (paramName === '_id') ? resourceIdParam : paramName;
          
          // Asegurar que existe la variable
          this.addEnvironmentVariable(variableName);
          
          return `{{${variableName}}}`;
        }
        return segment;
      });
      
      // Construir la ruta formateada completa como string
      const formattedPathString = '/' + formattedPath.join('/');
      
      // Construir el objeto de request de Postman
      const request: PostmanRequest = {
        name: `${method} ${routePath}`,
        request: {
          method,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            },
            {
              key: 'Authorization',
              value: 'Bearer {{auth_token}}',
              type: 'text'
            }
          ],
          url: {
            raw: `{{base_url}}${apiBasePath ? '/' + apiBasePath : ''}${formattedPathString}`,
            host: ['{{base_url}}'],
            path: [...(apiBasePath ? apiBasePath.split('/').filter(Boolean) : []), ...formattedPath]
          },
          description: this.buildRequestDescriptionFromResource(route, resource, isGetById, isPaginated)
        },
        response: []
      };
      
      // Configurar body para métodos POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        // Buscar el DTO correspondiente para este tipo de operación
        let dtoExample = this.generateDtoExampleFromResource(resource, method);
        
        request.request.body = {
          mode: 'raw',
          raw: JSON.stringify(dtoExample, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
        
        // Añadir ejemplos de respuesta manualmente en lugar de usar el generator
        if (isCreate) {
          // Para POST, añadir respuesta 201 Created
          request.response.push({
            name: "Respuesta exitosa (201)",
            originalRequest: {
              method: 'POST',
              header: request.request.header,
              url: request.request.url
            },
            status: "Created",
            code: 201,
            _postman_previewlanguage: "json",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            cookie: [],
            body: JSON.stringify({ 
              _id: "60d21b4667d0d8992e610c85",
              name: `Ejemplo de ${resource.name}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, null, 2)
          });
        } else {
          // Para PUT/PATCH, añadir respuesta 200 OK
          request.response.push({
            name: "Respuesta exitosa (200)",
            originalRequest: {
              method: method,
              header: request.request.header,
              url: request.request.url
            },
            status: "OK",
            code: 200,
            _postman_previewlanguage: "json",
            header: [
              {
                key: "Content-Type",
                value: "application/json"
              }
            ],
            cookie: [],
            body: JSON.stringify({ 
              _id: "60d21b4667d0d8992e610c85",
              name: `Ejemplo de ${resource.name}`,
              updatedAt: new Date().toISOString()
            }, null, 2)
          });
        }
      }
      
      // Añadir el request a la carpeta
      folder.item.push(request);
    }
    
    // Buscar si ya existe una carpeta para este recurso
    const existingFolderIndex = this.collection.item.findIndex(
      item => 'name' in item && item.name === folder.name
    );
    
    if (existingFolderIndex >= 0) {
      // Actualizar la carpeta existente
      this.collection.item[existingFolderIndex] = folder;
    } else {
      // Añadir la nueva carpeta
      this.collection.item.push(folder);
    }
    
    // Guardar los cambios
    this.saveCollection();
    this.saveEnvironment();
  }

  /**
   * Construye una descripción detallada para una ruta usando el recurso analizado
   */
  private buildRequestDescriptionFromResource(
    route: { method: string; path: string; description?: string },
    resource: any,
    isGetById: boolean = false,
    isPaginated: boolean = false
  ): string {
    const method = route.method.toUpperCase();
    const resourceName = resource.name || 'recurso';
    const description = route.description || `${method} ${resourceName}`;
    
    // Tipo de ruta (listado, detalle, crear, etc.)
    const routeType = this.getRouteType(method, isGetById, isPaginated);
    
    // Construir descripción básica
    let requestDescription = `## ${description}\n\n`;
    
    // Añadir información según el tipo de ruta
    if (routeType === 'list' || routeType === 'paginated') {
      requestDescription += `Obtiene un listado de ${resourceName}s.`;
      
      if (routeType === 'paginated') {
        requestDescription += `\n\n### Paginación:\n`;
        requestDescription += `- \`page\`: Número de página (por defecto: 1)\n`;
        requestDescription += `- \`itemsPerPage\`: Elementos por página (por defecto: 10)\n`;
      }
    } else if (routeType === 'detail') {
      requestDescription += `Obtiene un ${resourceName} por su ID.`;
    } else if (routeType === 'create') {
      requestDescription += `Crea un nuevo ${resourceName}.`;
      
      // Añadir información sobre el cuerpo requerido
      if (resource.dtos && resource.dtos.length > 0) {
        const createDto = resource.dtos.find((dto: any) => dto.name.includes('Create'));
        if (createDto) {
          requestDescription += `\n\n### Cuerpo de la solicitud\n\n`;
          requestDescription += `Debe incluir los campos requeridos según el DTO ${createDto.name}.`;
        }
      }
    } else if (routeType === 'update') {
      requestDescription += `Actualiza un ${resourceName} existente.`;
      
      // Añadir información sobre el cuerpo requerido
      if (resource.dtos && resource.dtos.length > 0) {
        const updateDto = resource.dtos.find((dto: any) => dto.name.includes('Update'));
        if (updateDto) {
          requestDescription += `\n\n### Cuerpo de la solicitud\n\n`;
          requestDescription += `Debe incluir los campos a actualizar según el DTO ${updateDto.name}.`;
        }
      }
    } else if (routeType === 'delete') {
      requestDescription += `Elimina un ${resourceName} existente.`;
    }
    
    // Añadir información de autenticación si es necesario
    const authInfo = resource.routes?.find((r: any) => 
      r.path === route.path && r.method === route.method && r.isAuthenticated
    );
    
    if (authInfo) {
      requestDescription += `\n\n### Autenticación\n\n`;
      requestDescription += `Requiere token JWT en el header 'Authorization'.`;
    }
    
    return requestDescription;
  }

  /**
   * Genera un ejemplo de objeto basado en un DTO del recurso
   */
  private generateDtoExampleFromResource(resource: any, method: string): any {
    const example: any = {};
    
    if (!resource.dtos || resource.dtos.length === 0) {
      return { 
        message: "No se encontró un DTO para generar ejemplos",
        exampleField1: "valor1",
        exampleField2: 123
      };
    }
    
    // Buscar el DTO apropiado según el método
    let dto;
    if (method === 'POST') {
      dto = resource.dtos.find((d: any) => d.name.includes('Create'));
    } else if (['PUT', 'PATCH'].includes(method)) {
      dto = resource.dtos.find((d: any) => d.name.includes('Update'));
    }
    
    // Si no se encuentra un DTO específico, usar el primero
    if (!dto && resource.dtos.length > 0) {
      dto = resource.dtos[0];
    }
    
    // Si hay un DTO, generar ejemplo basado en sus propiedades
    if (dto && dto.properties) {
      for (const prop of dto.properties) {
        // Usar generator de ejemplos para generar valores
        example[prop.name] = this.exampleGenerator.generateExampleValue(prop.type, prop.name);
      }
    } else if (resource.model && resource.model.fields) {
      // Si no hay DTO pero hay modelo, usar los campos del modelo
      for (const field of resource.model.fields) {
        if (['createdAt', 'updatedAt', '_id', '_id'].includes(field.name)) {
          continue; // Saltar campos autogenerados
        }
        example[field.name] = this.exampleGenerator.generateExampleValue(field.type, field.name);
      }
    }
    
    return example;
  }
} 