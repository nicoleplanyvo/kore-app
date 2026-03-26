export * from './auth';
export * from './tools';
export * from './audit';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
