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

  getAll(params?: { status?: string; page?: number; limit?: number }): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => ({
          ...debt,
          id: debt.id || debt._id
        }))
      }))
    );
  }

  getByMemberOpen(memberId: string): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(`${environment.apiUrl}/members/${memberId}/debts/open`).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => ({
          ...debt,
          id: debt.id || debt._id
        }))
      }))
    );
  }

  getByMemberClosed(memberId: string): Observable<PaginationResponse<Debt>> {
    return this.http.get<PaginationResponse<Debt>>(`${environment.apiUrl}/members/${memberId}/debts/closed`).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((debt: any) => ({
          ...debt,
          id: debt.id || debt._id
        }))
      }))
    );
  }

  getOne(id: string): Observable<Debt> {
    return this.http.get<Debt>(`${this.apiUrl}/${id}`);
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
}
