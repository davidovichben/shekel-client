import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Debt } from '../../entities/debt.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private apiUrl = `${environment.apiUrl}/debts`;

  constructor(private http: HttpClient) {}

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    
    // Handle ISO date format (e.g., "2026-01-01T00:00:00.000000Z")
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    
    // Format as DD/MM/YYYY (to match Hebrew date utility expectations)
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  private mapDebtFromApi(debt: any): Debt {
    // Map API field names to our interface
    // API uses: due_date, member_id, member_name, last_reminder_sent_at
    const gregorianDate = debt.due_date || debt.gregorianDate || '';
    const lastReminderSentAt = debt.last_reminder_sent_at || debt.lastReminderSentAt || null;
    
    return {
      ...debt,
      id: String(debt.id || debt._id),
      fullName: debt.member_name || debt.memberName || debt.fullName || '',
      // Store ISO date string directly - will format for display in component
      gregorianDate: gregorianDate || '',
      debtType: debt.debtType || debt.type || debt.debt_type || '',
      lastReminder: debt.lastReminder || null,
      // Store ISO date string directly - will format for display in component
      lastReminderSentAt: lastReminderSentAt || null,
      status: debt.status || 'pending',
      amount: debt.amount ? parseFloat(String(debt.amount)) : 0,
      description: debt.description || '',
      memberId: String(debt.member_id || debt.memberId || ''),
      autoPaymentApproved: debt.autoPaymentApproved || false,
      shouldBill: debt.shouldBill !== undefined ? debt.shouldBill : (debt.should_bill !== undefined ? debt.should_bill : debt.autoPaymentApproved),
      hebrewDate: debt.hebrewDate || debt.hebrew_date || '',
      createdAt: debt.createdAt || debt.created_at || '',
      updatedAt: debt.updatedAt || debt.updated_at || ''
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
    should_bill?: boolean;
  }): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => this.mapDebtFromApi(debt))
      }))
    );
  }

  getByMemberOpen(memberId: string): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(`${environment.apiUrl}/members/${memberId}/debts/open`).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => this.mapDebtFromApi(debt))
      }))
    );
  }

  getByMemberClosed(memberId: string): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(`${environment.apiUrl}/members/${memberId}/debts/closed`).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => this.mapDebtFromApi(debt))
      }))
    );
  }

  getOne(id: string): Observable<Debt> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(debt => this.mapDebtFromApi(debt))
    );
  }

  create(debt: Partial<Debt>): Observable<Debt> {
    return this.http.post<Debt>(this.apiUrl, debt);
  }

  update(id: string, debt: Partial<Debt>): Observable<Debt> {
    return this.http.put<Debt>(`${this.apiUrl}/${id}`, debt);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  sendReminder(id: string): Observable<Debt> {
    return this.http.post<Debt>(`${this.apiUrl}/${id}/reminder`, {}).pipe(
      map(debt => this.mapDebtFromApi(debt))
    );
  }

  bulkCreate(debts: Partial<Debt>[]): Observable<Debt[]> {
    return this.http.post<Debt[]>(`${this.apiUrl}/bulk`, debts).pipe(
      map(debts => debts.map(debt => this.mapDebtFromApi(debt)))
    );
  }

  export(status?: string, ids?: string[], fileType?: string): Observable<Blob> {
    const body: { status?: string; ids?: string[]; file_type?: string } = {};
    if (status) body.status = status;
    if (ids) body.ids = ids;
    if (fileType) body.file_type = fileType;
    return this.http.post(`${this.apiUrl}/export`, body, { responseType: 'blob' });
  }
}
