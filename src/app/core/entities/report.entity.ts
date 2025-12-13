export interface ReportCategory {
  id: string;
  label: string;
  reports: ReportType[];
}

export interface ReportType {
  id: string;
  label: string;
  category: string;
}

export interface ReportCategoryResponse {
  categories: ReportCategory[];
}

export interface ReportColumn {
  id: string;
  label: string;
  required: boolean;
}

export interface ReportFilterOption {
  value: string;
  label: string;
}

export interface ReportFilter {
  key: string;
  label: string;
  options: ReportFilterOption[];
}

export interface ReportSortOption {
  value: string;
  label: string;
}

export interface ReportConfigResponse {
  reportName: string;
  columns: ReportColumn[];
  sortOptions: ReportSortOption[];
  filters: ReportFilter[];
  supportsDateRange: boolean;
  supportsResultLimit: boolean;
}

export interface GenerateReportRequest {
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
  resultLimit: string;
  columns: string[];
}

export interface ExportReportRequest extends GenerateReportRequest {}

export interface ReportErrorResponse {
  error?: string;
  message: string;
  missingColumns?: string[];
  errors?: Record<string, string[]>;
}

