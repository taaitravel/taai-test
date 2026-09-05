/**
 * Clone ("Make this trip mine") logic — pure functions, no writes.
 *
 * Rules enforced here:
 * - Relative day sequence is preserved while dates shift to the chosen start.
 * - Planning structure, destinations, curated place references and attribution
 *   are copied.
 * - Bookings, confirmations, payments, travelers, group members, private notes,
 *   chats, expired provider offers and old prices are NEVER copied.
 * - New prices/availability must be searched again (flagged on the result).
 */

import type { ItineraryVisibility, PublicItineraryDetail } from './types';

export interface CloneRequest {
  startDate: string; // ISO yyyy-mm-dd
}

export interface ClonedPlace {
  name: string;
  kind: string;
  note: string;
  /** Descriptive planning hints are copied; prices never are. */
  time?: string;
  area?: string;
}

export interface ClonedDay {
  day: number;
  /** Days since the first day of the trip — relative spacing is preserved. */
  offset: number;
  date: string;
  city: string;
  places: ClonedPlace[];
}

export interface CloneResult {
  visibility: ItineraryVisibility;
  lifecycle: 'active';
  title: string;
  summary: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  days: ClonedDay[];
  sourceItinerarySlug: string;
  sourceAuthorSlug: string;
  attribution: string;
  requiresFreshPricing: true;
  copied: string[];
  excluded: string[];
}

export const CLONE_EXCLUDED_FIELDS = [
  'bookings',
  'confirmations',
  'payments',
  'travelers',
  'group_members',
  'private_notes',
  'chats',
  'provider_offers',
  'historical_prices',
];

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const cloneItinerary = (
  source: PublicItineraryDetail,
  request: CloneRequest
): CloneResult => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.startDate)) {
    throw new Error('A start date is required before cloning.');
  }

  // Relative spacing: gaps between source days are preserved exactly, even when
  // the source day numbers are not contiguous.
  const firstDay = source.days.length ? Math.min(...source.days.map(d => d.day)) : 1;

  const days: ClonedDay[] = source.days.map(day => {
    const offset = day.day - firstDay;
    return {
      day: day.day,
      offset,
      date: addDays(request.startDate, offset),
      city: day.city,
      places: day.places.map(p => ({
        name: p.name,
        kind: p.kind,
        note: p.note,
        ...(p.time ? { time: p.time } : {}),
        ...(p.area ? { area: p.area } : {}),
      })),
    };
  });

  const lastOffset = days.length ? days[days.length - 1].offset : 0;

  return {
    visibility: 'private',
    lifecycle: 'active',
    title: source.title,
    summary: source.summary,
    destinations: [...source.destinations],
    startDate: request.startDate,
    endDate: addDays(request.startDate, lastOffset),
    days,
    sourceItinerarySlug: source.publicSlug,
    sourceAuthorSlug: source.author.slug,
    attribution: `Inspired by "${source.title}" from ${source.author.displayName}.`,
    requiresFreshPricing: true,
    copied: ['planning_structure', 'destinations', 'curated_place_references', 'attribution'],
    excluded: CLONE_EXCLUDED_FIELDS,
  };
};
