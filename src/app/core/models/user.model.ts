export * from './user-profile.model';

export interface UserResponse {
  userId: string;
  username: string;
  email: string;
  roleId: string;
  roleName: string;
  accountStatus: string;
  createdAt?: string;
  lastLoginAt?: string;
  accountLockedUntil?: string;
}
