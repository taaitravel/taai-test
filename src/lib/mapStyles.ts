/**
 * Theme-aware Mapbox style configuration.
 * Dark styles are preserved exactly as-is; light styles use mapbox/light-v11.
 */

export type MapVariant = 'itinerary' | 'countries' | 'search' | 'world' | 'itinerary-overview';

const DARK_STYLES: Record<MapVariant, string> = {
  itinerary: 'mapbox://styles/taai/cme4vu58w01r701s29jan9lw9',
  countries: 'mapbox://styles/taai/cme4vu58w01r701s29jan9lw9',
  search: 'mapbox://styles/mapbox/dark-v11',
  world: 'mapbox://styles/mapbox/dark-v11',
  'itinerary-overview': 'mapbox://styles/mapbox/dark-v11',
};

const LIGHT_STYLE = 'mapbox://styles/taai/cmlrf6i5q004p01qk9a5i062m';

export function getMapStyle(theme: string | undefined, variant: MapVariant = 'search'): string {
  if (theme === 'light') return LIGHT_STYLE;
  return DARK_STYLES[variant];
}

export interface FogConfig {
  color: string;
  'high-color': string;
  'horizon-blend': number;
}

export function getMapFog(theme: string | undefined): FogConfig | null {
  if (theme === 'light') {
    return {
      color: 'rgb(230, 228, 225)',
      'high-color': 'rgb(200, 200, 210)',
      'horizon-blend': 0.05,
    };
  }
  return {
    color: 'rgb(23, 24, 33)',
    'high-color': 'rgb(50, 50, 60)',
    'horizon-blend': 0.1,
  };
}

/** Returns popup inline-style colors based on theme */
export function getPopupColors(theme: string | undefined) {
  if (theme === 'light') {
    return {
      bg: '#ffffff',
      text: '#1a1a2e',
      mutedText: 'rgba(26,26,46,0.6)',
      border: 'rgba(0,0,0,0.08)',
      buttonBg: '#1a1a2e',
      buttonText: '#ffffff',
      statusTextDark: '#1a1a2e',
    };
  }
  return {
    bg: '#1a1c2e',
    text: '#ffffff',
    mutedText: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.1)',
    buttonBg: '#ffffff',
    buttonText: '#1a1c2e',
    statusTextDark: '#1a1c2e',
  };
}

/** Marker border color adapts to theme for better contrast */
export function getMarkerBorderColor(theme: string | undefined): string {
  return theme === 'light' ? '#d1d5db' : '#ffffff';
}

/** Default marker dot color — pink for light, gold for dark */
export function getMarkerDotColor(theme: string | undefined): string {
  return theme === 'light' ? '#ff849c' : '#ffce87';
}

/** Marker glow shadow color */
export function getMarkerGlow(theme: string | undefined): string {
  return theme === 'light' ? 'rgba(255,132,156,0.6)' : 'rgba(255,206,135,0.6)';
}
