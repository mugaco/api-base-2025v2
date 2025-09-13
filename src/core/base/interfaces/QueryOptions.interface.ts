export interface IQueryOptions {
  sortBy?: string[];
  sortDesc?: boolean[];
  projection?: Record<string, 0 | 1> | string;
}