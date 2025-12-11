import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MemberCreditCard {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'diners';
  lastFourDigits: string;
  holderName: string;
  expiryDate: string;
  isDefault: boolean;
}

interface ApiCreditCard {
  id: number;
  company: string;
  last_digits: string;
  full_name: string;
  expiration: string;
  is_default: number;
  member_id: number;
  token: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberCreditCardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/members`;

  getByMember(memberId: string): Observable<MemberCreditCard[]> {
    return this.http.get<ApiCreditCard[]>(`${this.apiUrl}/${memberId}/credit-cards`).pipe(
      map(cards => cards.map(card => ({
        id: String(card.id),
        type: card.company.toLowerCase() as 'visa' | 'mastercard' | 'amex' | 'diners',
        lastFourDigits: card.last_digits,
        holderName: card.full_name,
        expiryDate: card.expiration,
        isDefault: card.is_default === 1
      })))
    );
  }

  setDefault(memberId: string, cardId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${memberId}/credit-cards/${cardId}/set-default`, {});
  }

  create(memberId: string, cardData: {
    last_digits: string;
    company: string;
    expiration: string; // Format: MM/YY
    full_name: string;
  }): Observable<MemberCreditCard> {
    return this.http.post<ApiCreditCard>(`${this.apiUrl}/${memberId}/credit-cards`, cardData).pipe(
      map(card => ({
        id: String(card.id),
        type: card.company.toLowerCase() as 'visa' | 'mastercard' | 'amex' | 'diners',
        lastFourDigits: card.last_digits,
        holderName: card.full_name,
        expiryDate: card.expiration,
        isDefault: card.is_default === 1
      }))
    );
  }
}
