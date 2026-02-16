

## Replace Warm Brown Tones with Cool Dark Navy (#171820)

The warm brownish backgrounds (`#2d2a1f` and the `--card` HSL value) will be replaced with `#171820`, a cool dark navy that matches the `--background` color in dark mode.

### Changes

**1. CSS Variables (src/index.css)**

Update the dark mode `--card` variable from warm brown to match the background navy:
- `--card: 23 24% 11%` changes to `--card: 240 14% 11%` (which is `#171820`)
- Replace `#2d2a1f` in `.dark .luxury-gradient` with `#171820`

**2. Hardcoded References (3 files)**

| File | Current | Replacement |
|------|---------|-------------|
| `src/pages/WhatWeDo.tsx` | `to-[#2d2a1f]` | `to-[#171820]` |
| `src/pages/ProfileSetup.tsx` | `bg-[#2d2a1f]/30` | `bg-[#171820]/30` |
| `src/components/WorldMap.tsx` | `bg-[#2d2a1f]` (3 instances) | `bg-[#171820]` |

### Result

All dark mode surfaces shift from warm brown to cool dark navy, giving a consistent, on-brand dark aesthetic across cards, gradients, and map containers.

