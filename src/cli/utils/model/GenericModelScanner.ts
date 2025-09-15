/**
 * Escáner genérico de modelos
 * 
 * Esta clase se encarga de escanear y descubrir modelos en el proyecto,
 * utilizando Mongoose como fuente de verdad para analizar la estructura
 * de los modelos.
 */
import * as path from 'path';
import { FileSystemService } from '../../interfaces/IOInterface';
import { AnalysisStrategyRegistry } from './AnalysisStrategyRegistry';
import { ModelStructure } from './interfaces/AnalysisStrategy';

export class GenericModelScanner {
  private resourceDirectories: string[];

  /**
   * Constructor
   */
  constructor(
    private readonly fileSystemService: FileSystemService,
    private readonly resourcesDir: string,
    private readonly strategyRegistry: AnalysisStrategyRegistry
  ) {
    // Directorios a escanear
    this.resourceDirectories = [
      this.resourcesDir,                                   // src/api/domain/entities (directorio principal)
      this.resourcesDir.replace('/api/', '/core/')         // src/core/entities (directorio adicional)
    ];
  }

  /**
   * Lista todos los modelos disponibles en el proyecto
   */
  public async listAvailableModels(): Promise<string[]> {
    try {
      const modelNames: string[] = [];
      
      // Buscar en todos los directorios de recursos
      for (const resourceDir of this.resourceDirectories) {
        // Verificar que el directorio exista
        if (!await this.fileSystemService.isDirectory(resourceDir)) {
          continue;
        }
        
        // Obtener subdirectorios del directorio de recursos (cada uno es un recurso)
        const resourceDirs = await this.fileSystemService.listDirs(resourceDir);
        
        // Filtrar para asegurarse de que cada directorio contiene un archivo de modelo
        for (const dir of resourceDirs) {
          const baseName = path.basename(dir);
          const modelFilePath = path.join(dir, `${baseName}Model.ts`);
          
          if (await this.fileSystemService.fileExists(modelFilePath)) {
            modelNames.push(baseName);
          }
        }
      }
      
      return modelNames;
    } catch (error) {
      throw new Error(`Error al listar modelos disponibles: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene información detallada sobre un modelo específico
   */
  public async getModelInfo(modelName: string): Promise<ModelStructure | null> {
    try {
      // Buscar el modelo en todos los directorios de recursos
      for (const resourceDir of this.resourceDirectories) {
        // Verificar que el directorio exista
        if (!await this.fileSystemService.isDirectory(resourceDir)) {
          continue;
        }
        
        // Construir la ruta al archivo del modelo
        const modelDir = path.join(resourceDir, modelName);
        const modelFilePath = path.join(modelDir, `${modelName}Model.ts`);
        
        // Verificar que el archivo exista
        if (await this.fileSystemService.fileExists(modelFilePath)) {
          // Leer el contenido del archivo
          const modelContent = await this.fileSystemService.readFile(modelFilePath);
          
          // Analizar el archivo usando el registro de estrategias
          return this.strategyRegistry.analyzeModel(modelName, modelContent);
        }
      }
      
      // Intentar buscar archivos de esquema alternativos
      for (const resourceDir of this.resourceDirectories) {
        if (!await this.fileSystemService.isDirectory(resourceDir)) {
          continue;
        }
        
        const modelDir = path.join(resourceDir, modelName);
        
        // Verificar variantes comunes de nombres de archivo
        const possibleFiles = [
          path.join(modelDir, `${modelName}Schema.ts`),
          path.join(modelDir, `${modelName}.model.ts`),
          path.join(modelDir, `${modelName}.schema.ts`),
          path.join(modelDir, `${modelName}.ts`)
        ];
        
        for (const filePath of possibleFiles) {
          if (await this.fileSystemService.fileExists(filePath)) {
            const modelContent = await this.fileSystemService.readFile(filePath);
            return this.strategyRegistry.analyzeModel(modelName, modelContent);
          }
        }
      }
      
      // Si llegamos aquí, el modelo no se encontró en ningún directorio
      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error al obtener información del modelo ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Obtiene información de todos los modelos disponibles
   */
  public async getAllModels(): Promise<Record<string, ModelStructure>> {
    const modelNames = await this.listAvailableModels();
    const models: Record<string, ModelStructure> = {};
    
    for (const modelName of modelNames) {
      const modelInfo = await this.getModelInfo(modelName);
      if (modelInfo) {
        models[modelName] = modelInfo;
      }
    }
    
    return models;
  }
} 