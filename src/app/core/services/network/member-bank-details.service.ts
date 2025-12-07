import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MemberBankDetails } from '../../entities/member-bank-details.entity';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberBankDetailsService {
  private apiUrl = `${environment.apiUrl}/member-bank-details`;

  constructor(private http: HttpClient) {}

  getByMemberId(memberId: string): Observable<MemberBankDetails> {
    return this.http.get<MemberBankDetails>(`${environment.apiUrl}/members/${memberId}/bank-details`).pipe(
      map((bankDetails: any) => ({
        ...bankDetails,
        id: bankDetails.id || bankDetails._id
      }))
    );
  }

  create(bankDetails: Partial<MemberBankDetails>): Observable<MemberBankDetails> {
    return this.http.post<MemberBankDetails>(this.apiUrl, bankDetails);
  }

  update(id: string, bankDetails: Partial<MemberBankDetails>): Observable<MemberBankDetails> {
    return this.http.put<MemberBankDetails>(`${this.apiUrl}/${id}`, bankDetails);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
