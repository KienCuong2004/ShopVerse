# ShopVerse - E-commerce Full Stack Application

A full stack e-commerce application built with Spring Boot (Backend) and Next.js (Frontend).

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Features](#features)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Project Structure

```
ShopVerse/
├── backend/          # Spring Boot Backend API
│   └── src/
│       └── main/
│           ├── java/
│           └── resources/
├── frontend/        # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── styles/
│   └── public/
└── database/        # Database scripts
```

## Tech Stack

### Backend

- **Framework**: Spring Boot 3.5.7
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Security**: Spring Security with JWT Authentication
- **Build Tool**: Maven

### Frontend

- **Framework**: Next.js 16.0.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL database
- Maven 3.6+

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Copy the example configuration file:

   ```bash
   cp src/main/resources/application.example.yml src/main/resources/application.yml
   ```

3. Configure `application.yml` with your database credentials and settings. See [CONFIGURATION.md](CONFIGURATION.md) for detailed configuration instructions.

4. Build and run the application:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

The backend will run at: `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables (if needed):
   Create a `.env.local` file with:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will run at: `http://localhost:3000`

### Database Setup

1. Create a PostgreSQL database:

   ```sql
   CREATE DATABASE ShopVerse;
   ```

2. Run the initialization script:
   ```bash
   psql -U postgres -d ShopVerse -f database/ShopVerse.sql
   ```

## Configuration

For detailed configuration instructions, please refer to [CONFIGURATION.md](CONFIGURATION.md).

### Quick Configuration

**Backend:**

- Configuration file: `backend/src/main/resources/application.yml`
- Copy from `application.example.yml` and update with your settings

**Frontend:**

- Next.js config: `frontend/next.config.ts`
- Tailwind config: `frontend/tailwind.config.js`
- TypeScript config: `frontend/tsconfig.json`

## Available Scripts

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Backend Scripts

- `mvn clean install` - Build the project
- `mvn spring-boot:run` - Run the application
- `mvn test` - Run tests
- `mvn dependency:check` - Check for vulnerable dependencies

## Features

### Implemented Features

- User authentication and authorization (JWT-based)
- RESTful API endpoints for:
  - User management
  - Product catalog
  - Categories
  - Shopping cart
  - Orders
  - Reviews
- Database schema with PostgreSQL
- Spring Security integration
- CORS configuration

### Planned Features

- Payment integration
- Admin dashboard
- Advanced search and filtering
- Email notifications
- Order tracking
- Product recommendations

## Testing

### Frontend Testing

```bash
cd frontend
npm test
```

### Backend Testing

```bash
cd backend
mvn test
```

## Documentation

Additional documentation:

- [CONFIGURATION.md](CONFIGURATION.md) - Configuration guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Code of conduct
- [SECURITY.md](SECURITY.md) - Security policy
- [PR_DESCRIPTION.md](PR_DESCRIPTION.md) - Pull request template

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Make your changes following our coding standards
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

For security concerns, please review our [Security Policy](SECURITY.md). If you discover a security vulnerability, please report it privately rather than creating a public issue.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Authors

ShopVerse Development Team

## Support

For questions or support, please open an issue in the repository.

## Acknowledgments

- Spring Boot community
- Next.js team
- All contributors to this project
