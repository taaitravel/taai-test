

## Fix Tab Styling in Dark Mode

### Issues
1. **Tab bar background looks grey** -- `bg-secondary/60` applies 60% opacity to white, making it appear grey against the dark background.
2. **Inactive tab text color** -- Currently a medium grey (`#a3a3a3`). Needs to be `#171822` (dark navy).
3. **Active tab text color** -- Currently dark navy via `text-background`. Needs to be white.

### Changes

**File: `src/pages/Subscription.tsx` (lines 124-127)**

1. TabsList: Change `bg-secondary/60` to `bg-secondary` (full white, no opacity)
2. TabsTrigger (both): Change `data-[state=active]:text-background` to `data-[state=active]:text-white`
3. TabsTrigger (both): Add `text-[#171822]` for inactive state text color

### Technical Detail

The inactive text override (`text-[#171822]`) ensures the non-selected tab label is dark navy on the white tab bar. The active override (`text-white`) ensures the selected label is white on the gold gradient. These are scoped only to this component's tabs so they won't affect other tab instances.

