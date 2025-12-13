import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Member } from '../../entities/member.entity';

export interface Group {
  id: string;
  name: string;
}

interface ApiGroup {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  list(): Observable<Group[]> {
    return this.http.get<ApiGroup[]>(`${this.apiUrl}/groups/list`).pipe(
      map(groups => groups.map(group => ({
        id: String(group.id),
        name: group.name
      })))
    );
  }

  getAvailableGroups(memberId: string): Observable<Group[]> {
    return this.http.get<ApiGroup[]>(`${this.apiUrl}/members/${memberId}/available-groups`).pipe(
      map(groups => groups.map(group => ({
        id: String(group.id),
        name: group.name
      })))
    );
  }

  create(group: Partial<Group>): Observable<Group> {
    return this.http.post<ApiGroup>(`${this.apiUrl}/groups`, group).pipe(
      map(apiGroup => ({
        id: String(apiGroup.id),
        name: apiGroup.name
      }))
    );
  }

  getOne(groupId: string): Observable<Group> {
    return this.http.get<ApiGroup>(`${this.apiUrl}/groups/${groupId}`).pipe(
      map(apiGroup => ({
        id: String(apiGroup.id),
        name: apiGroup.name
      }))
    );
  }

  getGroupMembers(groupId: string): Observable<Member[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups/${groupId}/members`).pipe(
      map(members => members.map(member => this.mapMember(member)))
    );
  }

  private mapMember(member: any): Member {
    return {
      ...member,
      id: String(member.id || member._id || member.memberId),
      fullName: member.fullName || member.full_name || '',
      firstName: member.firstName || member.first_name || '',
      lastName: member.lastName || member.last_name || '',
      mobile: member.mobile || '',
      phone: member.phone || '',
      email: member.email || '',
      gender: member.gender || '',
      address: member.address || '',
      address2: member.address2 || member.address_2 || '',
      city: member.city || '',
      country: member.country || '',
      zipcode: member.zipcode || member.zip_code || '',
      gregorianBirthDate: member.gregorianBirthDate || member.gregorian_birth_date || null,
      hebrewBirthDate: member.hebrewBirthDate || member.hebrew_birth_date || null,
      gregorianWeddingDate: member.gregorianWeddingDate || member.gregorian_wedding_date || null,
      hebrewWeddingDate: member.hebrewWeddingDate || member.hebrew_wedding_date || null,
      gregorianDeathDate: member.gregorianDeathDate || member.gregorian_death_date || null,
      hebrewDeathDate: member.hebrewDeathDate || member.hebrew_death_date || null,
      contactPerson: member.contactPerson || member.contact_person || '',
      contactPersonType: member.contactPersonType || member.contact_person_type || '',
      tag: member.tag || '',
      title: member.title || '',
      type: member.type || '',
      memberNumber: member.memberNumber || member.member_number || '',
      hasWebsiteAccount: member.hasWebsiteAccount ?? member.has_website_account ?? false,
      shouldMail: member.shouldMail ?? member.should_mail ?? false,
      balance: member.balance || '0',
      lastMessageDate: member.lastMessageDate || member.last_message_date || null,
      groups: member.groups || []
    };
  }

  update(groupId: string, group: Partial<Group>): Observable<Group> {
    return this.http.put<ApiGroup>(`${this.apiUrl}/groups/${groupId}`, group).pipe(
      map(apiGroup => ({
        id: String(apiGroup.id),
        name: apiGroup.name
      }))
    );
  }

  addMember(groupId: string, memberId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/groups/${groupId}/members`, { member_id: memberId });
  }

  removeMember(groupId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/members/${memberId}`);
  }
}
