export interface PaginationCounts {
  totalRows: number;
  totalPages: number;
  [key: string]: number;
}

export interface PaginationResponse<T> {
  rows: T[];
  counts: PaginationCounts;
}
