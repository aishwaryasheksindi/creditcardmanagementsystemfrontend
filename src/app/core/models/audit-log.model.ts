export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | string;

export interface AuditLog {
  auditLogId: string;
  performedByUserId: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string; // ISO date string
}
