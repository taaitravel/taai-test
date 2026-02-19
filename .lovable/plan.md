

## Plan: Fix Edit Itinerary Light Theme + Fix Invitation System

### Part 1: Light Theme for Edit Itinerary Page

The EditItinerary page has hardcoded dark-mode colors throughout (e.g., `bg-[#171821]`, `text-white`, `border-white/30`). These need to be replaced with semantic CSS variables per the project's theming standard.

**Changes to `src/pages/EditItinerary.tsx`:**
- Replace all `bg-[#171821]` with `bg-background`
- Replace all `text-white` with `text-foreground`
- Replace all `text-white/80`, `text-white/70`, `text-white/50` with `text-foreground/80`, `text-foreground/70`, `text-foreground/50`
- Replace `border-white/30` and `border-white/40` with `border-border`
- Replace `bg-white/10`, `bg-white/20` input backgrounds with `bg-input` or `bg-secondary`
- Replace card classes `bg-[#171821]/80 border-white/30` with `bg-card/80 border-border`
- Replace `hover:shadow-white/20` with `hover:shadow-primary/10`
- Replace button hardcoded colors (`text-[#171821]`) with `text-primary-foreground` or appropriate semantic tokens
- Ensure the loading state also uses `bg-background` and `text-foreground`

### Part 2: Fix Invitation System (Emails/Notifications Not Working)

**Root Cause:** The `send-invitation` edge function uses the caller's anon-key authenticated client to query the `users` table for the recipient. However, the RLS policy on `users` restricts SELECT to `auth.uid() = userid` -- meaning you can only see your own row. As a result, recipient lookups always return `null`, and no notification is ever created. The invitations themselves are saved to `itinerary_invitations`, but the invited user is never notified.

**Fix in `supabase/functions/send-invitation/index.ts`:**
- Move the recipient lookup (finding user by email or username) to use the `supabaseAdmin` (service role) client, which bypasses RLS
- The admin client is already created later in the function for notification insertion -- move its creation earlier and reuse it for both recipient lookup and notification creation
- This ensures the function can actually find users by email/username and create the in-app notification

**Before (broken):**
```
// Uses anon client - RLS blocks cross-user lookups
const { data: recipient } = await supabaseClient
  .from('users')
  .select('userid')
  .eq('email', value)
  .single();
```

**After (fixed):**
```
// Uses admin client - bypasses RLS for recipient lookup
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

const { data: recipient } = await supabaseAdmin
  .from('users')
  .select('userid')
  .eq('email', value)
  .single();
```

### Summary of Files Changed

| File | Change |
|------|--------|
| `src/pages/EditItinerary.tsx` | Replace all hardcoded dark colors with semantic CSS variables for full light/dark theme support |
| `supabase/functions/send-invitation/index.ts` | Use service-role admin client for recipient user lookup to bypass RLS restrictions |

