import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MemberGroup {
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
export class MemberGroupService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/members`;

  getByMember(memberId: string): Observable<MemberGroup[]> {
    return this.http.get<ApiGroup[]>(`${this.apiUrl}/${memberId}/groups`).pipe(
      map(groups => groups.map(group => ({
        id: String(group.id),
        name: group.name
      })))
    );
  }

  addToMember(memberId: string, groupId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${memberId}/groups`, { group_id: groupId });
  }

  removeFromMember(memberId: string, groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${memberId}/groups/${groupId}`);
  }
}
