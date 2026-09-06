import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CART_ITEM_DETAIL_PROJECTION,
  CART_LIST_PROJECTION,
  fetchCartItemDetail,
  fetchCartList,
} from '../cart-loading';
import { AGENT_APPROVAL_FIELDS, AGENT_EVENT_FIELDS, AGENT_EVIDENCE_FIELDS, AGENT_TASK_FIELDS } from '../projections';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

/** Minimal PostgREST-ish stub that records every selected projection. */
const makeClient = (rows: unknown) => {
  const selects: string[] = [];
  let requests = 0;
  const builder = (): any => {
    const chain: any = {
      order: () => chain,
      limit: () => chain,
      eq: () => chain,
      maybeSingle: () => {
        requests += 1;
        return Promise.resolve({ data: Array.isArray(rows) ? rows[0] : rows, error: null });
      },
      then: (resolve1: any) => {
        requests += 1;
        return Promise.resolve({ data: rows, error: null }).then(resolve1);
      },
    };
    return chain;
  };
  return {
    selects,
    get requests() {
      return requests;
    },
    from: () => ({
      select: (columns: string) => {
        selects.push(columns);
        return builder();
      },
    }),
  };
};

const LIST_ROW = {
  id: 'c1',
  itinerary_id: 'it-1',
  user_id: 'u1',
  type: 'hotel',
  price: 420.5,
  booking_status: 'pending',
  saved_at: '2026-02-20T10:00:00Z',
  external_ref: 'ext-1',
  item_name: 'Hotel Arts',
  item_provider: 'booking.com',
  item_service_dates: { check_in: '2026-03-01', check_out: '2026-03-04' },
  item_service_timing: null,
};

describe('cart list projection', () => {
  it('never selects the item_data blob', () => {
    expect(CART_LIST_PROJECTION).not.toContain('item_data,');
    expect(CART_LIST_PROJECTION.split(',').map((s) => s.trim())).not.toContain('item_data');
    expect(CART_LIST_PROJECTION).not.toContain('*');
  });

  it('extracts only the scalars the row renders', () => {
    expect(CART_LIST_PROJECTION).toContain('item_name:item_data->>name');
    expect(CART_LIST_PROJECTION).toContain('item_provider:item_data->>provider');
  });

  it('issues exactly one request and returns a payload far smaller than a full row', async () => {
    const client = makeClient([LIST_ROW]);
    const items = await fetchCartList(client as never, { itineraryId: 'it-1' });
    expect(items).toHaveLength(1);
    expect(client.requests).toBe(1);
    expect(client.selects).toEqual([CART_LIST_PROJECTION]);

    const listBytes = JSON.stringify(items).length;
    const fullRowBytes = JSON.stringify([
      { ...LIST_ROW, item_data: { name: 'Hotel Arts', rooms: Array.from({ length: 30 }, (_, i) => ({ id: i, description: 'x'.repeat(400) })) } },
    ]).length;
    expect(listBytes).toBeLessThan(fullRowBytes * 0.2);
  });
});

describe('cart item detail', () => {
  it('loads item_data for exactly one opened item', async () => {
    const client = makeClient({ id: 'c1', item_data: { name: 'Hotel Arts', provider: 'booking.com' } });
    const detail = await fetchCartItemDetail(client as never, 'c1', { userId: 'user-a' });
    expect(detail).toEqual({ name: 'Hotel Arts', provider: 'booking.com' });
    expect(client.requests).toBe(1);
    expect(client.selects).toEqual([CART_ITEM_DETAIL_PROJECTION]);
    expect(CART_ITEM_DETAIL_PROJECTION).toBe('id, item_data');
  });
});

describe('cart UI containment', () => {
  it('BookingCart loads the list without item_data and opens details on demand', () => {
    const source = read('src/components/booking/BookingCart.tsx');
    expect(source).toContain('fetchCartList');
    expect(source).toContain('fetchCartItemDetail');
    expect(source).not.toContain('CART_DETAIL_FIELDS');
    expect(source).not.toMatch(/item\.item_data/);
  });
});

describe('agent operations containment', () => {
  it('uses bounded projections, never select("*")', () => {
    const source = read('src/hooks/useAgentOperations.ts');
    expect(source).not.toMatch(/\.select\(\s*['"`]\*['"`]\s*\)/);
    expect(source).toContain('PAGE_SIZES.agentRows');
    for (const projection of [AGENT_TASK_FIELDS, AGENT_APPROVAL_FIELDS, AGENT_EVIDENCE_FIELDS, AGENT_EVENT_FIELDS]) {
      expect(projection).not.toContain('*');
      expect(projection).not.toContain('metadata');
      expect(projection).not.toContain('source_context');
    }
  });
});
