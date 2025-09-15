/**
 * Generador de especificaciones OpenAPI a partir de esquemas
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { DataSource, FieldDefinition } from '../interfaces/DataSourceInterfaces';

interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

interface OpenApiComponents {
  schemas: Record<string, any>;
  securitySchemes?: Record<string, any>;
}

interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers?: { url: string; description?: string }[];
  paths: Record<string, any>;
  components?: OpenApiComponents;
  security?: { [key: string]: string[] }[];
}

export class OpenApiGenerator {
  /**
   * Genera una especificación OpenAPI a partir de los esquemas de datos
   */
  public generateFromSchemas(schemas: DataSource[]): OpenApiSpec {
    // Crear la estructura base de la especificación OpenAPI
    const openApiSpec: OpenApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'API CMS 2025',
        version: '1.0.0',
        description: 'API para gestionar contenidos del CMS 2025'
      },
      servers: [
        {
          url: '/api',
          description: 'Servidor API'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    };

    // Generar componentes y rutas para cada esquema
    schemas.forEach(schema => {
      // Añadir componente de esquema
      this.addSchemaComponent(schema, openApiSpec.components!.schemas);
      
      // Generar rutas para el esquema
      this.generatePathsForSchema(schema, openApiSpec.paths);
    });

    return openApiSpec;
  }

  /**
   * Añade un esquema como componente de OpenAPI
   */
  private addSchemaComponent(schema: DataSource, schemas: Record<string, any>): void {
    const schemaName = this.pascalCase(schema.name);
    
    // Crear componente de esquema
    const schemaComponent: any = {
      type: 'object',
      description: schema.description || `Modelo de ${schema.name}`,
      properties: {},
      required: []
    };

    // Añadir propiedades basadas en los campos del esquema
    schema.fields.forEach(field => {
      schemaComponent.properties[field.name] = this.convertFieldToOpenApiProperty(field);
      
      if (field.required) {
        schemaComponent.required.push(field.name);
      }
    });

    // Añadir campos de timestampeo y borrado suave si están habilitados
    if (schema.timestamps) {
      schemaComponent.properties.createdAt = {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación del registro'
      };
      
      schemaComponent.properties.updatedAt = {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización del registro'
      };
    }

    if (schema.softDelete) {
      schemaComponent.properties.deletedAt = {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de eliminación lógica del registro',
        nullable: true
      };
    }

    // Registrar el componente en la especificación
    schemas[schemaName] = schemaComponent;
    
    // Crear también modelos para entrada (Create, Update)
    this.createInputModels(schema, schemas);
  }

  /**
   * Crea modelos adicionales para operaciones de entrada (Create/Update)
   */
  private createInputModels(schema: DataSource, schemas: Record<string, any>): void {
    const baseName = this.pascalCase(schema.name);
    
    // Modelo para creación
    const createSchema = { ...schemas[baseName] };
    createSchema.description = `Datos para crear un ${schema.name}`;
    
    // Eliminar campos generados automáticamente
    delete createSchema.properties._id;
    delete createSchema.properties.createdAt;
    delete createSchema.properties.updatedAt;
    delete createSchema.properties.deletedAt;
    
    // Filtrar required
    if (createSchema.required && createSchema.required.includes('_id')) {
      createSchema.required = createSchema.required.filter((field: string) => field !== '_id');
    }
    
    schemas[`Create${baseName}`] = createSchema;
    
    // Modelo para actualización
    const updateSchema = { ...createSchema };
    updateSchema.description = `Datos para actualizar un ${schema.name}`;
    
    // En la actualización, todos los campos son opcionales
    updateSchema.required = [];
    
    schemas[`Update${baseName}`] = updateSchema;
  }

  /**
   * Genera las rutas OpenAPI para un esquema
   */
  private generatePathsForSchema(schema: DataSource, paths: Record<string, any>): void {
    const basePath = schema.apiPath || schema.name.toLowerCase();
    const resourceName = schema.name;
    const schemaName = this.pascalCase(resourceName);
    const paramName = `${resourceName.toLowerCase()}Id`;
    
    // Ruta base (/recursos)
    paths[`/${basePath}`] = {
      get: this.createOperation('get', `Obtener todos los ${resourceName}`, schemaName, true),
      post: this.createOperation('post', `Crear un nuevo ${resourceName}`, schemaName)
    };
    
    // Ruta para paginación (/recursos/paginated)
    paths[`/${basePath}/paginated`] = {
      get: this.createOperation('get', `Obtener ${resourceName} paginados`, schemaName, true, true)
    };
    
    // Ruta para operaciones por ID (/recursos/{_id})
    paths[`/${basePath}/{${paramName}}`] = {
      get: this.createOperation('get', `Obtener ${resourceName} por ID`, schemaName, false),
      put: this.createOperation('put', `Actualizar ${resourceName}`, schemaName, false),
      delete: this.createOperation('delete', `Eliminar ${resourceName}`, schemaName, false)
    };
    
    // Añadir parámetro ID a las rutas que lo requieren
    this.addIdParameter(paths[`/${basePath}/{${paramName}}`], paramName);
  }

  /**
   * Crea una operación OpenAPI (GET, POST, etc)
   */
  private createOperation(
    method: string, 
    summary: string, 
    schemaName: string, 
    isArray: boolean = false,
    isPaginated: boolean = false
  ): any {
    const operation: any = {
      summary,
      tags: [schemaName],
      responses: {}
    };
    
    // Configurar parámetros según el método
    if (method === 'post') {
      operation.requestBody = {
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/Create${schemaName}`
            }
          }
        },
        required: true
      };
      
      operation.responses['201'] = {
        description: 'Creado con éxito',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`
            }
          }
        }
      };
    } else if (method === 'put') {
      operation.requestBody = {
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/Update${schemaName}`
            }
          }
        },
        required: true
      };
      
      operation.responses['200'] = {
        description: 'Actualizado con éxito',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`
            }
          }
        }
      };
    } else if (method === 'delete') {
      operation.responses['200'] = {
        description: 'Eliminado con éxito',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Recurso eliminado correctamente'
                }
              }
            }
          }
        }
      };
    } else if (method === 'get') {
      if (isPaginated) {
        operation.parameters = [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Número de página'
          },
          {
            name: 'itemsPerPage',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Elementos por página'
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Campo para ordenar',
            schema: {
              type: 'string'
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Orden (asc, desc)',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc'
            }
          }
        ];
        
        operation.responses['200'] = {
          description: 'Lista paginada recuperada con éxito',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'success'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: `#/components/schemas/${schemaName}`
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      totalRows: {
                        type: 'integer',
                        description: 'Total de elementos'
                      },
                      totalFilteredRows: {
                        type: 'integer',
                        description: 'Total de elementos filtrados'
                      },
                      pages: {
                        type: 'integer',
                        description: 'Total de páginas'
                      },
                      page: {
                        type: 'integer',
                        description: 'Página actual'
                      },
                      itemsPerPage: {
                        type: 'integer',
                        description: 'Elementos por página'
                      }
                    }
                  }
                }
              }
            }
          }
        };
      } else {
        operation.responses['200'] = {
          description: 'Operación exitosa',
          content: {
            'application/json': {
              schema: isArray
                ? {
                    type: 'array',
                    items: {
                      $ref: `#/components/schemas/${schemaName}`
                    }
                  }
                : {
                    $ref: `#/components/schemas/${schemaName}`
                  }
            }
          }
        };
      }
    }
    
    // Añadir respuestas comunes de error
    operation.responses['400'] = {
      description: 'Solicitud incorrecta',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string'
              },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string'
                    },
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    operation.responses['401'] = {
      description: 'No autorizado'
    };
    
    operation.responses['404'] = {
      description: 'Recurso no encontrado'
    };
    
    operation.responses['500'] = {
      description: 'Error interno del servidor'
    };
    
    return operation;
  }

  /**
   * Añade el parámetro ID a una ruta
   */
  private addIdParameter(pathItem: any, paramName: string): void {
    // Añadir el parámetro a cada operación en la ruta
    for (const method of ['get', 'put', 'delete']) {
      if (pathItem[method]) {
        if (!pathItem[method].parameters) {
          pathItem[method].parameters = [];
        }
        
        pathItem[method].parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          description: 'ID del recurso',
          schema: {
            type: 'string'
          }
        });
      }
    }
  }

  /**
   * Convierte un campo de esquema a una propiedad OpenAPI
   */
  private convertFieldToOpenApiProperty(field: FieldDefinition): any {
    const property: any = {
      description: field.description || `Campo ${field.name}`
    };
    
    switch (field.type) {
      case 'string':
        property.type = 'string';
        if (field.min) property.minLength = field.min;
        if (field.max) property.maxLength = field.max;
        if (field.enum) property.enum = field.enum;
        if (field.pattern) property.pattern = field.pattern;
        break;
        
      case 'email':
        property.type = 'string';
        property.format = 'email';
        break;
        
      case 'number':
        property.type = 'number';
        if (field.min !== undefined) property.minimum = field.min;
        if (field.max !== undefined) property.maximum = field.max;
        break;
        
      case 'integer':
        property.type = 'integer';
        if (field.min !== undefined) property.minimum = field.min;
        if (field.max !== undefined) property.maximum = field.max;
        break;
        
      case 'boolean':
        property.type = 'boolean';
        break;
        
      case 'date':
        property.type = 'string';
        property.format = 'date-time';
        break;
        
      case 'array':
        property.type = 'array';
        if (field.items) {
          if (typeof field.items === 'string') {
            property.items = { type: field.items };
          } else {
            property.items = this.convertFieldToOpenApiProperty(field.items as FieldDefinition);
          }
        } else {
          property.items = { type: 'string' };
        }
        break;
        
      case 'object':
        property.type = 'object';
        if (field.properties) {
          property.properties = {};
          const requiredProps: string[] = [];
          
          Object.entries(field.properties).forEach(([propName, propDef]) => {
            property.properties[propName] = this.convertFieldToOpenApiProperty(propDef as FieldDefinition);
            if ((propDef as FieldDefinition).required) {
              requiredProps.push(propName);
            }
          });
          
          if (requiredProps.length > 0) {
            property.required = requiredProps;
          }
        }
        break;
        
      default:
        // Para tipos desconocidos o personalizados, usar string como fallback
        property.type = 'string';
    }
    
    // Manejar campos opcionales/nulos
    if (!field.required) {
      property.nullable = true;
    }
    
    // Añadir valor por defecto si existe
    if (field.default !== undefined) {
      property.default = field.default;
    }
    
    // Manejar referencias a otros modelos
    if (field.ref) {
      // En OAS, esto sería una referencia a otro modelo
      if (field.type === 'array') {
        property.items = {
          $ref: `#/components/schemas/${this.pascalCase(field.ref)}`
        };
      } else {
        // Reemplazar la definición con una referencia
        return {
          description: property.description,
          $ref: `#/components/schemas/${this.pascalCase(field.ref)}`,
          nullable: property.nullable
        };
      }
    }
    
    return property;
  }

  /**
   * Guarda la especificación OpenAPI en un archivo YAML o JSON
   */
  public async saveOpenApiSpec(spec: OpenApiSpec, outputPath: string): Promise<void> {
    try {
      const extension = path.extname(outputPath).toLowerCase();
      
      if (extension === '.yaml' || extension === '.yml') {
        // Convertir a YAML
        const yamlContent = yaml.dump(spec, { lineWidth: 120 });
        fs.writeFileSync(outputPath, yamlContent, 'utf8');
      } else {
        // Guardar como JSON
        fs.writeFileSync(
          outputPath, 
          JSON.stringify(spec, null, 2),
          'utf8'
        );
      }
    } catch (error) {
      throw new Error(`Error al guardar la especificación OpenAPI: ${error}`);
    }
  }

  /**
   * Convierte una cadena a formato PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Genera una especificación OpenAPI a partir de los recursos analizados
   */
  public generateFromResources(entities: any[]): OpenApiSpec {
    // Crear la estructura base de la especificación OpenAPI
    const openApiSpec: OpenApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'API CMS 2025',
        version: '1.0.0',
        description: 'API para gestionar contenidos del CMS 2025'
      },
      servers: [
        {
          url: '/api',
          description: 'Servidor API'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    };

    // Generar componentes y rutas para cada recurso
    entities.forEach(resource => {
      // Añadir componente de esquema basado en el modelo
      this.addModelAsComponent(resource.model, openApiSpec.components!.schemas);
      
      // Añadir DTOs como componentes si existen
      if (resource.dtos && resource.dtos.length > 0) {
        this.addDtosAsComponents(resource.dtos, openApiSpec.components!.schemas);
      }
      
      // Generar rutas basadas en las rutas analizadas
      this.generatePathsFromRoutes(resource, openApiSpec.paths);
    });

    return openApiSpec;
  }

  /**
   * Añade un modelo como componente de OpenAPI
   */
  private addModelAsComponent(model: any, schemas: Record<string, any>): void {
    if (!model || !model.name) {
      return;
    }
    
    const schemaName = this.pascalCase(model.name);
    
    // Crear componente de esquema
    const schemaComponent: any = {
      type: 'object',
      description: model.description || `Modelo de ${model.name}`,
      properties: {},
      required: []
    };

    // Añadir propiedades basadas en los campos del modelo
    if (model.fields && Array.isArray(model.fields)) {
      model.fields.forEach((field: any) => {
        schemaComponent.properties[field.name] = this.convertFieldToOpenApiProperty(field);
        
        if (field.required) {
          schemaComponent.required.push(field.name);
        }
      });
    }

    // Añadir campos de timestampeo si están habilitados
    if (model.timestamps) {
      schemaComponent.properties.createdAt = {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación del registro'
      };
      
      schemaComponent.properties.updatedAt = {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización del registro'
      };
    }

    // Registrar el componente en la especificación
    schemas[schemaName] = schemaComponent;
  }

  /**
   * Añade DTOs como componentes de OpenAPI
   */
  private addDtosAsComponents(dtos: any[], schemas: Record<string, any>): void {
    if (!dtos || !Array.isArray(dtos)) {
      return;
    }
    
    dtos.forEach(dto => {
      if (!dto.name) return;
      
      const dtoName = dto.name;
      
      // Crear componente para el DTO
      const dtoComponent: any = {
        type: 'object',
        description: dto.description || `DTO para ${dtoName}`,
        properties: {},
        required: []
      };
      
      // Añadir propiedades basadas en la definición del DTO
      if (dto.properties && Array.isArray(dto.properties)) {
        dto.properties.forEach((prop: any) => {
          // Convertir propiedad a formato OpenAPI
          dtoComponent.properties[prop.name] = {
            type: this.convertTypeToOpenApi(prop.type),
            description: prop.description || `${prop.name}`,
          };
          
          // Añadir validaciones si existen
          if (prop.validations && Array.isArray(prop.validations)) {
            const validations = require('../utils/DtoAnalyzer').DtoAnalyzer.mapValidationToOpenApi(prop.validations);
            Object.assign(dtoComponent.properties[prop.name], validations);
          }
          
          // Añadir a requeridos si es necesario
          if (prop.required) {
            dtoComponent.required.push(prop.name);
          }
        });
      }
      
      // Registrar el componente en la especificación
      schemas[dtoName] = dtoComponent;
    });
  }

  /**
   * Genera rutas OpenAPI basadas en las rutas analizadas
   */
  private generatePathsFromRoutes(resource: any, paths: Record<string, any>): void {
    if (!resource.routes || !Array.isArray(resource.routes)) {
      return;
    }
    
    const basePath = resource.apiBasePath || `/api/${resource.name.toLowerCase()}`;
    const resourceName = resource.name;
    const schemaName = this.pascalCase(resourceName);
    
    // Procesar cada ruta
    resource.routes.forEach((route: any) => {
      const method = route.method.toLowerCase();
      let path = route.path;
      
      // Ajustar ruta para formato OpenAPI
      const fullPath = path === '/' ? basePath : `${basePath}${path}`;
      
      // Convertir parámetros de ruta de formato Express (:_id) a formato OpenAPI ({_id})
      const openApiPath = fullPath.replace(/:(\w+)/g, '{$1}');
      
      // Inicializar la definición de ruta si no existe
      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }
      
      // Determinar si la ruta es una operación de listado, detalle, etc.
      const isGetById = method === 'get' && route.path.includes(':');
      const isCreate = method === 'post' && route.path === '/';
      const isUpdate = (method === 'put' || method === 'patch') && route.path.includes(':');
      const isDelete = method === 'delete' && route.path.includes(':');
      const isPaginated = method === 'get' && route.path.includes('paginated');
      
      // Crear operación OpenAPI
      paths[openApiPath][method] = this.createOperationFromRoute(
        resource,
        route,
        method,
        schemaName,
        isGetById,
        isCreate,
        isUpdate,
        isDelete,
        isPaginated
      );
    });
  }

  /**
   * Crea una operación OpenAPI a partir de una ruta analizada
   */
  private createOperationFromRoute(
    resource: any,
    route: any,
    method: string,
    schemaName: string,
    isGetById: boolean = false,
    isCreate: boolean = false,
    isUpdate: boolean = false,
    isDelete: boolean = false,
    isPaginated: boolean = false
  ): any {
    const operation: any = {
      summary: route.description || `${method.toUpperCase()} ${resource.name}`,
      tags: [schemaName],
      responses: {}
    };
    
    // Añadir autenticación si es necesario
    if (route.isAuthenticated) {
      operation.security = [{ bearerAuth: [] }];
    }
    
    // Añadir parámetros según el tipo de operación
    const parameters: any[] = [];
    
    // Añadir parámetros de ruta
    if (route.parameters) {
      route.parameters.forEach((param: any) => {
        if (param.location === 'path') {
          parameters.push({
            name: param.name,
            in: 'path',
            required: true,
            description: param.description || `Parameter ${param.name}`,
            schema: {
              type: this.convertTypeToOpenApi(param.type)
            }
          });
        }
      });
    }
    
    // Añadir parámetros de paginación para rutas paginadas
    if (isPaginated) {
      parameters.push(
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Número de página'
        },
        {
          name: 'itemsPerPage',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Elementos por página'
        },
        {
          name: 'sort',
          in: 'query',
          description: 'Campo por el que ordenar (prefijo - para descendente)',
          required: false,
          schema: {
            type: 'string'
          }
        }
      );
    }
    
    // Añadir parámetros a la operación si existen
    if (parameters.length > 0) {
      operation.parameters = parameters;
    }
    
    // Configurar cuerpo de solicitud para operaciones POST/PUT
    if (isCreate || isUpdate) {
      // Buscar el DTO adecuado
      let dtoName: string | undefined;
      
      if (isCreate) {
        const createDto = resource.dtos?.find((dto: any) => dto.name.includes('Create'));
        dtoName = createDto?.name;
      } else {
        const updateDto = resource.dtos?.find((dto: any) => dto.name.includes('Update'));
        dtoName = updateDto?.name;
      }
      
      // Si existe un DTO, usarlo como referencia
      if (dtoName) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${dtoName}`
              }
            }
          },
          required: true
        };
      } else {
        // Si no hay DTO, crear un esquema básico
        operation.requestBody = {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {}
              }
            }
          },
          required: true
        };
      }
    }
    
    // Configurar respuestas según el tipo de operación
    if (isCreate) {
      operation.responses['201'] = {
        description: 'Creado con éxito',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`
            }
          }
        }
      };
    } else if (isUpdate) {
      operation.responses['200'] = {
        description: 'Actualizado con éxito',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`
            }
          }
        }
      };
    } else if (isDelete) {
      operation.responses['204'] = {
        description: 'Eliminado con éxito'
      };
    } else if (isGetById) {
      operation.responses['200'] = {
        description: 'Recuperado con éxito',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`
            }
          }
        }
      };
    } else if (isPaginated) {
      operation.responses['200'] = {
        description: 'Lista paginada recuperada con éxito',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'success'
                },
                data: {
                  type: 'array',
                  items: {
                    $ref: `#/components/schemas/${schemaName}`
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    totalRows: {
                      type: 'integer',
                      description: 'Total de elementos'
                    },
                    totalFilteredRows: {
                      type: 'integer',
                      description: 'Total de elementos filtrados'
                    },
                    pages: {
                      type: 'integer',
                      description: 'Total de páginas'
                    },
                    page: {
                      type: 'integer',
                      description: 'Página actual'
                    },
                    itemsPerPage: {
                      type: 'integer',
                      description: 'Elementos por página'
                    }
                  }
                }
              }
            }
          }
        }
      };
    } else {
      // Respuesta para listado u otras operaciones
      operation.responses['200'] = {
        description: 'Operación exitosa',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: `#/components/schemas/${schemaName}`
              }
            }
          }
        }
      };
    }
    
    // Añadir respuestas de error estándar
    operation.responses['400'] = {
      description: 'Solicitud incorrecta',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              statusCode: {
                type: 'integer',
                example: 400
              },
              message: {
                type: 'string',
                example: 'Datos de entrada inválidos'
              },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string'
                    },
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    if (route.isAuthenticated) {
      operation.responses['401'] = {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                statusCode: {
                  type: 'integer',
                  example: 401
                },
                message: {
                  type: 'string',
                  example: 'No autorizado'
                }
              }
            }
          }
        }
      };
    }
    
    return operation;
  }

  /**
   * Convierte un tipo de campo a tipo OpenAPI
   */
  private convertTypeToOpenApi(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
      case 'email':
      case 'uuid':
      case 'url':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'string'; // Con format: date-time
      case 'array':
        return 'array';
      case 'object':
      case 'objectid':
        return 'object';
      default:
        return 'string';
    }
  }
} 