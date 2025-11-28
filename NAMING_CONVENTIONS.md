# Naming Conventions

This document outlines all naming conventions used throughout the Basti backend service.

## 📋 Table of Contents

1. [Files & Folders](#files--folders)
2. [Constants](#constants)
3. [Variables](#variables)
4. [Functions](#functions)
5. [Classes & Services](#classes--services)
6. [Controllers](#controllers)
7. [Types](#types)
8. [Interfaces](#interfaces)
9. [Decorators](#decorators)
10. [Database](#database)
11. [DTO (Data Transfer Objects)](#dto-data-transfer-objects)
12. [Enums](#enums)

---

## Files & Folders

### Folder Structure

```
src/
├── modules/            # Feature modules
│   └── auth/
│       ├── controllers/
│       ├── services/
│       ├── dto/
│       ├── decorators/
│       └── index.ts
├── common/             # Shared across modules
│   ├── decorators/
│   ├── guards/
│   ├── strategies/
│   └── index.ts
├── constants/          # Global constants & examples
│   ├── global.constants.ts
│   ├── examples/
│   └── index.ts
├── types/              # Global type definitions
│   ├── response.types.ts
│   └── index.ts
├── utils/              # Utility functions
│   ├── response.handler.ts
│   └── index.ts
├── db/                 # Database
│   ├── schema/
│   ├── migrations/
│   ├── seeds/
│   └── index.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
├── env.ts
└── main.ts
```

### File Naming

- **Controllers**: `*.controller.ts` → `auth.controller.ts`
- **Services**: `*.service.ts` → `auth.service.ts`
- **DTOs**: `*.dto.ts` → `signup.dto.ts`, `login.dto.ts`
- **Interfaces**: `*interface.ts` → `auth-response.interface.ts`
- **Decorators**: `*-decorator.ts` → `auth-signup.decorator.ts`
- **Guards**: `*.guard.ts` → `jwt-auth.guard.ts`
- **Strategies**: `*.strategy.ts` → `access-token.strategy.ts`
- **Constants**: `*.constants.ts` → `global.constants.ts`
- **Types**: `*.types.ts` → `response.types.ts`
- **Examples**: `*-examples.ts` → `auth-examples.ts`

---

## Constants

### Global Constants

```typescript
// global.constants.ts
export const MOCK_DATA = {
  id: { user: '550e8400-e29b-41d4-a716-446655440000' },
  email: { user: 'ahmed@example.com' },
  phone: { user: '+201001234567' },
  name: { user: 'Ahmed Hassan' },
  dates: { default: '2025-11-27T10:00:00.000Z' },
} as const;

export const MOCK_IMAGES = {
  avatars: {
    male: 'https://api.example.com/images/avatars/male-default.jpg',
    female: 'https://api.example.com/images/avatars/female-default.jpg',
    default: 'https://api.example.com/images/avatars/default.jpg',
  },
} as const;
```

**Rules:**

- `UPPER_SNAKE_CASE` for constant names
- Group related constants in objects
- Use `as const` for type safety
- Category → Property → Value structure

### Module Examples

```typescript
// auth-examples.ts
export const AuthExamples = {
  signup: {
    request: {
      /* ... */
    },
    responses: {
      /* ... */
    },
  },
  login: {
    /* ... */
  },
} as const;
```

---

## Variables

### Local Variables

```typescript
// camelCase for all variables
const userId = '550e8400-e29b-41d4-a716-446655440000';
const userName = 'Ahmed Hassan';
let isAuthenticated = true;
let userCount = 5;
```

**Rules:**

- `camelCase` for all local variables
- Descriptive names (no `u`, `tmp`, `x`)
- Boolean variables start with `is`, `has`, `can`

### Private Properties

```typescript
class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtService: JwtService;
}
```

---

## Functions

### Regular Functions

```typescript
// camelCase, verb prefix
function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function validateEmail(email: string): boolean {
  return email.includes('@');
}

function getUserById(id: string): Promise<User | null> {
  return db.select().from(users).where(eq(users.id, id));
}
```

**Rules:**

- `camelCase` function names
- Start with verb: `get`, `fetch`, `create`, `validate`, `hash`, `check`
- Async functions can be named the same way
- Return type should be explicit

### Private Methods

```typescript
private async generateTokens(userId: string, email: string): Promise<TokenPair> {
  // implementation
}

private getLogLevel(level: string): NestLogLevel[] {
  // implementation
}
```

---

## Classes & Services

### Service Classes

```typescript
// PascalCase class names
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    // implementation
  }
}

export class UserService {
  async getUserById(id: string): Promise<User> {
    // implementation
  }
}
```

**Rules:**

- `PascalCase` for class names
- Service name = Feature + `Service` suffix
- Private constructor injection with `readonly`

---

## Controllers

### Controller Classes

```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponse> {
    return this.authService.signup(signupDto);
  }
}
```

**Rules:**

- `PascalCase` for class names
- Controller name = Feature + `Controller` suffix
- Route path = lowercase, kebab-case
- Method names = camelCase, match HTTP verbs

---

## Types

### Type Definitions

```typescript
// response.types.ts
export type SuccessResponse<T> = {
  code: number;
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

export type ErrorResponse = {
  code: number;
  success: false;
  message: string;
  error?: string;
  data?: object;
  timestamp: string;
};

export type NestLogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
```

**Rules:**

- `PascalCase` for type names
- Use `<T>` for generics
- Descriptive names: `Response`, `Payload`, `Result`
- Group related types in same file

---

## Interfaces

### Interface Definitions

```typescript
// auth-response.interface.ts
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}
```

**Rules:**

- `PascalCase` for interface names
- End with descriptive suffix: `Response`, `Payload`, `Request`
- Keep in dedicated `*-interface.ts` files
- Separate from DTOs

---

## Decorators

### Custom Decorators

```typescript
// auth-signup.decorator.ts
export function AuthSignupDecorator() {
  return applyDecorators();
  // decorator implementation
}

// public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);

// current-user.decorator.ts
export const CurrentUser = (data?: string) =>
  createParamDecorator((user, ctx) => {
    // implementation
  })(data);
```

**Rules:**

- `Auth*Decorator` pattern for endpoint decorators
- `PascalCase` for class-based decorators
- Descriptive names describing what they do

---

## Database

### Schema Tables

```typescript
// user.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
```

**Rules:**

- lowercase table names (plural): `users`, `posts`, `comments`
- **camelCase column names**: `id`, `email`, `createdAt`, `updatedAt`
- Use `camelCase` for column names (matches API response convention)
- Foreign keys: `userId`, `postId`
- Timestamps: `createdAt`, `updatedAt`
- Unique columns: `email`, `username`

### Seed Data

```typescript
// seed-data.ts
export async function getSeedUsers(): Promise<SeedUser[]> {
  return [
    {
      id: MOCK_DATA.id.user,
      name: MOCK_DATA.name.user,
      email: MOCK_DATA.email.user,
      password: await hashPassword('userPass1'),
      // ...
    },
  ];
}
```

---

## DTO (Data Transfer Objects)

### Request DTOs

```typescript
// signup.dto.ts
export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

// login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### Response DTOs

```typescript
// auth-response.dto.ts
export class UserDataDto {
  @ApiProperty({
    example: MOCK_DATA.id.user,
    description: 'User unique identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: MOCK_DATA.email.user,
  })
  email: string;

  @ApiProperty({
    example: MOCK_DATA.name.user,
  })
  name: string;

  @ApiProperty({
    example: '2025-11-27T10:00:00Z',
    description: 'User creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-11-27T10:00:00Z',
    description: 'User last update timestamp',
  })
  updatedAt: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty()
  user: UserDataDto;
}
```

**Rules:**

- `PascalCase` class names
- End with `Dto` suffix
- Use `@ApiProperty` for Swagger documentation
- Request DTOs: no suffix or `Request` suffix
- Response DTOs: `Response` suffix
- **API Response Fields: `camelCase`** (even if database uses `snake_case`)
- Use `createdAt`, `updatedAt`, `firstName`, `lastName` (NOT `created_at`, `updated_at`)

---

## Enums

### Enum Definitions

```typescript
// Not yet used, but convention:
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
}
```

**Rules:**

- `PascalCase` for enum names
- `UPPER_SNAKE_CASE` for enum values
- Use string enums for API responses
- Use numeric enums for HTTP status

---

## Environment Variables

```typescript
// .env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=password
DB_DATABASE=basti
DB_SSL=false

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM_NAME=Basti
MAIL_FROM=noreply@basti.com
```

**Rules:**

- `UPPER_SNAKE_CASE` for env variables
- Group related variables with comments
- Sensitive data goes in `.env` (never commit)
- Defaults in `env.ts` with Zod validation

---

## API Endpoints

### Route Naming

```typescript
// Auth routes
POST   /api/auth/signup        → Create new user
POST   /api/auth/login         → Authenticate user
POST   /api/auth/refresh       → Refresh tokens
POST   /api/auth/logout        → Logout user

// User routes (future)
GET    /api/users              → List users
GET    /api/users/:id          → Get user by ID
PUT    /api/users/:id          → Update user
DELETE /api/users/:id          → Delete user

// Post routes (future)
GET    /api/posts              → List posts
POST   /api/posts              → Create post
GET    /api/posts/:id          → Get post
PUT    /api/posts/:id          → Update post
DELETE /api/posts/:id          → Delete post
```

**Rules:**

- lowercase route paths
- kebab-case for multi-word routes: `/user-profiles`, `/post-comments`
- Use plural nouns: `/users`, `/posts` (not `/user`, `/post`)
- Use IDs in path: `/api/posts/:id`
- Use query params for filters: `/api/posts?limit=10&page=1`

---

## Summary Table

| Category            | Pattern              | Example                                 |
| ------------------- | -------------------- | --------------------------------------- |
| Files               | kebab-case           | `auth-response.dto.ts`                  |
| Folders             | lowercase            | `modules`, `common`, `constants`        |
| Constants           | UPPER_SNAKE_CASE     | `MOCK_DATA`, `JWT_SECRET`               |
| Variables           | camelCase            | `userId`, `isAuthenticated`             |
| Functions           | camelCase            | `getUserById()`, `validateEmail()`      |
| Classes             | PascalCase           | `AuthService`, `UserController`         |
| Interfaces          | PascalCase           | `AuthResponse`, `User`                  |
| Types               | PascalCase           | `SuccessResponse<T>`, `TokenPair`       |
| Enums               | PascalCase           | `UserRole`, `HttpStatus`                |
| Database Tables     | lowercase            | `users`, `posts`                        |
| Database Columns    | camelCase            | `userId`, `createdAt`, `updatedAt`      |
| API Response Fields | camelCase            | `id`, `email`, `createdAt`, `updatedAt` |
| Routes              | lowercase/kebab-case | `/api/auth/signup`, `/api/user-posts`   |

---

## Related Documentation

- [Project README](./README.md)
- [Database Seeding](./SEEDING.md)
- [API Endpoints](./API_ENDPOINTS_GUIDE.md)
