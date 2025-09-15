/**
 * Clase para analizar modelos y extraer su estructura
 */
export class ModelAnalyzer {
  /**
   * Constructor de la clase
   */
  constructor(private readonly modelInfo: any) {}

  /**
   * Analiza la estructura del modelo
   */
  public analyze(): any {
    const { name, fields, references, enums } = this.modelInfo;
    
    // Procesar campos para asegurar que tienen toda la información necesaria
    const processedFields = fields.map((field: any) => {
      // Si es un campo enum, añadir sus valores
      if (enums && enums[field.name]) {
        return {
          ...field,
          isEnum: true,
          enumValues: enums[field.name]
        };
      }
      
      return field;
    });
    
    // Procesar referencias para asegurar que tienen toda la información necesaria
    const processedReferences = references.map((ref: any) => {
      // Buscar el campo correspondiente para obtener más información
      const field = processedFields.find((f: any) => f.name === ref.field);
      
      return {
        ...ref,
        required: field ? field.required : false,
        isArray: field ? field.type === 'array' : false
      };
    });
    
    return {
      name,
      fields: processedFields,
      references: processedReferences
    };
  }

  /**
   * Obtiene la lista de campos que son referencias a otros modelos
   */
  public getReferenceFields(): any[] {
    const { references } = this.modelInfo;
    return references || [];
  }

  /**
   * Obtiene los valores enum para un campo específico
   */
  public getEnumValues(fieldName: string): string[] {
    const { enums } = this.modelInfo;
    return (enums && enums[fieldName]) || [];
  }

  /**
   * Obtiene los campos obligatorios del modelo
   */
  public getRequiredFields(): any[] {
    const { fields } = this.modelInfo;
    return fields.filter((field: any) => field.required);
  }

  /**
   * Comprueba si un campo es una referencia a otro modelo
   */
  public isReferenceField(fieldName: string): boolean {
    const { references } = this.modelInfo;
    return references ? references.some((ref: any) => ref.field === fieldName) : false;
  }

  /**
   * Obtiene el modelo al que hace referencia un campo
   */
  public getReferencedModel(fieldName: string): string | null {
    const { references } = this.modelInfo;
    
    if (!references) return null;
    
    const reference = references.find((ref: any) => ref.field === fieldName);
    return reference ? reference.model : null;
  }
} 