/**
 * Interfaz que define todos los parámetros de consulta aceptados por el endpoint GET unificado
 * Esta interfaz documenta los parámetros que pueden enviarse en la URL
 */
export interface IGetQueryParams {
  // Parámetros de paginación
  page?: number;                // Número de página (si se proporciona, habilita la paginación)
  itemsPerPage?: number;        // Elementos por página (máximo 100)
  items_per_page?: number;      // Alias alternativo para itemsPerPage
  'items-per-page'?: number;    // Alias alternativo para itemsPerPage (formato kebab-case)
  
  // Parámetros de ordenación
  sortBy?: string | string[];   // Campo(s) por los que ordenar
  sortDesc?: boolean | boolean[]; // Dirección de ordenación para cada campo (true=descendente)
  
  // Parámetros de proyección
  fields?: string;              // Lista de campos a incluir en el resultado (separados por comas)
  
  // Parámetros de filtrado comunes
  isDeleted?: boolean;          // Incluir elementos eliminados lógicamente
  
  // Otros parámetros comunes
  term?: string;                // Término de búsqueda (usado en endpoints /search)
  
  // La interfaz puede extenderse con parámetros específicos de cada entidad
  [key: string]: unknown;           // Otros parámetros de filtrado específicos de entidades
}