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

  // Parámetros de filtrado unificados
  filters?: string;             // JSON string con filtros usando MongoQueryBuilder
  simpleSearch?: string;        // JSON string para búsqueda simple: {"search":"término","fields":["campo1","campo2"]}
}