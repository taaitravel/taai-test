import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CART_BUDGET_FIELDS,
  CART_COMMERCE_FIELDS,
  CART_DETAIL_FIELDS,
  CHAT_MESSAGE_FIELDS,
  FORBIDDEN_READ_FIELDS,
  ITINERARY_BUDGET_FIELDS,
  ITINERARY_METADATA_FIELDS,
  PAGE_SIZES,
  assertSafeProjection,
} from '../projections';

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8');

/** Paths that must stay contained. Regression guard. */
const CONTAINED_PATHS = [
  'src/hooks/useAuthenticatedItineraryData.ts',
  'src/hooks/useItineraryData.ts',
  'src/hooks/useItineraryChat.ts',
  'src/hooks/useDashboardData.ts',
  'src/components/itinerary/BudgetPieChart.tsx',
  'src/components/booking/BookingCart.tsx',
];

describe('projection allow-lists', () => {
  it('exclude provider blobs and payment fields', () => {
    const projections = [
      ITINERARY_METADATA_FIELDS,
      ITINERARY_BUDGET_FIELDS,
      CART_COMMERCE_FIELDS,
      CART_DETAIL_FIELDS,
      CART_BUDGET_FIELDS,
      CHAT_MESSAGE_FIELDS,
    ];
    for (const projection of projections) {
      expect(projection).not.toContain('*');
      for (const field of FORBIDDEN_READ_FIELDS) {
        expect(projection).not.toContain(field);
      }
    }
  });

  it('rejects an unsafe projection at construction time', () => {
    expect(() => assertSafeProjection('bad', '*')).toThrow();
    expect(() => assertSafeProjection('bad', 'id, expedia_data')).toThrow();
  });

  it('keeps chat initial loading bounded', () => {
    expect(PAGE_SIZES.chatInitial).toBeLessThanOrEqual(50);
    expect(PAGE_SIZES.chatPage).toBeLessThanOrEqual(50);
  });
});

describe('contained source paths', () => {
  it("never reintroduce select('*')", () => {
    for (const path of CONTAINED_PATHS) {
      const source = read(path);
      expect(source, path).not.toMatch(/select\(\s*['"`]\*['"`]\s*\)/);
    }
  });

  it('never select provider blobs', () => {
    for (const path of CONTAINED_PATHS) {
      const source = read(path);
      expect(source, path).not.toMatch(/select\([^)]*expedia_data/);
    }
  });

  it('bounds the chat initial page and paginates by cursor', () => {
    const source = read('src/hooks/useItineraryChat.ts');
    expect(source).toContain('PAGE_SIZES.chatPage');
    expect(source).toMatch(/\.limit\(/);
    expect(source).toContain("loadMessages('newer')");
  });

  it('registers exactly one realtime channel per conversation/account', () => {
    const source = read('src/hooks/useItineraryChat.ts');
    expect((source.match(/supabase\s*\n?\s*\.channel\(/g) || []).length).toBe(1);
    expect(source).toContain('subscribedKeyRef');
    expect(source).toContain('removeChannel');
  });

  it('routes itinerary and cart reads through the shared request controller', () => {
    const source = read('src/hooks/useAuthenticatedItineraryData.ts');
    expect(source).toContain('request({');
    expect(source).toContain('withAbort');
    expect(source).toContain('handle.release()');
  });

  it('hotel proxies never relay the full upstream response', () => {
    for (const path of ['supabase/functions/expedia-rapid-api/index.ts', 'supabase/functions/booking-com-api/index.ts']) {
      const source = read(path);
      expect(source, path).toContain('shapeProviderPayload');
      expect(source, path).not.toMatch(/JSON\.stringify\(data\)/);
    }
  });

  it('AI chat never selects all itinerary columns', () => {
    const source = read('supabase/functions/chat-with-gpt/index.ts');
    expect(source).not.toMatch(/select\(\s*'\*'\s*\)/);
    expect(source).toContain('createItineraryContextLoader');
  });

  it('keeps the private cache memory-only', () => {
    const source = read('src/lib/data/request-controller.ts');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
  });
});
