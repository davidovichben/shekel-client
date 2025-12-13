import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Bank } from '../../entities/bank.entity';

export interface Package {
  id: string;
  name: string;
  price: number;
  features: string[];
  payment_features: string[];
  paid_features?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GenericService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBanks(): Observable<Bank[]> {
    return this.http.get<Bank[]>(`${this.apiUrl}/banks`);
  }

  getPackages(): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages`);
  }
}
