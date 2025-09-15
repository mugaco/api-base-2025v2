/**
 * Clase para resolver referencias entre modelos
 */
import mongoose from 'mongoose';

interface Model {
  name: string;
  [key: string]: unknown;
}

interface ModelStructure {
  references: ReferenceInfo[];
  [key: string]: unknown;
}

interface ReferenceInfo {
  field: string;
  model: string;
  isArray: boolean;
}

export class ReferenceResolver {
  private models: Model[] = [];
  private generatedData: Record<string, Record<string, unknown>[]> = {};
  private specialModels: Set<string> = new Set(['User']);
  private cachedRealIds: Record<string, mongoose.Types.ObjectId[]> = {};

  /**
   * Constructor de la clase
   */
  constructor() {
    this.generatedData = {};
    this.cachedRealIds = {};
  }

  /**
   * Establece los modelos disponibles
   */
  public setModels(models: Model[]): void {
    this.models = models;
  }

  /**
   * Establece los datos ya generados
   */
  public setGeneratedData(data: Record<string, Record<string, unknown>[]>): void {
    this.generatedData = data;
  }

  /**
   * Agrega datos generados para un modelo
   */
  public addGeneratedData(modelName: string, data: Record<string, unknown>[]): void {
    this.generatedData[modelName] = data;
  }

  /**
   * Resuelve las referencias en un registro
   */
  public async resolveReferences(record: Record<string, unknown>, modelStructure: ModelStructure): Promise<void> {
    const { references } = modelStructure;
    
    if (!references || references.length === 0) {
      return;
    }
    
    // Resolver cada referencia
    for (const reference of references) {
      const { field, model: referencedModelName, isArray } = reference;
      
      // Si es un array de referencias
      if (isArray) {
        record[field] = await this.resolveArrayReference(field, referencedModelName);
      } else {
        // Si es una referencia simple
        record[field] = await this.resolveSingleReference(field, referencedModelName);
      }
    }
  }

  /**
   * Resuelve una referencia a un solo objeto
   */
  private async resolveSingleReference(field: string, referencedModelName: string): Promise<mongoose.Types.ObjectId> {
    // Si es un modelo especial (como User), intentar obtener un ID real
    if (this.specialModels.has(referencedModelName)) {
      const realIds = await this.getRealModelIds(referencedModelName);
      if (realIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * realIds.length);
        return realIds[randomIndex];
      }
    }
    
    // Buscar datos generados para el modelo referenciado
    const existingData = this.generatedData[referencedModelName];
    
    if (existingData && existingData.length > 0) {
      // Seleccionar aleatoriamente un registro existente
      const randomIndex = Math.floor(Math.random() * existingData.length);
      return existingData[randomIndex]._id as mongoose.Types.ObjectId;
    }
    
    // Si no hay datos, crear un nuevo ObjectId
    return new mongoose.Types.ObjectId();
  }

  /**
   * Resuelve una referencia a un array de objetos
   */
  private async resolveArrayReference(field: string, referencedModelName: string): Promise<mongoose.Types.ObjectId[]> {
    // Si es un modelo especial (como User), intentar obtener IDs reales
    if (this.specialModels.has(referencedModelName)) {
      const realIds = await this.getRealModelIds(referencedModelName);
      if (realIds.length > 0) {
        // Determinar cuántas referencias generar
        const maxReferences = Math.min(3, realIds.length);
        const count = Math.floor(Math.random() * (maxReferences + 1));
        
        if (count === 0) {
          return [];
        }
        
        // Seleccionar aleatoriamente IDs sin repetir
        const references: mongoose.Types.ObjectId[] = [];
        const usedIndices = new Set<number>();
        
        for (let i = 0; i < count; i++) {
          let randomIndex: number;
          do {
            randomIndex = Math.floor(Math.random() * realIds.length);
          } while (usedIndices.has(randomIndex));
          
          usedIndices.add(randomIndex);
          references.push(realIds[randomIndex]);
        }
        
        return references;
      }
    }
    
    // Buscar datos generados para el modelo referenciado
    const existingData = this.generatedData[referencedModelName];
    
    if (existingData && existingData.length > 0) {
      // Determinar cuántas referencias generar (entre 0 y 3, o menos si no hay suficientes)
      const maxReferences = Math.min(3, existingData.length);
      const count = Math.floor(Math.random() * (maxReferences + 1));
      
      if (count === 0) {
        return [];
      }
      
      // Seleccionar aleatoriamente registros existentes sin repetir
      const references: mongoose.Types.ObjectId[] = [];
      const usedIndices = new Set<number>();
      
      for (let i = 0; i < count; i++) {
        let randomIndex: number;
        
        // Asegurar que no seleccionamos el mismo índice más de una vez
        do {
          randomIndex = Math.floor(Math.random() * existingData.length);
        } while (usedIndices.has(randomIndex));
        
        usedIndices.add(randomIndex);
        references.push(existingData[randomIndex]._id as mongoose.Types.ObjectId);
      }
      
      return references;
    }
    
    // Si no hay datos, crear un array vacío o con un nuevo ObjectId
    return Math.random() > 0.5 ? [] : [new mongoose.Types.ObjectId()];
  }

  /**
   * Obtiene IDs reales de un modelo especial como User desde la base de datos
   */
  private async getRealModelIds(modelName: string): Promise<mongoose.Types.ObjectId[]> {
    // Si ya tenemos los IDs en caché, usarlos
    if (this.cachedRealIds[modelName]?.length > 0) {
      return this.cachedRealIds[modelName];
    }
    
    try {
      // Comprobar si tenemos una conexión a la base de datos
      const isConnected = mongoose.connection.readyState === 1;
      
      if (!isConnected) {
        // Si no hay conexión, no intentar consultar la base de datos
        return [];
      }
      
      // Obtener el nombre de la colección en plural y minúscula
      const collectionName = modelName.toLowerCase() + 's';
      
      // Consultar solo los IDs
      const collection = mongoose.connection.collection(collectionName);
      const documents = await collection.find({}, { projection: { _id: 1 } }).limit(10).toArray();
      
      // Extraer los IDs
      const ids = documents.map(doc => doc._id);
      
      // Guardar en caché
      this.cachedRealIds[modelName] = ids;
      
      return ids;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error al obtener IDs reales para ${modelName}:`, error);
      return [];
    }
  }

  /**
   * Encuentra un modelo por su nombre
   */
  private findModelByName(modelName: string): Model | null {
    return this.models.find(model => model.name === modelName) || null;
  }
} 