import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notification } from '../../entities/notification.entity';
import { PaginationResponse } from '../../entities/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getUnread(page = 1, limit = 10): Observable<PaginationResponse<Notification>> {
    return this.http.get<PaginationResponse<Notification>>(this.apiUrl, {
      params: { is_read: '0', page: page.toString(), limit: limit.toString() }
    });
  }

  getRead(page = 1, limit = 10): Observable<PaginationResponse<Notification>> {
    return this.http.get<PaginationResponse<Notification>>(this.apiUrl, {
      params: { is_read: '1', page: page.toString(), limit: limit.toString() }
    });
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/mark-read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {});
  }
}
