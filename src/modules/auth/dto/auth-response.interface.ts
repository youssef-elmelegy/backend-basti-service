export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    profileImage?: string | null;
    isEmailVerified: boolean;
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

export interface SignupResponse {
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  message: string;
  tempToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
  };
}

/**
 * Returned by login when the account is valid and email-verified but the
 * profile is still incomplete. Carries a short-lived setup token instead of
 * the normal access/refresh pair.
 */
export interface ProfileSetupRequiredResponse {
  message: string;
  profileSetupRequired: true;
  tempToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
  };
}

export interface SetupProfileResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profileImage?: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ChangePasswordResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email: string;
}

export interface ResetPasswordResponse {
  message: string;
}
