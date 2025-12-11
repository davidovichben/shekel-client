import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Business {
  id: string;
  business_number: string;
  name: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  type: 'npo' | 'exempt' | 'licensed' | 'company';
  website: string | null;
  preferred_date_format: 'gregorian' | 'hebrew';
  show_details_on_invoice: boolean;
  synagogue_name: string;
  synagogue_phone: string | null;
  synagogue_address: string | null;
  synagogue_email: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private apiUrl = `${environment.apiUrl}/business`;

  constructor(private http: HttpClient) {}

  show(): Observable<Business> {
    return this.http.get<Business>(this.apiUrl);
  }

  update(business: Partial<Business>): Observable<Business> {
    return this.http.put<Business>(this.apiUrl, business);
  }
}
