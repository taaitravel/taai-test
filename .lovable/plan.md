

# Move Google Sign-In Button Below Forgot Password

## What Changes
Reorder the Login page so the layout is:
1. Email field
2. Password field
3. Forgot password link
4. "Continue with Google" button (with "or" separator above it)
5. Sign In button

## Technical Details

### `src/pages/Login.tsx`
- Remove the Google button (lines 101-113) and the "or" separator (lines 115-122) from their current position at the top of the form
- Insert them between the "Forgot password?" link (line 148-152) and the "Sign In" button (lines 154-160)
- The order inside `CardContent` becomes:
  1. Email input
  2. Password input
  3. Forgot password link
  4. "or" separator
  5. "Continue with Google" button
  6. Sign In button
  7. Bottom separator and links

No other files need changes -- `signInWithGoogle` is already wired up in AuthContext.

