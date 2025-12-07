import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bank } from '../../entities/bank.entity';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private apiUrl = `${environment.apiUrl}/banks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Bank[]> {
    return this.http.get<Bank[]>(this.apiUrl);
  }
}
