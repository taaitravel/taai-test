export interface MapCamera {
  center: [number, number];
  zoom: number;
}

/**
 * Opening camera for an empty map.
 * A timezone region is used when the browser has one. UTC and unknown zones
 * get a wide world view so the map does not open zoomed on Africa.
 */
export function defaultMapCamera(timeZone?: string): MapCamera {
  const zone = timeZone ?? (typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : '');

  if (!zone || zone === 'UTC' || zone.startsWith('Etc/')) {
    return { center: [12, 18], zoom: 0.85 };
  }
  if (zone.startsWith('America/')) return { center: [-96, 38], zoom: 2.1 };
  if (zone.startsWith('Europe/')) return { center: [12, 50], zoom: 2.5 };
  if (zone.startsWith('Africa/')) return { center: [18, 4], zoom: 2.2 };
  if (zone.startsWith('Asia/')) return { center: [90, 28], zoom: 2.1 };
  if (zone.startsWith('Australia/') || zone.startsWith('Pacific/')) {
    return { center: [148, -22], zoom: 2.2 };
  }
  if (zone.startsWith('Atlantic/')) return { center: [-28, 28], zoom: 2 };
  if (zone.startsWith('Indian/')) return { center: [70, -10], zoom: 2.2 };
  return { center: [12, 18], zoom: 0.85 };
}
