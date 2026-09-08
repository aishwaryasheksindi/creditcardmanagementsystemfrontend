import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/notifications`;

  constructor(private http: HttpClient) {}

  public getNotificationsByCustomerId(customerId: string): Observable<Notification[]> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<Notification[]>(this.baseUrl, { params });
  }

  public getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  public getNotificationById(notificationId: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${notificationId}`);
  }
}
