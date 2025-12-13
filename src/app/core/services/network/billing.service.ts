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
  debt_id?: number; // ID of a single debt to pay
  debt_ids?: number[]; // Array of debt IDs for bulk payment
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
  paidDebts?: Array<{
    id: number;
    amount: string;
    description: string;
  }>; // Array of paid debt objects (only present when debts are paid)
}

export interface IframeResponse {
  iframe_url: string;
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
    if (request.debt_id !== undefined) {
      formData.append('debt_id', request.debt_id.toString());
    }
    if (request.debt_ids && request.debt_ids.length > 0) {
      // Append each debt_id separately for FormData (most APIs parse this as an array)
      request.debt_ids.forEach((id) => {
        formData.append('debt_ids[]', id.toString());
      });
    }
    formData.append('receipt_pdf', pdfFile, 'receipt.pdf');

    return this.http.post<ChargeBillingResponse>(`${this.apiUrl}/charge`, formData);
  }

  /**
   * Get Tranzila iframe URL from backend
   */
  getIframeUrl(): Observable<IframeResponse> {
    return this.http.post<IframeResponse>(`${this.apiUrl}/iframe`, { amount: 50 });
  }

  /**
   * Get Tranzila iframe URL for member payment
   */
  getMemberPaymentIframeUrl(memberId: string, amount: number, type?: string): Observable<IframeResponse> {
    return this.http.post<IframeResponse>(`${this.apiUrl}/member-payment`, { member_id: memberId, amount, type });
  }
}
