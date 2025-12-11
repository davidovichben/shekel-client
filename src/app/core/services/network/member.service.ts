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
        rows: response.rows.map((member: any) => this.mapMember(member))
      }))
    );
  }

  private mapMember(member: any): Member {
    return {
      ...member,
      id: member.id || member._id || member.memberId,
      fullName: member.fullName || member.full_name || '',
      firstName: member.firstName || member.first_name || '',
      lastName: member.lastName || member.last_name || '',
      memberNumber: member.memberNumber || member.member_number || '',
      gregorianBirthDate: member.gregorianBirthDate || member.gregorian_birth_date || null,
      hebrewBirthDate: member.hebrewBirthDate || member.hebrew_birth_date || null,
      gregorianWeddingDate: member.gregorianWeddingDate || member.gregorian_wedding_date || null,
      hebrewWeddingDate: member.hebrewWeddingDate || member.hebrew_wedding_date || null,
      gregorianDeathDate: member.gregorianDeathDate || member.gregorian_death_date || null,
      hebrewDeathDate: member.hebrewDeathDate || member.hebrew_death_date || null,
      contactPerson: member.contactPerson || member.contact_person || '',
      contactPersonType: member.contactPersonType || member.contact_person_type || '',
      hasWebsiteAccount: member.hasWebsiteAccount ?? member.has_website_account ?? false,
      shouldMail: member.shouldMail ?? member.should_mail ?? false,
      lastMessageDate: member.lastMessageDate || member.last_message_date || null
    };
  }

  list(search?: string): Observable<{ id: string; name: string }[]> {
    const params: { search?: string } = {};
    if (search) params.search = search;
    return this.http.get<{ id: string; name: string }[]>(`${this.apiUrl}/list`, { params: params as any });
  }

  getOne(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`).pipe(
      map(member => this.mapMember(member))
    );
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

  notify(memberId: string, message: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${memberId}/notify`, { message });
  }

  notifyMany(memberIds: string[], message: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notify`, { ids: memberIds, message });
  }
}
