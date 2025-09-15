/**
 * Utilidad para generar ejemplos de respuestas para Postman
 */
import { DataSource } from '../interfaces/DataSourceInterfaces';
import { ExampleGenerator } from './ExampleGenerator';

/**
 * Interfaz para ejemplos de respuesta en Postman
 */
interface PostmanResponseExample {
  name: string;
  originalRequest: {
    method: string;
    header: any[];
    url: {
      raw: string;
      host: string[];
      path: string[];
    };
    body?: any;
  };
  status: string;
  code: number;
  _postman_previewlanguage: string;
  header: any[];
  cookie: any[];
  body: string;
}

/**
 * Clase para generar ejemplos de respuestas para Postman
 */
export class PostmanResponseGenerator {
  private exampleGenerator: ExampleGenerator;

  constructor() {
    this.exampleGenerator = new ExampleGenerator();
  }

  /**
   * Genera un ejemplo de respuesta exitosa
   */
  public generateSuccessResponse(
    method: string,
    schema: DataSource,
    request: any,
    isPaginated: boolean = false
  ): PostmanResponseExample {
    let statusCode = 200;
    let example: any;
    let description = 'OK';
    
    if (method === 'POST') {
      statusCode = 201;
      description = 'Created';
      example = this.exampleGenerator.generateExampleFromSchema(schema);
    } else if (method === 'DELETE') {
      example = { message: `${schema.name} eliminado correctamente` };
    } else if (isPaginated) {
      example = {
        status: 'success',
        data: [
          this.exampleGenerator.generateExampleFromSchema(schema),
          this.exampleGenerator.generateExampleFromSchema(schema)
        ],
        pagination: {
          totalRows: 100,
          totalFilteredRows: 100,
          pages: 10,
          page: 1,
          itemsPerPage: 10
        }
      };
    } else if (method === 'GET' && request.url.path.some((p: string) => p.includes('{{') && p.includes('Id'))) {
      // Es una petición GET por ID
      example = this.exampleGenerator.generateExampleFromSchema(schema);
    } else {
      // GET que devuelve una lista
      example = [
        this.exampleGenerator.generateExampleFromSchema(schema),
        this.exampleGenerator.generateExampleFromSchema(schema)
      ];
    }
    
    return {
      name: `Respuesta exitosa (${statusCode})`,
      originalRequest: request,
      status: description,
      code: statusCode,
      _postman_previewlanguage: "json",
      header: [
        {
          key: "Content-Type",
          value: "application/json",
          name: "Content-Type",
          description: "The content type of the response"
        }
      ],
      cookie: [],
      body: JSON.stringify(example, null, 2)
    };
  }

  /**
   * Genera un ejemplo de respuesta de error
   */
  public generateErrorResponse(
    method: string,
    errorType: 'validation' | 'notFound' | 'unauthorized' | 'serverError',
    request: any
  ): PostmanResponseExample {
    let statusCode = 400;
    let example: any;
    let description = 'Bad Request';
    
    switch (errorType) {
      case 'validation':
        statusCode = 400;
        description = 'Bad Request';
        example = {
          message: 'Error de validación',
          errors: [
            {
              field: 'name',
              message: 'El campo name es requerido'
            },
            {
              field: 'email',
              message: 'El email debe tener un formato válido'
            }
          ]
        };
        break;
        
      case 'notFound':
        statusCode = 404;
        description = 'Not Found';
        example = {
          message: 'Recurso no encontrado'
        };
        break;
        
      case 'unauthorized':
        statusCode = 401;
        description = 'Unauthorized';
        example = {
          message: 'No autorizado. Se requiere autenticación'
        };
        break;
        
      case 'serverError':
        statusCode = 500;
        description = 'Internal Server Error';
        example = {
          message: 'Error interno del servidor'
        };
        break;
    }
    
    return {
      name: `Error ${statusCode} - ${description}`,
      originalRequest: request,
      status: description,
      code: statusCode,
      _postman_previewlanguage: "json",
      header: [
        {
          key: "Content-Type",
          value: "application/json",
          name: "Content-Type",
          description: "The content type of the response"
        }
      ],
      cookie: [],
      body: JSON.stringify(example, null, 2)
    };
  }
} 