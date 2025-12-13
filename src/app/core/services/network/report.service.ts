import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ReportCategoryResponse,
  ReportConfigResponse,
  GenerateReportRequest,
  ExportReportRequest
} from '../../entities/report.entity';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Get all report categories and types
   */
  getCategories(): Observable<ReportCategoryResponse> {
    return this.http.get<ReportCategoryResponse>(`${this.apiUrl}/categories`);
  }

  /**
   * Get configuration for a specific report type
   */
  getConfig(reportTypeId: string): Observable<ReportConfigResponse> {
    return this.http.get<ReportConfigResponse>(`${this.apiUrl}/${reportTypeId}/config`);
  }

  /**
   * Generate PDF report
   */
  generateReport(reportTypeId: string, request: GenerateReportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${reportTypeId}/generate`, request, {
      responseType: 'blob'
    });
  }

  /**
   * Export report to Hashavshevet (CSV format)
   */
  exportToHashavshevet(reportTypeId: string, request: ExportReportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${reportTypeId}/export/hashavshevet`, request, {
      responseType: 'blob'
    });
  }
}

