/**
 * Conversor de formatos de documentación de API
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { FileUtils } from './FileUtils';

/**
 * Clase para convertir entre formatos de documentación de API
 * Principalmente entre OpenAPI/Swagger y Postman
 */
export class DocConverter {
  /**
   * Convierte entre formatos de documentación
   */
  public async convert(
    sourceFormat: string,
    targetFormat: string,
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    // Validar formatos
    if (!['postman', 'openapi'].includes(sourceFormat)) {
      throw new Error(`Formato de origen no válido: ${sourceFormat}. Debe ser 'postman' u 'openapi'.`);
    }
    
    if (!['postman', 'openapi'].includes(targetFormat)) {
      throw new Error(`Formato de destino no válido: ${targetFormat}. Debe ser 'postman' u 'openapi'.`);
    }
    
    if (sourceFormat === targetFormat) {
      throw new Error('Los formatos de origen y destino deben ser diferentes');
    }
    
    // Verificar si el archivo de origen existe
    if (!FileUtils.fileExists(inputPath)) {
      throw new Error(`El archivo de origen no existe: ${inputPath}`);
    }
    
    // Leer el archivo de origen
    let sourceDoc;
    try {
      const extension = path.extname(inputPath).toLowerCase();
      if (extension === '.yaml' || extension === '.yml') {
        const content = fs.readFileSync(inputPath, 'utf8');
        sourceDoc = yaml.load(content);
      } else {
        sourceDoc = FileUtils.readJsonFile(inputPath);
      }
    } catch (error) {
      throw new Error(`Error al leer el archivo de origen: ${error}`);
    }
    
    // Realizar la conversión
    let targetDoc;
    if (sourceFormat === 'openapi' && targetFormat === 'postman') {
      targetDoc = await this.openApiToPostman(sourceDoc);
    } else if (sourceFormat === 'postman' && targetFormat === 'openapi') {
      targetDoc = await this.postmanToOpenApi(sourceDoc);
    } else {
      throw new Error(`Conversión no soportada: de ${sourceFormat} a ${targetFormat}`);
    }
    
    // Guardar el archivo de destino
    try {
      const extension = path.extname(outputPath).toLowerCase();
      if (extension === '.yaml' || extension === '.yml') {
        const yamlContent = yaml.dump(targetDoc, { lineWidth: 120 });
        fs.writeFileSync(outputPath, yamlContent, 'utf8');
      } else {
        fs.writeFileSync(outputPath, JSON.stringify(targetDoc, null, 2), 'utf8');
      }
      
      // File conversion completed successfully
    } catch (error) {
      throw new Error(`Error al guardar el archivo de destino: ${error}`);
    }
  }

  /**
   * Convierte una especificación OpenAPI a una colección de Postman
   */
  private async openApiToPostman(openApiSpec: any): Promise<any> {
    // En un entorno de producción, aquí usaríamos la biblioteca oficial de Postman (openapi-to-postman)
    // o una implementación completa para la conversión.
    // Para simplificar, vamos a crear una estructura básica que simule la conversión.
    
    // Crear la colección de Postman
    const postmanCollection = {
      info: {
        name: openApiSpec.info.title || 'API Convertida',
        description: openApiSpec.info.description || '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _postman_id: this.generateUUID()
      },
      item: [] as any[]
    };
    
    // Convertir cada ruta
    this.convertPathsToItems(openApiSpec, postmanCollection.item);
    
    return postmanCollection;
  }

  /**
   * Convierte una colección de Postman a una especificación OpenAPI
   */
  private async postmanToOpenApi(postmanCollection: any): Promise<any> {
    // Similar a la conversión inversa, en producción usaríamos la biblioteca oficial o una implementación completa
    // Para simplificar, creamos una estructura básica
    
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: postmanCollection.info.name || 'API Convertida',
        description: postmanCollection.info.description || '',
        version: '1.0.0'
      },
      paths: {} as any,
      components: {
        schemas: {}
      }
    };
    
    // Convertir items a rutas
    this.convertItemsToPaths(postmanCollection.item, openApiSpec.paths, '');
    
    return openApiSpec;
  }

  /**
   * Convierte las rutas de OpenAPI a items de Postman
   */
  private convertPathsToItems(openApiSpec: any, items: any[]): void {
    // Agrupar rutas por etiquetas
    const tagGroups: Record<string, any[]> = {};
    
    // Procesar cada ruta
    for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          const op = operation as any;
          const tags = op.tags || ['default'];
          
          // Para cada etiqueta, crear un grupo
          for (const tag of tags) {
            if (!tagGroups[tag]) {
              tagGroups[tag] = [];
            }
            
            // Crear el request de Postman
            const postmanRequest = {
              name: op.summary || `${method.toUpperCase()} ${path}`,
              request: {
                method: method.toUpperCase(),
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                    type: 'text'
                  }
                ],
                url: this.convertOpenApiUrlToPostman(path, openApiSpec),
                description: op.description || '',
                body: undefined as any
              },
              response: []
            };
            
            // Añadir body si es necesario
            if (op.requestBody && op.requestBody.content) {
              const contentType = 'application/json';
              if (op.requestBody.content[contentType]) {
                const schema = op.requestBody.content[contentType].schema;
                
                postmanRequest.request.body = {
                  mode: 'raw',
                  raw: this.generateExampleFromSchema(schema),
                  options: {
                    raw: {
                      language: 'json'
                    }
                  }
                };
              }
            }
            
            tagGroups[tag].push(postmanRequest);
          }
        }
      }
    }
    
    // Convertir grupos a carpetas
    for (const [tag, requests] of Object.entries(tagGroups)) {
      items.push({
        name: tag,
        item: requests
      });
    }
  }

  /**
   * Convierte la URL de OpenAPI a formato Postman
   */
  private convertOpenApiUrlToPostman(path: string, openApiSpec: any): any {
    const serverUrl = openApiSpec.servers && openApiSpec.servers.length > 0
      ? openApiSpec.servers[0].url
      : '';
    
    // Reemplazar parámetros de ruta con variables de Postman
    const pathWithVariables = path.replace(/{([^}]+)}/g, ':$1');
    
    return {
      raw: `{{baseUrl}}${serverUrl}${pathWithVariables}`,
      host: ['{{baseUrl}}'],
      path: [...serverUrl.split('/').filter(Boolean), ...pathWithVariables.split('/').filter(Boolean)]
    };
  }

  /**
   * Genera un ejemplo JSON basado en un esquema
   */
  private generateExampleFromSchema(schema: any): string {
    try {
      let example: any = {};
      
      if (schema.$ref) {
        // No podemos resolver referencias sin el documento completo
        // En una implementación real, se usaría JSON Schema Faker o similar
        example = { __exampleForReference: schema.$ref };
      } else if (schema.type === 'object') {
        // Para objetos, generar propiedades
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            example[propName] = this.generateExampleValueForSchema(propSchema as any);
          }
        }
      } else if (schema.type === 'array') {
        // Para arrays, generar un array con un elemento
        example = [this.generateExampleValueForSchema(schema.items)];
      } else {
        // Para tipos primitivos
        example = this.generateExampleValueForSchema(schema);
      }
      
      return JSON.stringify(example, null, 2);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al generar ejemplo desde esquema:', error);
      return '{}';
    }
  }

  /**
   * Genera un valor de ejemplo basado en un esquema
   */
  private generateExampleValueForSchema(schema: any): any {
    if (!schema) return null;
    
    if (schema.example !== undefined) {
      return schema.example;
    }
    
    if (schema.default !== undefined) {
      return schema.default;
    }
    
    if (schema.$ref) {
      return { __exampleForReference: schema.$ref };
    }
    
    switch (schema.type) {
      case 'string':
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'date') return new Date().toISOString().split('T')[0];
        if (schema.format === 'email') return 'usuario@ejemplo.com';
        if (schema.enum && schema.enum.length > 0) return schema.enum[0];
        return 'string';
        
      case 'number':
      case 'integer':
        if (schema.minimum !== undefined) return schema.minimum;
        return 0;
        
      case 'boolean':
        return true;
        
      case 'array':
        return [this.generateExampleValueForSchema(schema.items)];
        
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            obj[propName] = this.generateExampleValueForSchema(propSchema as any);
          }
        }
        return obj;
        
      default:
        return null;
    }
  }

  /**
   * Convierte items de Postman a rutas OpenAPI
   */
  private convertItemsToPaths(items: any[], paths: any, parentPath: string): void {
    for (const item of items) {
      if (item.item) {
        // Es una carpeta, procesar recursivamente
        this.convertItemsToPaths(item.item, paths, parentPath);
      } else if (item.request) {
        // Es un request, convertir a operación
        const request = item.request;
        const method = request.method.toLowerCase();
        
        // Procesar URL
        let path = '/';
        if (request.url && request.url.path) {
          path = '/' + request.url.path.join('/');
          
          // Convertir variables Postman a parámetros OpenAPI
          path = path.replace(/:([^\/]+)/g, '{$1}');
        }
        
        // Asegurar que la ruta existe
        if (!paths[path]) {
          paths[path] = {};
        }
        
        // Crear operación básica
        const operation: any = {
          summary: item.name,
          description: request.description || '',
          tags: [parentPath || 'default'],
          responses: {
            '200': {
              description: 'Successful operation'
            }
          }
        };
        
        // Añadir parámetros de ruta
        const pathParams = (path.match(/{([^}]+)}/g) || []).map(param => {
          const paramName = param.substring(1, param.length - 1);
          return {
            name: paramName,
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          };
        });
        
        if (pathParams.length > 0) {
          operation.parameters = pathParams;
        }
        
        // Añadir body si existe
        if (request.body && request.body.mode === 'raw' && request.body.raw) {
          try {
            const bodyExample = JSON.parse(request.body.raw);
            operation.requestBody = {
              content: {
                'application/json': {
                  schema: this.generateSchemaFromExample(bodyExample)
                }
              },
              required: true
            };
          } catch (e) {
            // Si no es JSON válido, ignorar
          }
        }
        
        // Añadir la operación a la ruta
        paths[path][method] = operation;
      }
    }
  }

  /**
   * Genera un esquema básico a partir de un ejemplo
   */
  private generateSchemaFromExample(example: any): any {
    if (example === null) {
      return { nullable: true };
    }
    
    const type = typeof example;
    
    if (Array.isArray(example)) {
      return {
        type: 'array',
        items: example.length > 0 ? this.generateSchemaFromExample(example[0]) : {}
      };
    }
    
    if (type === 'object') {
      const schema: any = {
        type: 'object',
        properties: {}
      };
      
      for (const [key, value] of Object.entries(example)) {
        schema.properties[key] = this.generateSchemaFromExample(value);
      }
      
      return schema;
    }
    
    if (type === 'string') {
      // Intentar detectar formatos
      const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const emailRegex = /^.+@.+\..+$/;
      
      if (dateTimeRegex.test(example as string)) {
        return { type: 'string', format: 'date-time' };
      }
      
      if (dateRegex.test(example as string)) {
        return { type: 'string', format: 'date' };
      }
      
      if (emailRegex.test(example as string)) {
        return { type: 'string', format: 'email' };
      }
      
      return { type: 'string' };
    }
    
    if (type === 'number') {
      return { type: Number.isInteger(example) ? 'integer' : 'number' };
    }
    
    if (type === 'boolean') {
      return { type: 'boolean' };
    }
    
    // Fallback
    return { type: 'string' };
  }

  /**
   * Genera un UUID simple
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 