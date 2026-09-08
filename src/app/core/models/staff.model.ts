export type StaffType = 'ADMIN' | 'BANK_OFFICER' | 'FRAUD_ANALYST' | 'CUSTOMER_SERVICE_AGENT';

export interface Staff {
  staffId: string;
  userId: string;
  empName: string;
  empPhone: string;
  empDob: string; // ISO format: YYYY-MM-DD
  empAddress: string;
  empDesignation: string;
  empJoiningDate: string; // ISO format: YYYY-MM-DD
  empStatus: string;
  branchCode?: string; // Present for Bank Officer
  roleName?: string; // Resolved from User
}

export interface CreateStaffRequest {
  staffType: StaffType;
  userId: string;
  empName: string;
  empPhone: string;
  empDob: string;
  empAddress: string;
  empDesignation: string;
  empJoiningDate: string;
  empStatus: string;
  branchCode?: string;
}
