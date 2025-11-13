export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  userId?: string;
  emailVerified?: boolean;
  message?: string;
}

export interface VerifyEmailRequest {
  uid: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  emailVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  userId?: string;
  emailVerified?: boolean;
  token?: string;
  message?: string;
}

