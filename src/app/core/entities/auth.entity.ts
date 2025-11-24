export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
}

export interface AuthToken {
  token: string;
  refreshToken?: string;
}
