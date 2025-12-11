import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Income, IncomeStats } from '../../entities/income.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(private http: HttpClient) {}

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    
    // Handle ISO date format (e.g., "2026-01-01T00:00:00.000000Z")
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    
    // Format as DD/MM/YYYY for display
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private mapIncomeFromApi(income: any): Income {
    // API returns: receiptDate, receiptNumber, userId, userName, total, paymentMethod, type
    const date = income.receiptDate || income.receipt_date || income.date || '';
    
    return {
      ...income,
      id: String(income.id || income._id),
      description: income.notes || income.description || '',
      category: income.type || income.category || 'other',
      amount: income.total ? String(income.total) : (income.totalAmount ? String(income.totalAmount) : (income.amount ? String(income.amount) : '0.00')),
      date: date, // Keep ISO format for Hebrew conversion
      payerId: income.userId || income.user_id || income.payerId || null,
      payerName: income.userName || income.user_name || income.payerName || null,
      number: income.receiptNumber || income.receipt_number || income.number || null,
      status: income.status || 'pending',
      paymentType: income.paymentMethod || income.payment_method || income.paymentType || 'credit_card',
      receipt: income.receipt || null,
      hebrewDate: income.hebrew_date || income.hebrewDate || '',
      gregorianDate: date ? this.formatDate(date) : '',
      createdAt: income.createdAt || income.created_at || '',
      updatedAt: income.updatedAt || income.updated_at || ''
    };
  }

  getAll(params?: {
    status?: string;
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    type?: string; // Receipt type (category)
    user_id?: number;
    payment_method?: string;
  }): Observable<PaginationResponse<Income> & { totalSum?: string }> {
    return this.http.get<any>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((income: any) => this.mapIncomeFromApi(income)),
        totalSum: response.totalSum || '0.00'
      }))
    );
  }

  getOne(id: string): Observable<Income> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(income => this.mapIncomeFromApi(income))
    );
  }

  export(params?: {
    file_type?: string;
    status?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    ids?: string[];
  }): Observable<Blob> {
    const body: any = {};
    if (params?.file_type) body.file_type = params.file_type;
    if (params?.status) body.status = params.status;
    if (params?.type) body.type = params.type;
    if (params?.date_from) body.date_from = params.date_from;
    if (params?.date_to) body.date_to = params.date_to;
    if (params?.ids && params.ids.length > 0) body.ids = params.ids;
    return this.http.post(`${this.apiUrl}/export`, body, { responseType: 'blob' });
  }

  getStats(month?: string, monthsBack?: number): Observable<IncomeStats> {
    const params: { month?: string; months_back?: number } = {};
    if (month) params.month = month;
    if (monthsBack) params.months_back = monthsBack;
    return this.http.get<any>(`${this.apiUrl}/stats`, { params: params as any }).pipe(
      map(response => ({
        ...response,
        // Map uncollectedReceipts to uncollectedIncome for shared component compatibility
        uncollectedIncome: response.uncollectedReceipts || response.uncollectedIncome
      }))
    );
  }

  downloadReceipt(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}

