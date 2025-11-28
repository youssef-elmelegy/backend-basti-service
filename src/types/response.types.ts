export interface SuccessResponse<T> {
  code: number;
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  code: number;
  success: false;
  message: string;
  error?: string;
  data?: object;
  timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  nextPage: boolean;
  prevPage: boolean;
}

export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: PaginationMetadata;
}
