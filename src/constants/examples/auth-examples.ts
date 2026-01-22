import { MOCK_DATA } from '../global.constants';

export const AuthExamples = {
  signup: {
    request: {
      email: MOCK_DATA.email.user,
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'User registered successfully. OTP sent to your email',
        data: {
          message: 'User registered successfully. OTP sent to your email',
          email: MOCK_DATA.email.user,
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      conflict: {
        code: 409,
        success: false,
        message: 'User with this email already exists',
        error: 'ConflictException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be a valid email address',
          'password must be at least 8 characters long',
          'password must contain at least one uppercase letter, one lowercase letter, and one number',
          'firstName must be at least 2 characters long',
          'lastName must be at least 2 characters long',
        ],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to create user',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  verifyOtp: {
    request: {
      email: MOCK_DATA.email.user,
      otp: '123456',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Email verified successfully',
        data: {
          message: 'Email verified successfully',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            firstName: 'John',
            lastName: 'Doe',
            isEmailVerified: true,
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid or expired OTP',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
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
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to verify email',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  setupProfile: {
    request: {
      phoneNumber: '+1234567890',
      profileImage: 'https://example.com/profile.jpg',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Profile setup completed successfully',
        data: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNTc1NjAwfQ.signature',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNjU4NDAwfQ.signature',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1234567890',
            profileImage: 'https://example.com/profile.jpg',
            isEmailVerified: true,
            createdAt: '2025-01-11T10:00:00.000Z',
            updatedAt: '2025-01-11T10:05:00.000Z',
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Email not verified. Please verify your email first',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['profileImage must be a valid URL'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Failed to complete profile setup',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  login: {
    request: {
      email: MOCK_DATA.email.user,
      password: 'SecurePass123',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNTc1NjAwfQ.signature',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNjU4NDAwfQ.signature',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1234567890',
            profileImage: 'https://example.com/profile.jpg',
            isEmailVerified: true,
            createdAt: '2025-01-11T10:00:00.000Z',
            updatedAt: '2025-01-11T10:05:00.000Z',
          },
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      emailNotVerified: {
        code: 403,
        success: false,
        message: 'Email not verified. Please verify your email before logging in',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      profileNotSetup: {
        code: 403,
        success: false,
        message: 'Profile setup incomplete. Please complete your profile setup',
        error: 'ForbiddenException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid credentials',
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
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  refreshToken: {
    request: {
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNjU4NDAwfQ.signature',
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjEwMCwiZXhwIjoxNzMxNTc1NzAwfQ.newsignature',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjEwMCwiZXhwIjoxNzMxNjU4NTAwfQ.newsignature',
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'UnauthorizedException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['refreshToken must be a string', 'refreshToken must not be empty'],
        error: 'BadRequestException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },

  resendOtp: {
    request: {
      email: MOCK_DATA.email.user,
    },
    response: {
      success: {
        code: 200,
        success: true,
        message: 'OTP resent successfully to your email',
        data: {
          message: 'OTP resent successfully to your email',
          email: MOCK_DATA.email.user,
        },
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      notFound: {
        code: 404,
        success: false,
        message: 'User not found',
        error: 'NotFoundException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      conflict: {
        code: 409,
        success: false,
        message: 'Email already verified',
        error: 'ConflictException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
      tooManyAttempts: {
        code: 429,
        success: false,
        message: 'Too many OTP resend attempts. Please try again later',
        error: 'TooManyRequestsException',
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
        message: 'Failed to resend OTP',
        error: 'InternalServerErrorException',
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
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-01-11T10:00:00.000Z',
      },
    },
  },
} as const;
