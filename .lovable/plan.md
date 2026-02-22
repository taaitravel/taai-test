

# Add Google Sign-In to Login and Signup Pages

## Prerequisites (User Action Required)
The user must configure Google OAuth in their Google Cloud Console (project: nimble-theme-488220-d0) and paste the credentials into the Supabase dashboard before this will work. Steps outlined in chat above.

## Code Changes

### 1. Add `signInWithGoogle` to AuthContext (`src/contexts/AuthContext.tsx`)
- Add a new function `signInWithGoogle` that calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/home' } })`
- Export it via the context

### 2. Add Google button to Login page (`src/pages/Login.tsx`)
- Add a "Continue with Google" button above the email/password fields
- Use a Google icon (from lucide or inline SVG)
- Add a separator with "or" text between the Google button and the email form
- On click, call `signInWithGoogle()`

### 3. Add Google button to Signup page (`src/pages/Signup.tsx`)
- Add a "Sign up with Google" button at the top of the form (before the individual/corporate fields)
- Same separator pattern as Login
- On click, call `signInWithGoogle()`

### Technical Details
- The OAuth flow redirects to Google, then back to the Supabase callback URL, which redirects to the app
- The existing `handle_new_user_to_users` trigger will auto-create the user profile row when a Google user signs in for the first time
- The `onAuthStateChange` listener in AuthContext already handles session updates, so no additional session logic is needed
- The Google button will use an inline SVG for the Google "G" logo for brand accuracy

