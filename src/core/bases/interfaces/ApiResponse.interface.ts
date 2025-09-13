export interface IApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}