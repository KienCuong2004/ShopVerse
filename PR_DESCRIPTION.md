# Pull Request Description Template

Use this template to create clear and comprehensive pull request descriptions.

## Description

Provide a clear description of what this PR does. Explain the problem it solves or the feature it adds.

**Example:**
This PR implements user profile editing functionality, allowing users to update their personal information, including name, email, and address details.

## Type of Change

Mark the relevant option:

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Test addition or update

## Related Issues

List any related issues:

- Closes #123
- Fixes #456
- Related to #789

## Changes Made

### Backend Changes

List backend changes:

- Added `UserController.updateProfile()` endpoint
- Modified `UserService` to support profile updates
- Added validation for email format

### Frontend Changes

List frontend changes:

- Created `ProfileEditPage` component
- Added form validation for user inputs
- Integrated with backend API endpoint

### Database Changes

List database changes (if any):

- No database changes
- Added new column `phone_number` to `users` table
- Created migration script `V2__add_phone_number.sql`

## Testing

Describe how you tested your changes:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

### Test Scenarios

List the scenarios you tested:

1. User can successfully update profile information
2. Validation errors are displayed for invalid inputs
3. API returns appropriate error messages

## Screenshots (if applicable)

If your changes include UI modifications, add screenshots:

```
[Add screenshots here]
```

## Checklist

Before submitting, ensure:

- [ ] Code follows the project's coding standards
- [ ] Self-review of code has been performed
- [ ] Comments added for complex code sections
- [ ] Documentation updated (README, CONFIGURATION.md, etc.)
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] All dependent changes have been merged
- [ ] PR description is complete and accurate

## Additional Notes

Any additional information that reviewers should know:

- This change requires updating the JWT token structure
- Frontend needs to be updated to handle new API response format
- Database migration must be run before deploying

## Reviewer Notes

Guidance for reviewers:

- Please pay special attention to the validation logic
- Test the edge cases mentioned in the issue
- Verify the error handling works correctly

---

**Pull Request Checklist:**

Before requesting review, verify:

1. All CI checks pass
2. Code coverage meets project standards
3. All review comments from previous iterations are addressed
4. Branch is up to date with master
5. No merge conflicts exist
