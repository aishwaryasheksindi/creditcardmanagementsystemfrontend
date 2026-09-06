export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  roleName: string;
  actualName: string | null;
  phoneNumber: string | null;
  accountType: 'STAFF' | 'CUSTOMER' | null;
}

export interface UpdateProfileRequest {
  email?: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}