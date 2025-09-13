export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    totalRows: number;
    totalFilteredRows: number;
    pages: number;
    page: number;
    itemsPerPage: number;
  };
}