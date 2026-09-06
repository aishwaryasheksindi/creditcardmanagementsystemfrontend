export interface LoginResponse {
  token: string;
  username: string;
  roleName: string;
  role?: string;
  expiresAt?: string | Date;
}
