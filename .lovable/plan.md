

## Update Light Theme Map Style

Replace the generic `mapbox://styles/mapbox/light-v11` with your custom style `mapbox://styles/taai/cmlrf6i5q004p01qk9a5i062m` for all light-mode maps.

### Change

**File: `src/lib/mapStyles.ts`** (line 15)

Change the `LIGHT_STYLE` constant from:
```
const LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
```
to:
```
const LIGHT_STYLE = 'mapbox://styles/taai/cmlrf6i5q004p01qk9a5i062m';
```

This single-line change applies to all 5 map components since they all read from this shared constant. Dark mode stays untouched.

