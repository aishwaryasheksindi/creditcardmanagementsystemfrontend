import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Staff, CreateStaffRequest } from '../models/staff.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  constructor(private apiService: ApiService) {}

  getAllStaff(): Observable<Staff[]> {
    return this.apiService.get<Staff[]>('/staff');
  }

  searchStaff(empName?: string, empPhone?: string): Observable<Staff[]> {
    let params = new HttpParams();
    if (empName && empName.trim()) {
      params = params.set('empName', empName.trim());
    }
    if (empPhone && empPhone.trim()) {
      params = params.set('empPhone', empPhone.trim());
    }
    return this.apiService.get<Staff[]>('/staff/search', params);
  }

  getStaffById(staffId: string): Observable<Staff> {
    return this.apiService.get<Staff>(`/staff/${encodeURIComponent(staffId)}`);
  }

  createAdmin(data: CreateStaffRequest): Observable<Staff> {
    const payload = this.toBasePayload(data);
    return this.apiService.post<Staff>('/staff/admins', payload);
  }

  createBankOfficer(data: CreateStaffRequest): Observable<Staff> {
    const payload = {
      ...this.toBasePayload(data),
      branchCode: data.branchCode || ''
    };
    return this.apiService.post<Staff>('/staff/bank-officers', payload);
  }

  createFraudAnalyst(data: CreateStaffRequest): Observable<Staff> {
    const payload = this.toBasePayload(data);
    return this.apiService.post<Staff>('/staff/fraud-analysts', payload);
  }

  createCustomerServiceAgent(data: CreateStaffRequest): Observable<Staff> {
    const payload = this.toBasePayload(data);
    return this.apiService.post<Staff>('/staff/customer-service-agents', payload);
  }

  createStaff(data: CreateStaffRequest): Observable<Staff> {
    switch (data.staffType) {
      case 'ADMIN':
        return this.createAdmin(data);
      case 'BANK_OFFICER':
        return this.createBankOfficer(data);
      case 'FRAUD_ANALYST':
        return this.createFraudAnalyst(data);
      case 'CUSTOMER_SERVICE_AGENT':
        return this.createCustomerServiceAgent(data);
      default:
        throw new Error(`Unsupported staff type: ${data.staffType}`);
    }
  }

  private toBasePayload(data: CreateStaffRequest) {
    return {
      userId: data.userId,
      empName: data.empName,
      empPhone: data.empPhone,
      empDob: data.empDob,
      empAddress: data.empAddress,
      empDesignation: data.empDesignation,
      empJoiningDate: data.empJoiningDate,
      empStatus: data.empStatus
    };
  }
}
