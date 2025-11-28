import { MOCK_DATA } from '../global.constants';

export const AuthExamples = {
  signup: {
    request: {
      email: MOCK_DATA.email.user,
      password: 'SecurePass123',
      name: MOCK_DATA.name.user,
    },
    response: {
      success: {
        code: 201,
        success: true,
        message: 'User registered successfully',
        data: {
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNTc1NjAwfQ.signature',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczMTU3MjAwMCwiZXhwIjoxNzMxNjU4NDAwfQ.signature',
          user: {
            id: MOCK_DATA.id.user,
            email: MOCK_DATA.email.user,
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      conflict: {
        code: 409,
        success: false,
        message: 'User with this email already exists',
        error: 'ConflictException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
          'password must match /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/ regular expression',
          'name must be longer than or equal to 2 characters',
        ],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
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
            name: MOCK_DATA.name.user,
            createdAt: '2025-11-28T10:00:00.000Z',
            updatedAt: '2025-11-28T10:00:00.000Z',
          },
        },
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid credentials',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
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
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Invalid token',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      validationError: {
        code: 400,
        success: false,
        message: ['refreshToken must be a string', 'refreshToken should not be empty'],
        error: 'BadRequestException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
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
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      unauthorized: {
        code: 401,
        success: false,
        message: 'Unauthorized',
        error: 'UnauthorizedException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      forbidden: {
        code: 403,
        success: false,
        message: 'Forbidden',
        error: 'ForbiddenException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
      internalServerError: {
        code: 500,
        success: false,
        message: 'Internal server error',
        error: 'InternalServerErrorException',
        timestamp: '2025-11-28T10:00:00.000Z',
      },
    },
  },
} as const;
