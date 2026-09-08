import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private roleCache = new Map<string, string>();

  constructor(private apiService: ApiService) {}

  getUserById(userId: string): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/users/${encodeURIComponent(userId)}`);
  }

  /**
   * Resolves roleName for a list of userIds using batched requests and in-memory caching.
   * Tolerates individual user resolution errors by falling back gracefully.
   */
  resolveUserRoles(userIds: string[]): Observable<Map<string, string>> {
    const uniqueIds = Array.from(new Set(userIds.filter(id => !!id)));
    const missingIds = uniqueIds.filter(id => !this.roleCache.has(id));

    if (missingIds.length === 0) {
      return of(new Map(this.roleCache));
    }

    const requests = missingIds.map(id =>
      this.getUserById(id).pipe(
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map(responses => {
        responses.forEach((res, index) => {
          const id = missingIds[index];
          if (res && res.roleName) {
            this.roleCache.set(id, res.roleName);
          }
        });
        return new Map(this.roleCache);
      })
    );
  }
}
