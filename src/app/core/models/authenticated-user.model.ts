export interface AuthenticatedUser {
  username: string;
  roleName: string;
  token: string;
  expiresAt?: string | Date;
}
