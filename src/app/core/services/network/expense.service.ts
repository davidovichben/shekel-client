import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Expense } from '../../entities/expense.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    
    // Format as MM/DD/YYYY for display
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  private mapExpenseFromApi(expense: any): Expense {
    return {
      ...expense,
      id: String(expense.id || expense._id),
      description: expense.description || '',
      type: expense.type || '',
      amount: expense.amount ? String(expense.amount) : '0.00',
      date: expense.date || '',
      supplierId: expense.supplierId || expense.supplier_id || null,
      supplierName: expense.supplierName || expense.supplier_name || null,
      status: expense.status || 'pending',
      frequency: expense.frequency || 'one_time',
      receipt: expense.receipt || null,
      createdAt: expense.createdAt || expense.created_at || '',
      updatedAt: expense.updatedAt || expense.updated_at || ''
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
    supplier_id?: number;
    type?: string;
  }): Observable<PaginationResponse<Expense> & { totalSum?: string }> {
    return this.http.get<any>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((expense: any) => this.mapExpenseFromApi(expense)),
        totalSum: response.totalSum || '0.00'
      }))
    );
  }

  getOne(id: string): Observable<Expense> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(expense => this.mapExpenseFromApi(expense))
    );
  }

  create(expense: Partial<Expense>, receiptFile?: File): Observable<Expense> {
    if (receiptFile) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('description', expense.description || '');
      formData.append('type', expense.type || '');
      formData.append('amount', String(expense.amount || 0));
      formData.append('date', expense.date || '');
      if (expense.supplierId) {
        formData.append('supplier_id', String(expense.supplierId));
      }
      formData.append('status', expense.status || 'pending');
      formData.append('frequency', expense.frequency || 'one_time');
      formData.append('receipt', receiptFile);

      return this.http.post<any>(this.apiUrl, formData).pipe(
        map(expense => this.mapExpenseFromApi(expense))
      );
    } else {
      // Use JSON for regular create
      const payload: any = {
        description: expense.description,
        type: expense.type,
        amount: expense.amount,
        date: expense.date,
        status: expense.status,
        frequency: expense.frequency
      };
      if (expense.supplierId) {
        payload.supplier_id = expense.supplierId;
      }

      return this.http.post<any>(this.apiUrl, payload).pipe(
        map(expense => this.mapExpenseFromApi(expense))
      );
    }
  }

  update(id: string, expense: Partial<Expense>, receiptFile?: File): Observable<Expense> {
    if (receiptFile) {
      // Use FormData for file upload
      const formData = new FormData();
      if (expense.description !== undefined) formData.append('description', expense.description || '');
      if (expense.type !== undefined) formData.append('type', expense.type || '');
      if (expense.amount !== undefined) formData.append('amount', String(expense.amount));
      if (expense.date !== undefined) formData.append('date', expense.date || '');
      if (expense.supplierId !== undefined) {
        if (expense.supplierId) {
          formData.append('supplier_id', String(expense.supplierId));
        } else {
          formData.append('supplier_id', '');
        }
      }
      if (expense.status !== undefined) formData.append('status', expense.status || 'pending');
      if (expense.frequency !== undefined) formData.append('frequency', expense.frequency || 'one_time');
      formData.append('receipt', receiptFile);

      return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
        map(expense => this.mapExpenseFromApi(expense))
      );
    } else {
      // Use JSON for regular update
      const payload: any = {};
      if (expense.description !== undefined) payload.description = expense.description;
      if (expense.type !== undefined) payload.type = expense.type;
      if (expense.amount !== undefined) payload.amount = expense.amount;
      if (expense.date !== undefined) payload.date = expense.date;
      if (expense.supplierId !== undefined) payload.supplier_id = expense.supplierId;
      if (expense.status !== undefined) payload.status = expense.status;
      if (expense.frequency !== undefined) payload.frequency = expense.frequency;

      return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
        map(expense => this.mapExpenseFromApi(expense))
      );
    }
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadReceipt(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/receipt`, { responseType: 'blob' });
  }

  export(status?: string, ids?: string[], fileType?: string): Observable<Blob> {
    const body: { status?: string; ids?: string[]; file_type?: string } = {};
    if (status) body.status = status;
    if (ids) body.ids = ids;
    if (fileType) body.file_type = fileType;
    return this.http.post(`${this.apiUrl}/export`, body, { responseType: 'blob' });
  }

  getStats(month?: string, monthsBack?: number): Observable<any> {
    const params: { month?: string; months_back?: number } = {};
    if (month) params.month = month;
    if (monthsBack) params.months_back = monthsBack;
    return this.http.get<any>(`${this.apiUrl}/stats`, { params: params as any });
  }
}

