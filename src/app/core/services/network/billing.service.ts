import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CreateBillingRequest {
  member_id: string;
  amount: number;
  installments: number;
  description: string;
  payer: {
    first_name: string;
    last_name: string;
    mobile: string;
    address: string;
    email: string;
    company_id?: string;
  };
}

export interface CreateBillingResponse {
  id: string;
  member_id: string;
  amount: number;
  installments: number;
  description: string;
  status: string;
  created_at: string;
}

export interface ChargeBillingRequest {
  billing_id: string;
  payment_method: 'credit' | 'cash' | 'check' | 'bank_transfer' | 'other';
  card_token?: string;
}

export interface ChargeBillingResponse {
  id: string;
  billing_id: string;
  status: 'success' | 'failed' | 'pending';
  transaction_id?: string;
  invoice_url?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  create(billing: CreateBillingRequest): Observable<CreateBillingResponse> {
    return this.http.post<CreateBillingResponse>(this.apiUrl, billing);
  }

  charge(request: ChargeBillingRequest): Observable<ChargeBillingResponse> {
    return this.http.post<ChargeBillingResponse>(`${this.apiUrl}/charge`, request);
  }
}
