import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardStats, LastMonthBalance } from '../../entities/dashboard.entity';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  private reportsUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  private mapLastMonthBalance(data: any): LastMonthBalance {
    return {
      income: data.income || data.income_amount || data.total_income || data.incomes || '0.00',
      expenses: data.expenses || data.expenses_amount || data.total_expenses || '0.00',
      balance: data.balance || data.balance_amount || '0.00',
      label: data.label || data.balance_label || '',
      changePercent: data.changePercent || data.change_percent,
      changeLabel: data.changeLabel || data.change_label
    };
  }

  getStats(month?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<any>(`${this.apiUrl}/stats`, { params }).pipe(
      map((response) => {
        // Map lastMonthBalance if it exists
        if (response.lastMonthBalance) {
          response.lastMonthBalance = this.mapLastMonthBalance(response.lastMonthBalance);
        }
        return response as DashboardStats;
      })
    );
  }

  generateExpenseReport(): Observable<Blob> {
    return this.http.get(`${this.reportsUrl}/expenses`, { responseType: 'blob' });
  }

  generateDonationsReport(): Observable<Blob> {
    return this.http.get(`${this.reportsUrl}/donations`, { responseType: 'blob' });
  }

  generateDebtsReport(): Observable<Blob> {
    return this.http.get(`${this.reportsUrl}/debts`, { responseType: 'blob' });
  }

  generateBalanceReport(): Observable<Blob> {
    return this.http.get(`${this.reportsUrl}/balance`, { responseType: 'blob' });
  }
}
