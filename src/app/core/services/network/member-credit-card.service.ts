import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MemberCreditCard {
  id: string;
  type: 'visa' | 'mastercard';
  lastFourDigits: string;
  holderName: string;
  expiryDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemberCreditCardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/members`;

  getByMember(memberId: string): Observable<MemberCreditCard[]> {
    return this.http.get<MemberCreditCard[]>(`${this.apiUrl}/${memberId}/credit-cards`);
  }
}
