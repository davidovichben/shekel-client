import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardStats, LastMonthBalance } from '../../entities/stats.entity';
import { environment } from '../../../../environments/environment';

export interface SearchResultItem {
  id: string;
  name: string;
}

export interface SearchResults {
  members: SearchResultItem[];
  debts: SearchResultItem[];
  receipts: SearchResultItem[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${environment.apiUrl}/stats`;
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
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map((response) => {
        // Map lastMonthBalance if it exists
        if (response.lastMonthBalance) {
          response.lastMonthBalance = this.mapLastMonthBalance(response.lastMonthBalance);
        }
        return response as DashboardStats;
      })
    );
  }

  getFinancialData(month?: string): Observable<DashboardStats> {
    return this.getStats(month);
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

  search(q: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this.baseUrl}/search`, { params: { q } });
  }
}
