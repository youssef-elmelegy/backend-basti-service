export const AdminAuthExamples = {
  login: {
    request: {
      email: 'admin@example.com',
      password: 'SecurePass123',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Admin logged in successfully',
        data: {
          admin: {
            id: '990e8400-e29b-41d4-a716-446655440004',
            name: 'Admin',
            phoneNumber: '+1234567890',
            email: 'admin@example.com',
            role: 'main_admin',
            profileImage: null,
            createdAt: '2025-01-11T10:00:00.000Z',
            updatedAt: '2025-01-11T10:00:00.000Z',
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid credentials',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      blocked: {
        code: 401,
        success: false,
        message: 'Admin account is blocked',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'password must be at least 8 characters long',
        ],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  forgotPassword: {
    request: {
      email: 'admin@example.com',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'OTP sent to your email',
        data: {
          email: 'admin@example.com',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Admin with this email not found',
        error: 'NotFoundException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['email must be a valid email address'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to send OTP email',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  verifyOtp: {
    request: {
      email: 'admin@example.com',
      otp: '123456',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'OTP verified successfully',
        data: {
          email: 'admin@example.com',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      invalidOtp: {
        code: 401,
        success: false,
        message: 'Invalid OTP code',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      expiredOtp: {
        code: 400,
        success: false,
        message: 'OTP has expired. Please request a new one',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Admin with this email not found',
        error: 'NotFoundException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['email must be a valid email address', 'otp must be exactly 6 characters'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  resetPassword: {
    // The reset token travels in the httpOnly `resetToken` cookie, not the body.
    request: {
      newPassword: 'NewSecurePass123',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Password reset successfully',
        data: {
          message: 'Password reset successfully',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      weakPassword: {
        code: 400,
        success: false,
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['newPassword must be at least 8 characters long'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  changePassword: {
    request: {
      currentPassword: 'SecurePass123',
      newPassword: 'NewSecurePass456',
      confirmPassword: 'NewSecurePass456',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Password changed successfully',
        data: {
          message: 'Password changed successfully',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      invalidCurrentPassword: {
        code: 401,
        success: false,
        message: 'Current password is incorrect',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      passwordMismatch: {
        code: 400,
        success: false,
        message: 'Passwords do not match',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      samePassword: {
        code: 400,
        success: false,
        message: 'New password must be different from current password',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      weakPassword: {
        code: 400,
        success: false,
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  logout: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Logout successful',
        data: {
          message: 'Logout successful',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  checkAuth: {
    response: {
      authenticated: {
        code: 200,
        success: true,
        message: 'Authentication check completed',
        data: {
          isAuthenticated: true,
          admin: {
            id: '990e8400-e29b-41d4-a716-446655440004',
            name: 'Admin',
            phoneNumber: '+1234567890',
            email: 'admin@example.com',
            role: 'super_admin',
            profileImage: 'https://example.com/superadmin.jpg',
            createdAt: '2025-01-11T10:00:00.000Z',
            updatedAt: '2025-01-11T10:00:00.000Z',
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notAuthenticated: {
        code: 200,
        success: true,
        message: 'Authentication check completed',
        data: {
          isAuthenticated: false,
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid or expired token',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  refreshToken: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          admin: {
            id: '990e8400-e29b-41d4-a716-446655440004',
            name: 'Admin',
            email: 'admin@example.com',
            phoneNumber: '+1234567890',
            role: 'super_admin',
            profileImage: 'https://example.com/superadmin.jpg',
            createdAt: '2025-01-11T10:00:00.000Z',
            updatedAt: '2025-01-11T10:00:00.000Z',
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid or expired token',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  create: {
    request: {
      email: 'newadmin@basti.com',
      password: 'NewAdminPass1',
      phoneNumber: '+1234567890',
      name: 'New Admin',
      role: 'admin',
      bakeryId: '550e8400-e29b-41d4-a716-446655440000',
      profileImage: 'https://example.com/images/admin.jpg',
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'Admin created successfully',
        data: {
          id: '990e8400-e29b-41d4-a716-446655440005',
          name: 'New Admin',
          phoneNumber: '+1234567890',
          email: 'newadmin@basti.com',
          role: 'admin',
          profileImage: 'https://example.com/images/admin.jpg',
          bakeryId: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: '2025-01-11T10:00:00.000Z',
          updatedAt: '2025-01-11T10:00:00.000Z',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      emailExists: {
        code: 400,
        success: false,
        message: 'Admin with this email already exists',
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'password must be at least 8 characters long',
        ],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden - insufficient permissions (super_admin only)',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  block: {
    request: {
      isBlocked: true,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Admin blocked successfully',
        data: {
          id: '990e8400-e29b-41d4-a716-446655440005',
          name: 'Admin',
          phoneNumber: '+1234567890',
          email: 'admin@example.com',
          role: 'admin',
          profileImage: null,
          bakeryId: null,
          isBlocked: true,
          createdAt: '2025-01-11T10:00:00.000Z',
          updatedAt: '2025-01-11T10:00:00.000Z',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Admin not found',
        error: 'NotFoundException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['isBlocked must be a boolean value'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden - insufficient permissions (super_admin only)',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  update: {
    request: {
      name: 'Admin Updated',
      phoneNumber: '+1234567890',
      role: 'manager',
      bakeryId: '550e8400-e29b-41d4-a716-446655440000',
      profileImage: 'https://example.com/images/admin-updated.jpg',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Admin updated successfully',
        data: {
          id: '990e8400-e29b-41d4-a716-446655440005',
          name: 'Admin',
          email: 'admin@example.com',
          phoneNumber: '+1234567890',
          role: 'manager',
          profileImage: 'https://example.com/images/admin-updated.jpg',
          bakeryId: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: '2025-01-11T10:00:00.000Z',
          updatedAt: '2025-01-11T10:00:00.000Z',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'Admin not found',
        error: 'NotFoundException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['role must be one of: super_admin, admin, manager'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden - insufficient permissions (super_admin only)',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  getAll: {
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Admins retrieved successfully',
        data: {
          admins: [
            {
              id: '990e8400-e29b-41d4-a716-446655440001',
              name: 'Super Admin',
              phoneNumber: '+1234567890',
              email: 'superadmin@basti.com',
              role: 'super_admin',
              profileImage: 'https://example.com/images/superadmin.jpg',
              bakeryId: undefined,
              isBlocked: false,
              createdAt: '2025-01-10T10:00:00.000Z',
              updatedAt: '2025-01-10T10:00:00.000Z',
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440002',
              name: 'Admin',
              phoneNumber: '+1234567890',
              email: 'admin@basti.com',
              role: 'admin',
              profileImage: 'https://example.com/images/admin.jpg',
              bakeryId: '550e8400-e29b-41d4-a716-446655440000',
              isBlocked: false,
              createdAt: '2025-01-11T10:00:00.000Z',
              updatedAt: '2025-01-11T10:00:00.000Z',
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440003',
              name: 'Manager',
              phoneNumber: null,
              email: 'manager@basti.com',
              role: 'manager',
              profileImage: null,
              bakeryId: '550e8400-e29b-41d4-a716-446655440001',
              isBlocked: false,
              createdAt: '2025-01-12T10:00:00.000Z',
              updatedAt: '2025-01-12T10:00:00.000Z',
            },
          ],
          total: 3,
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden - insufficient permissions (super_admin only)',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },
} as const;
