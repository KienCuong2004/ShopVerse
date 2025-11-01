# ShopVerse - E-commerce Full Stack Application

A full stack e-commerce application built with Spring Boot (Backend) and Next.js (Frontend).

## 🏗️ Project Structure

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

## 🛠️ Tech Stack

### Backend

- **Framework**: Spring Boot 3.5.7
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Security**: Spring Security
- **Build Tool**: Maven

### Frontend

- **Framework**: Next.js 16.0.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.17
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL database
- Maven 3.6+

### Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will run at: `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at: `http://localhost:3000`

## 📝 Available Scripts

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

## 🔧 Configuration

### Backend

- Configuration file: `backend/src/main/resources/application.yml`
- Update database connection settings in `application.yml`

### Frontend

- Next.js config: `frontend/next.config.ts`
- Tailwind config: `frontend/tailwind.config.js`
- TypeScript config: `frontend/tsconfig.json`
- ESLint config: `frontend/eslint.config.mjs`
- Prettier config: `frontend/.prettierrc`

## 📂 Frontend Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/pages/` - Additional pages (if needed)
- `src/layouts/` - Layout components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions and helpers
- `src/types/` - TypeScript type definitions
- `src/styles/` - Global styles and CSS files

## 🔐 Environment Variables

Create `.env.local` file in the `frontend/` directory and `.env` file in the `backend/` directory with the necessary environment variables.

Example frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Example backend `.env`:

```
DATABASE_URL=jdbc:postgresql://localhost:5432/shopverse
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

## 🗄️ Database

Database scripts are located in the `database/` directory. Run the SQL scripts to set up your database schema.

## 📦 Features

### Planned Features

- User authentication and authorization
- Product catalog management
- Shopping cart functionality
- Order processing
- Payment integration
- Admin dashboard
- Customer reviews and ratings

## 🧪 Testing

### Frontend

```bash
cd frontend
npm run test
```

### Backend

```bash
cd backend
mvn test
```

## 📄 License

MIT

## 👨‍💻 Authors

ShopVerse Development Team

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue in the repository.
