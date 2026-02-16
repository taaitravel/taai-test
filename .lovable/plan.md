

## Replace Warm Olive with White (#ffffff) in Dark Mode

The HSL value `45 42% 14%` appears in 5 dark mode CSS variables. Changing them to `0 0% 100%` (#ffffff) and switching text to dark colors for readability.

### Changes (all in `src/index.css`, dark mode block)

**Background variables -- change from `45 42% 14%` to `0 0% 100%`:**

| Variable | Role |
|----------|------|
| `--secondary` | Secondary backgrounds (tab bars, badges) |
| `--muted` | Muted/subtle backgrounds |
| `--accent` | Accent backgrounds (hover states) |
| `--input` | Input field backgrounds |
| `--sidebar-accent` | Sidebar hover/active backgrounds |

**Border variables -- change from `45 42% 20%` to `0 0% 80%` (light gray border for definition on white):**
- `--border`
- `--sidebar-border`

**Foreground/text variables -- switch to dark text for contrast on white:**

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `--secondary-foreground` | `351 85% 75%` (rose) | `240 16% 11%` (dark navy) | Readable on white |
| `--accent-foreground` | `351 85% 75%` (rose) | `240 16% 11%` (dark navy) | Readable on white |
| `--muted-foreground` | `40 30% 50%` (warm gray) | `240 10% 40%` (cool gray) | Subtle but readable on white |
| `--sidebar-accent-foreground` | `351 85% 75%` (rose) | `240 16% 11%` (dark navy) | Readable on white |

### Result

All dark mode surfaces that were warm olive-brown become white, with dark navy text for readability. This affects tab bars, input fields, sidebar highlights, badges, and muted containers.

