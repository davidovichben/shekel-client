import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Invoice } from '../../entities/invoice.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getAll(params?: { status?: string; page?: number; limit?: number }): Observable<PaginationResponse<Invoice>> {
    return this.http.get<PaginationResponse<Invoice>>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((invoice: any) => ({
          ...invoice,
          id: invoice.id || invoice._id
        }))
      }))
    );
  }

  getOne(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  create(invoice: Partial<Invoice>): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, invoice);
  }

  update(id: string, invoice: Partial<Invoice>): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, invoice);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  export(ids?: string[], fileType?: string): Observable<Blob> {
    const body: { ids?: string[]; file_type?: string } = {};
    if (ids) body.ids = ids;
    if (fileType) body.file_type = fileType;
    return this.http.post(`${this.apiUrl}/export`, body, { responseType: 'blob' });
  }
}
