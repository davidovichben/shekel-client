import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MemberBillingSettings {
  shouldBill: boolean;
  billingDate: string;
  billingType: 'credit_card' | 'bank' | 'bit';
  selectedCreditCard: string;
}

interface ApiBillingSettings {
  should_bill: boolean;
  billing_date: number;
  billing_type: string;
  selected_credit_card: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberBillingSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/members`;

  get(memberId: string): Observable<MemberBillingSettings> {
    return this.http.get<ApiBillingSettings>(`${this.apiUrl}/${memberId}/billing-settings`).pipe(
      map(settings => ({
        shouldBill: settings.should_bill,
        billingDate: settings.billing_date ? String(settings.billing_date) : '10',
        billingType: (settings.billing_type as 'credit_card' | 'bank' | 'bit') || 'credit_card',
        selectedCreditCard: settings.selected_credit_card ? String(settings.selected_credit_card) : ''
      }))
    );
  }

  put(memberId: string, settings: MemberBillingSettings): Observable<MemberBillingSettings> {
    const apiSettings: ApiBillingSettings = {
      should_bill: settings.shouldBill,
      billing_date: Number(settings.billingDate),
      billing_type: settings.billingType,
      selected_credit_card: settings.selectedCreditCard
    };

    return this.http.put<ApiBillingSettings>(`${this.apiUrl}/${memberId}/billing-settings`, apiSettings).pipe(
      map(response => ({
        shouldBill: response.should_bill,
        billingDate: String(response.billing_date),
        billingType: response.billing_type as 'credit_card' | 'bank' | 'bit',
        selectedCreditCard: response.selected_credit_card ? String(response.selected_credit_card) : ''
      }))
    );
  }
}
