# Configuration Guide

This document provides comprehensive information on how to configure and customize the ShopVerse application for your environment.

## Table of Contents

- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database Configuration](#database-configuration)
- [Security Configuration](#security-configuration)
- [Environment Variables](#environment-variables)

## Backend Configuration

### Application Properties

The backend uses Spring Boot configuration files located in `backend/src/main/resources/`.

#### Primary Configuration File

Copy `application.example.yml` to `application.yml` and customize it for your environment:

```bash
cp backend/src/main/resources/application.example.yml backend/src/main/resources/application.yml
```

**Note:** The `application.yml` file is excluded from version control as it contains sensitive information.

### Database Configuration

Configure your PostgreSQL database connection in `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ShopVerse
    username: your_database_username
    password: your_database_password
    driver-class-name: org.postgresql.Driver
```

### JPA/Hibernate Configuration

Default JPA settings:

```yaml
spring:
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
    show-sql: true
```

**Important:** In production, set `ddl-auto` to `validate` or `none` to prevent automatic schema changes.

### JWT Configuration

Configure JWT settings for authentication:

```yaml
jwt:
  secret: your-secret-key-change-this-in-production-min-256-bits-required-for-hs512-algorithm
  expiration: 86400000  # 24 hours in milliseconds
```

**Security Note:** 
- Generate a strong secret key (minimum 256 bits) for production use
- Use a secure random generator to create the secret key
- Never commit the actual secret key to version control

### Logging Configuration

Customize logging levels:

```yaml
logging:
  level:
    root: INFO
    org.springframework.web: INFO
    org.hibernate: INFO
    org.hibernate.SQL: DEBUG
```

### Server Configuration

Configure server port and error handling:

```yaml
server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always
    include-stacktrace: on_param
    include-exception: false
```

## Frontend Configuration

### Next.js Configuration

The Next.js configuration is located in `frontend/next.config.ts`. Default configuration includes:

- TypeScript support
- Absolute imports with `@/` prefix
- Image optimization settings

### Tailwind CSS Configuration

Tailwind CSS is configured in `frontend/tailwind.config.js`. Customize colors, fonts, and other design tokens as needed.

### TypeScript Configuration

TypeScript settings are in `frontend/tsconfig.json`. The configuration includes:

- Strict type checking
- Absolute path imports (`@/components`, `@/utils`, etc.)
- Next.js optimizations

### ESLint Configuration

ESLint rules are defined in `frontend/eslint.config.mjs`. The configuration follows Next.js recommended practices.

### Prettier Configuration

Code formatting is configured in `frontend/.prettierrc`. Adjust formatting rules to match your team's preferences.

## Database Configuration

### Initial Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE ShopVerse;
```

2. Run the initialization script:

```bash
psql -U postgres -d ShopVerse -f database/ShopVerse.sql
```

### Database Connection Pool

The default HikariCP connection pool settings can be customized in `application.yml`:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
```

## Security Configuration

### CORS Configuration

CORS is configured in `backend/src/main/java/com/ecommerce/backend/config/CorsConfig.java`. By default, it allows requests from `http://localhost:3000`.

To modify allowed origins:

```java
configuration.setAllowedOrigins(List.of("http://your-frontend-domain.com"));
```

### Spring Security

Security configuration is located in `backend/src/main/java/com/ecommerce/backend/config/SecurityConfig.java`.

Endpoint authorization rules:

- Public endpoints: `/api/auth/**`, `/api/categories/**`, `/api/products/**`, `/api/reviews/**`
- Authenticated endpoints: `/api/cart/**`, `/api/orders/**`, `/api/users/**`
- Admin endpoints: `/api/admin/**` (requires ADMIN role)

## Environment Variables

### Backend Environment Variables

While Spring Boot primarily uses `application.yml`, you can override settings using environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ShopVerse
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_password
export JWT_SECRET=your-jwt-secret-key
export JWT_EXPIRATION=86400000
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=ShopVerse
```

Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Production Configuration

### Recommended Production Settings

1. **Database:**
   - Set `ddl-auto` to `validate` or `none`
   - Use connection pooling with appropriate limits
   - Enable SSL/TLS for database connections

2. **Security:**
   - Use strong JWT secret key
   - Enable HTTPS only
   - Configure proper CORS origins
   - Set secure cookie flags if using cookies

3. **Logging:**
   - Set production-appropriate log levels
   - Configure log rotation
   - Avoid logging sensitive information

4. **Error Handling:**
   - Disable stack trace exposure in production
   - Provide user-friendly error messages
   - Log errors for monitoring

## Troubleshooting

### Common Configuration Issues

1. **Database Connection Failed:**
   - Verify PostgreSQL is running
   - Check database name, username, and password
   - Ensure database exists

2. **JWT Token Validation Failed:**
   - Verify JWT secret matches between token generation and validation
   - Check token expiration settings

3. **CORS Errors:**
   - Ensure frontend URL is added to allowed origins
   - Verify CORS configuration includes required headers

For additional help, please refer to the [Contributing Guide](CONTRIBUTING.md) or open an issue in the repository.

