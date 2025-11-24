import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receipt } from '../../entities/receipt.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaginationResponse<Receipt>> {
    return this.http.get<PaginationResponse<Receipt>>(this.apiUrl);
  }

  getOne(id: string): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.apiUrl}/${id}`);
  }

  create(receipt: Partial<Receipt>): Observable<Receipt> {
    return this.http.post<Receipt>(this.apiUrl, receipt);
  }
}
