import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
}
