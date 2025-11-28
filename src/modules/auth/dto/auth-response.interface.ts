export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}
