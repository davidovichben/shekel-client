import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VowSet } from '../../entities/vow-set.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VowSetService {
  private apiUrl = `${environment.apiUrl}/vow-sets`;

  constructor(private http: HttpClient) {}

  getAll(params?: { page?: number; limit?: number }): Observable<PaginationResponse<VowSet>> {
    return this.http.get<PaginationResponse<VowSet>>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((vowSet: any) => ({
          ...vowSet,
          id: vowSet.id || vowSet._id
        }))
      }))
    );
  }

  getOne(id: string): Observable<VowSet> {
    return this.http.get<VowSet>(`${this.apiUrl}/${id}`);
  }

  create(vowSet: Partial<VowSet>): Observable<VowSet> {
    return this.http.post<VowSet>(this.apiUrl, vowSet);
  }

  update(id: string, vowSet: Partial<VowSet>): Observable<VowSet> {
    return this.http.put<VowSet>(`${this.apiUrl}/${id}`, vowSet);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
