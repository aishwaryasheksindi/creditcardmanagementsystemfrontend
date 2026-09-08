import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  constructor(private apiService: ApiService) {}

  getAllAuditLogs(entityType?: string, entityId?: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (entityType && entityType.trim()) {
      params = params.set('entityType', entityType.trim());
    }
    if (entityId && entityId.trim()) {
      params = params.set('entityId', entityId.trim());
    }
    return this.apiService.get<AuditLog[]>('/audit-logs', params);
  }

  getAuditLogById(auditLogId: string): Observable<AuditLog> {
    return this.apiService.get<AuditLog>(`/audit-logs/${encodeURIComponent(auditLogId)}`);
  }
}
