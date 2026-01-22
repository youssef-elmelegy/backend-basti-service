export interface AdminAuthResponseInterface {
  success: boolean;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    admin?: {
      id: string;
      email: string;
      role: 'main_admin' | 'bakery_owner';
      profileImage?: string;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  error?: string;
  timestamp: string;
}
