

# Holistic Profile Page Redesign

## Overview
Transform the current profile experience from a simple dropdown + setup wizard into a full profile hub with dedicated sections for editing, preferences, subscription, and help. The profile icon dropdown becomes the entry point, and a new dedicated profile page houses all settings.

## What Changes

### 1. Revamped Profile Dropdown Menu
Replace the current `UserProfileDropdown` items with:
- **Edit Profile** -- navigates to new profile page (edit tab)
- **Profile Setup** -- navigates to the existing traveler quiz (ProfileSetup page, kept as-is but with light mode support)
- **Preferences** -- navigates to new profile page (preferences tab)
- **Subscription & Payment** -- navigates to `/subscription`
- **Help** -- navigates to `/contact`
- **Sign Out** -- signs out

Remove the inline ThemeToggle from the dropdown (it moves to Preferences).

### 2. Ensure Dropdown Appears on Every Authenticated Page
Audit all authenticated pages to confirm `MobileNavigation` (which renders `UserProfileDropdown` on desktop) is present. On mobile, the bottom nav already has a Profile link -- it will point to the new profile page.

### 3. New Profile Page (`/profile`)
A new page with a sidebar/tab layout containing these sections:

**Edit Profile tab:**
- Profile image upload (avatar) -- stored in a new Supabase Storage bucket `avatars`, max 2MB, cropped to square, displayed as circle
- First name / Last name (editable inputs)
- Email (shown, with re-verification flow for changes)
- Phone number (editable)
- Bio / About you (200 character limit textarea)

**Preferences tab:**
- Appearance: Dark/Light mode toggle (reuses existing ThemeToggle)
- Date format: MM/DD/YY or DD/MM/YY (reuses existing logic)
- Currency: dropdown with USD, EUR, GBP, CAD, AUD, JPY (common booking currencies supported by Amadeus/Expedia)

**Profile Setup tab:**
- Links/embeds the existing traveler quiz flow

**Subscription & Payment tab:**
- Redirects to `/subscription` (existing page)

### 4. Light Mode Support for Profile Setup
The existing `ProfileSetup.tsx` uses hardcoded dark colors (`text-white`, `bg-[#171821]`, etc.). These will be converted to semantic theme variables (`text-foreground`, `bg-background`, `bg-card`, `border-border`) so the quiz works in both themes.

### 5. Database Changes
Add three new columns to the `users` table:
- `avatar_url` (text, nullable) -- URL to the avatar in Supabase Storage
- `bio` (text, nullable) -- 200 char about section
- `currency` (text, nullable, default `'USD'`) -- preferred currency

Create a Supabase Storage bucket `avatars` (public) with RLS policies allowing users to upload/manage their own files.

### 6. Avatar Upload Logic
- Accept JPG/PNG/WEBP, max 2MB
- Client-side crop to square (using a simple aspect-ratio constraint or basic canvas crop)
- Upload to `avatars/{user_id}/avatar.{ext}`
- Save the public URL to `users.avatar_url`
- Display in the profile dropdown trigger (replace the plain User icon with Avatar component when image exists)

---

## Technical Details

### New Files
- `src/pages/Profile.tsx` -- main profile page with tab navigation
- `src/components/profile/EditProfileSection.tsx` -- edit profile form with avatar upload
- `src/components/profile/PreferencesSection.tsx` -- appearance, date format, currency
- `src/components/profile/ProfileSetupSection.tsx` -- embedded traveler quiz or link to it
- `src/components/profile/AvatarUpload.tsx` -- image upload with crop and preview

### Modified Files
- `src/components/shared/UserProfileDropdown.tsx` -- new menu items, show avatar, remove inline theme toggle
- `src/components/navigation/MobileBottomNav.tsx` -- Profile link points to `/profile`
- `src/App.tsx` -- add `/profile` route
- `src/pages/ProfileSetup.tsx` -- convert hardcoded dark colors to semantic theme variables for light mode support
- `src/contexts/AuthContext.tsx` -- add `avatar_url`, `bio`, `currency` to `UserProfile` interface

### Database Migration
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### Implementation Sequence
1. Run database migration (new columns + storage bucket)
2. Create the new profile page and sub-components
3. Update `UserProfileDropdown` with new menu structure and avatar display
4. Update routing in `App.tsx` and `MobileBottomNav.tsx`
5. Fix `ProfileSetup.tsx` hardcoded colors for light mode
6. Test end-to-end: avatar upload, profile editing, preferences saving, navigation from every authenticated page

