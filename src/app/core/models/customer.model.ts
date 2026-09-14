export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  employment: string;
  incomeRange: string;
  kycStatus: string;
  creditProfile: string | null;
  customerStatus: string;
  userId: string;
  branchCode?: string;
}

export interface CustomerRegistrationRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  employment: string;
  incomeRange: string;
  branchCode: string;
}

export interface KycDocument {
  kycDocumentId: string;
  customerId: string;
  documentType: string;
  documentNumber: string;
  documentUrl?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  verifiedByStaffId?: string;
  verifiedAt?: string;
  rejectionReason?: string | null;
}