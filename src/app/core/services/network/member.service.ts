import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Member } from '../../entities/member.entity';
import { PaginationResponse } from '../../entities/pagination.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  getAll(params?: { type?: string; page?: number; limit?: number; search?: string }): Observable<PaginationResponse<Member>> {
    return this.http.get<PaginationResponse<Member>>(this.apiUrl, { params: params as any }).pipe(
      map(response => ({
        ...response,
        rows: response.rows.map((member: any) => ({
          ...member,
          id: member.id || member._id || member.memberId
        }))
      }))
    );
  }

  getOne(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  create(member: Partial<Member>): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, member);
  }

  update(id: string, member: Partial<Member>): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/${id}`, member);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteMany(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk`, { body: { ids } });
  }

  export(type?: string, ids?: string[], fileType?: string): Observable<Blob> {
    const body: { type?: string; ids?: string[]; file_type?: string } = {};
    if (type) body.type = type;
    if (ids) body.ids = ids;
    if (fileType) body.file_type = fileType;
    return this.http.post(`${this.apiUrl}/export`, body, { responseType: 'blob' });
  }
}
