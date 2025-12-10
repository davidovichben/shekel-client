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
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if can't parse
    }
    
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  private mapDebtFromApi(debt: any): Debt {
    return {
      ...debt,
      id: debt.id || debt._id,
      fullName: debt.memberName || debt.fullName || '',
      gregorianDate: this.formatDate(debt.gregorianDate),
      debtType: debt.debtType || debt.type || debt.debt_type || '',
      lastReminder: debt.lastReminder ? this.formatDate(debt.lastReminder) : null,
      lastReminderSentAt: debt.lastReminderSentAt ? this.formatDate(debt.lastReminderSentAt) : null,
      status: debt.status || 'pending',
      amount: debt.amount ? parseFloat(debt.amount) : 0,
      description: debt.description || '',
      memberId: debt.memberId || '',
      autoPaymentApproved: debt.autoPaymentApproved || false,
      hebrewDate: debt.hebrewDate || '',
      createdAt: debt.createdAt || '',
      updatedAt: debt.updatedAt || ''
    };
  }

  getAll(params?: { status?: string; page?: number; limit?: number }): Observable<PaginationResponse<Debt>> {
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
}
