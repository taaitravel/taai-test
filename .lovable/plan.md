

# Separate Privacy Policy into Its Own Page

## Overview
Split the current `/terms` page into two distinct pages -- `/terms` for Terms of Service only, and `/privacy-policy` for the Privacy Policy -- to satisfy Google Cloud OAuth verification requirements.

## Changes

### 1. Create new file: `src/pages/PrivacyPolicy.tsx`
- Extract the Privacy Policy content (sections 1-10 under the Shield icon) from the current `Terms.tsx`
- Use the same card/layout styling as the Terms page
- Include the `PublicNavigation` component at the top (matching `/terms`, `/what-we-do`, `/contact` pattern)
- No acceptance checkboxes needed on this standalone page (those stay on `/terms` for the signup flow)
- Add a link at the bottom pointing to `/terms` for cross-reference

### 2. Update `src/pages/Terms.tsx`
- Remove the entire Privacy Policy section (everything from the Shield icon header through section 10)
- Remove the Separator between Terms and Privacy sections
- Add a link/reference to `/privacy-policy` near the bottom (e.g., "See our Privacy Policy")
- Keep the acceptance checkboxes and flow logic unchanged -- the privacy checkbox label will link to `/privacy-policy`

### 3. Update `src/App.tsx`
- Import the new `PrivacyPolicy` component
- Add route: `<Route path="/privacy-policy" element={<PrivacyPolicy />} />` (public, no ProtectedRoute)

### Technical Notes
- The acceptance flow on `/terms` remains unchanged -- both checkboxes still appear there during signup/login flows
- The privacy checkbox label text will become a clickable link: "I have read and agree to the [Privacy Policy](/privacy-policy)"
- Both pages are public (no auth required), consistent with `/what-we-do` and `/contact`
- The `PublicNavigation` component provides the back button and logo header

