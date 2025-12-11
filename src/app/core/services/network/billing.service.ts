import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChargeBillingRequest {
  credit_card_id: number;
  amount: number;
  description?: string;
  type?: string; // Receipt type: vows, community_donations, external_donations, ascensions, online_donations, membership_fees, other
  createReceipt?: boolean; // Set to true to generate and save a PDF receipt
}

export interface ChargeBillingResponse {
  success: boolean;
  transaction: {
    id: string;
    amount: string;
    credit_card_id: number;
    last_digits: string;
    description: string;
    status: string;
  };
  receipt: {
    id: number;
    receipt_number: string;
    total_amount: string;
    status: string;
    type: string;
    pdf_file?: string | null; // PDF file path if createReceipt was true
  };
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private apiUrl = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  charge(request: ChargeBillingRequest): Observable<ChargeBillingResponse> {
    return this.http.post<ChargeBillingResponse>(`${this.apiUrl}/charge`, request);
  }

  /**
   * Charge with PDF receipt file upload
   * @param request Charge request data
   * @param pdfFile PDF file as Blob
   */
  chargeWithReceipt(request: ChargeBillingRequest, pdfFile: Blob): Observable<ChargeBillingResponse> {
    const formData = new FormData();
    formData.append('credit_card_id', request.credit_card_id.toString());
    formData.append('amount', request.amount.toString());
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.type) {
      formData.append('type', request.type);
    }
    formData.append('receipt_pdf', pdfFile, 'receipt.pdf');
    
    return this.http.post<ChargeBillingResponse>(`${this.apiUrl}/charge`, formData);
  }
}
