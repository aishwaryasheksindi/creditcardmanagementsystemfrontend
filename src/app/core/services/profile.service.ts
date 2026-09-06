import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = environment.apiBaseUrl;
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`).pipe(
      tap(profile => this.profileSubject.next(profile))
    );
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/users/me`, request).pipe(
      tap(profile => this.profileSubject.next(profile))
    );
  }

  changeMyPassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/me/password`, request);
  }

  get currentProfile(): UserProfile | null {
    return this.profileSubject.value;
  }
}