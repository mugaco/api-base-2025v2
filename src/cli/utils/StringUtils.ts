/**
 * Utilidades para manipulación de strings
 */
export class StringUtils {
  /**
   * Convierte un string a camelCase
   */
  static toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Convierte un string a PascalCase (primera letra en mayúscula)
   */
  static toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  /**
   * Convierte un string a kebab-case
   */
  static toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .toLowerCase();
  }

  /**
   * Convierte un string a snake_case
   */
  static toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
  }

  /**
   * Pluraliza un string (reglas básicas)
   */
  static pluralize(str: string): string {
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
        str.endsWith('sh') || str.endsWith('ch')) {
      return str + 'es';
    } else if (str.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(str.charAt(str.length - 2))) {
      return str.slice(0, -1) + 'ies';
    } else {
      return str + 's';
    }
  }

  /**
   * Verifica si un string es válido como nombre de variable
   */
  static isValidVariableName(str: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
  }
  
  /**
   * Capitaliza la primera letra
   */
  static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convierte el primer caracter a minúscula
   */
  static lowercaseFirstLetter(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Formatea una string para ser usada como nombre de clase
   */
  static formatClassName(str: string): string {
    return this.toPascalCase(str);
  }

  /**
   * Formatea una string para ser usada como nombre de variable
   */
  static formatVariableName(str: string): string {
    return this.toCamelCase(str);
  }
} 