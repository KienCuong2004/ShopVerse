# Contributing to ShopVerse

Thank you for your interest in contributing to ShopVerse. This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/ShopVerse.git
   cd ShopVerse
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/KienCuong2004/ShopVerse.git
   ```
4. Create a branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix-name
   ```

## Development Workflow

### Setting Up Development Environment

1. **Backend Setup:**
   ```bash
   cd backend
   mvn clean install
   ```
   
   Copy `application.example.yml` to `application.yml` and configure it according to [CONFIGURATION.md](CONFIGURATION.md).

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

3. **Database Setup:**
   - Create a PostgreSQL database
   - Run the SQL scripts from the `database/` directory

### Making Changes

1. Create a new branch from `master`:
   ```bash
   git checkout master
   git pull upstream master
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards below

3. Test your changes thoroughly

4. Commit your changes following the commit guidelines

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub

## Coding Standards

### Backend (Java/Spring Boot)

- Follow Java naming conventions
- Use meaningful variable and method names
- Write JavaDoc comments for public methods and classes
- Follow Spring Boot best practices
- Use dependency injection properly
- Handle exceptions appropriately
- Write unit tests for new functionality

Example:
```java
/**
 * Service for managing user operations.
 */
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    
    /**
     * Retrieves a user by username.
     *
     * @param username the username to search for
     * @return UserDTO containing user information
     * @throws ResourceNotFoundException if user is not found
     */
    public UserDTO findByUsername(String username) {
        // Implementation
    }
}
```

### Frontend (TypeScript/Next.js)

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use functional components
- Define proper TypeScript types and interfaces
- Follow the existing folder structure
- Use absolute imports (`@/components`, `@/utils`, etc.)
- Write descriptive component and function names

Example:
```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Implementation
};
```

### General

- Write self-documenting code
- Keep functions and classes focused and single-purpose
- Avoid deep nesting (max 3-4 levels)
- Comment complex logic, not obvious code
- Remove commented-out code before committing

## Commit Guidelines

We follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(auth): implement JWT token refresh mechanism

Add token refresh endpoint that validates refresh tokens and
issues new access tokens. Includes validation logic and
security measures.

Closes #123
```

```
fix(cart): resolve cart item quantity update issue

Fixed bug where cart item quantity was not properly updated
when user modified quantity in the UI.

Fixes #456
```

## Pull Request Process

1. **Before Submitting:**
   - Ensure your code follows the coding standards
   - Write or update tests for your changes
   - Update documentation as needed
   - Ensure all tests pass locally
   - Rebase on the latest `master` branch

2. **Pull Request Title:**
   - Use a clear, descriptive title
   - Follow the commit message format: `type(scope): description`

3. **Pull Request Description:**
   - Describe what changes were made and why
   - Reference any related issues
   - Include screenshots if UI changes were made
   - List any breaking changes
   - Use the [PR Description Template](PR_DESCRIPTION.md) as a guide

4. **Review Process:**
   - Address any feedback from reviewers
   - Make requested changes in new commits (don't force-push during review)
   - Respond to all comments

5. **After Approval:**
   - Squash commits if requested
   - Wait for maintainer to merge

## Testing

### Backend Testing

Write unit tests using JUnit 5:

```bash
cd backend
mvn test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Integration Testing

Before submitting a PR, ensure:
- All existing tests pass
- New functionality is covered by tests
- Edge cases are considered

## Documentation

- Update README.md if you add new features or change setup process
- Update CONFIGURATION.md if you add new configuration options
- Add inline code comments for complex logic
- Update API documentation if you modify endpoints

## Questions?

If you have questions about contributing:

- Check existing issues and pull requests
- Open a new issue with the `question` label
- Review the documentation files

## Recognition

Contributors will be recognized in the project's README and release notes. Thank you for helping improve ShopVerse!

