

# Fix Homepage Privacy Policy Link for Google Verification

## Problem
Google's verification bot crawls `https://taai-test.lovable.app/` and cannot find a link to the privacy policy because:
1. The "Privacy Policy" footer link incorrectly navigates to `/terms` instead of `/privacy-policy`
2. Both footer links use JavaScript `onClick` handlers instead of real `<a href>` tags, which bots cannot follow

## Changes

### `src/pages/Index.tsx` (footer section, ~lines 354-369)
- Change the "Privacy Policy" button from `navigate('/terms')` to a proper `<a href="/privacy-policy">` tag
- Change the "Terms of Service" button from `navigate('/terms')` to a proper `<a href="/terms">` tag
- This ensures Google's crawler can discover and follow both links

### After Publishing
Once the fix is deployed to `https://taai-test.lovable.app/`:
1. Go back to Google Cloud Console > OAuth consent screen
2. Select "I have fixed the issues"
3. Click "Proceed" to re-submit for verification

## Technical Details
Replace the two `<Button variant="link">` elements in the footer with standard `<a>` anchor tags styled the same way. This makes them crawlable by bots while maintaining the same visual appearance.

