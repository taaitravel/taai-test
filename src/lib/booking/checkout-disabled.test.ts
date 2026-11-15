import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { minimizeTraveler, redactTravelerRecord } from '../../../supabase/functions/_shared/traveler-privacy';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('travel booking checkout stays disabled', () => {
  it('refuses the checkout function and the client unless both flags are exactly true', () => {
    const checkout = read('supabase/functions/create-booking-checkout/index.ts');
    const features = read('src/lib/features.ts');
    const app = read('src/App.tsx');
    const hook = read('src/hooks/useBookingCheckout.ts');

    expect(checkout).toContain('Deno.env.get("TRAVEL_BOOKING_CHECKOUT_ENABLED") !== "true"');
    expect(checkout).toContain('Travel booking checkout is not available');
    expect(features).toContain('import.meta.env.VITE_TRAVEL_BOOKING_CHECKOUT === "true"');
    expect(app).toContain('{travelBookingCheckoutEnabled && (');
    expect(hook).toContain('if (!travelBookingCheckoutEnabled)');
    expect(hook).toContain("throw new Error('Travel booking checkout is not available.')");
  });

  it('does not let a booking webhook confirm a sale, notify, or receipt while checkout is off', () => {
    const webhook = read('supabase/functions/booking-webhook/index.ts');
    const gate = webhook.indexOf('TRAVEL_BOOKING_CHECKOUT_ENABLED');
    const completion = webhook.indexOf('.from("booking_completions")');

    expect(gate).toBeGreaterThan(-1);
    expect(completion).toBeGreaterThan(gate);
    expect(webhook).toContain('travel_booking_checkout_disabled');
    expect(webhook).toContain('Checkout session does not belong to the signed-in user');
    expect(webhook).toContain('Cart item ownership mismatch');
    expect(webhook).toContain('payment_recorded_not_provider_confirmed');
    expect(webhook).not.toContain('booking_confirmed');
    expect(webhook).not.toContain('Booking Confirmed');
    expect(webhook).not.toContain('generate-booking-receipt');
    expect(webhook).not.toContain('status: "confirmed"');
    expect(webhook).not.toContain('booking_status: "booked"');
    expect(webhook).not.toContain('booking_complete');
    expect(webhook).not.toContain('payment_status: "covered"');
  });

  it('leaves subscription checkout on its own webhook', () => {
    for (const path of [
      'supabase/functions/create-checkout/index.ts',
      'supabase/functions/customer-portal/index.ts',
      'supabase/functions/stripe-subscription-webhook/index.ts',
    ]) {
      expect(read(path)).not.toContain('TRAVEL_BOOKING_CHECKOUT_ENABLED');
    }
    expect(read('supabase/functions/stripe-subscription-webhook/index.ts')).toContain('checkout.session.completed');
    expect(read('supabase/functions/booking-webhook/index.ts')).toContain('stripe-subscription-webhook');
  });

  it('keeps admin routes behind requireAdmin and does not claim a confirmed booking', () => {
    const app = read('src/App.tsx');
    const success = read('src/pages/BookingSuccess.tsx');
    expect(app).toContain('path="/admin"');
    expect(app).toMatch(/path="\/admin"[\s\S]*?<ProtectedRoute requireAdmin>[\s\S]*?<AdminDashboard \/>/);
    expect(app).toMatch(/path="\/admin\/roles"[\s\S]*?<ProtectedRoute requireAdmin>[\s\S]*?<AdminRoles \/>/);
    expect(success).not.toContain('Booking Confirmed');
    expect(success).not.toContain('booked successfully');
    expect(success).toContain('does not confirm a booking');
  });
});

describe('traveler document minimization', () => {
  const traveler = {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    phone: '+15555550123',
    dob: '1815-12-10',
    nationality: 'GB',
    passport_number: 'SECRET-PASSPORT',
    passport_expiry: '2030-01-01',
  };

  it('stores passport and date of birth only for a flight', () => {
    expect(minimizeTraveler('hotel', traveler)).toEqual({
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
    });
    expect(minimizeTraveler('flight', traveler).passport_number).toBe('SECRET-PASSPORT');
    expect(read('supabase/functions/save-traveler-details/index.ts')).toContain('minimizeTraveler');
    expect(read('src/pages/Checkout.tsx')).not.toContain('Add travel docs (optional)');
  });

  it('does not return document fields when a quote is reloaded', () => {
    const redacted = redactTravelerRecord({
      cart_item_id: 'item-1',
      item_type: 'flight',
      traveler_data: {
        lead: traveler,
        additional: [{ first_name: 'Gus', passport_number: 'ALSO-SECRET' }],
        special_requests: 'window',
        pax: 2,
      },
    });
    expect(JSON.stringify(redacted)).not.toContain('SECRET');
    expect(redacted.traveler_data.lead).toMatchObject({ first_name: 'Ada', email: 'ada@example.com' });
    expect(redacted.traveler_data.additional[0]).toEqual({
      first_name: 'Gus',
      last_name: '',
      middle_name: '',
      email: '',
      phone: '',
    });
    expect(read('supabase/functions/get-checkout-quote/index.ts')).toContain('redactTravelerRecord');
  });
});

describe('attribution stays off shared profile projections', () => {
  it('does not select signup attribution when loading another person or the dashboard card', () => {
    const follows = read('src/hooks/useFollows.ts');
    const dashboard = read('src/hooks/useDashboardData.ts');
    for (const field of ['utm_source', 'utm_medium', 'signup_referrer', 'landing_path', 'first_touch_at']) {
      expect(follows).not.toContain(field);
      expect(dashboard).not.toContain(field);
    }
    expect(read('src/pages/Signup.tsx')).toContain('toSignupMetadata(captureFirstTouchAttribution())');
    expect(read('src/contexts/AuthContext.tsx')).toContain('shouldPersistAttributionOnSession');
  });
});
