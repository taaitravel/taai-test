import assert from 'assert';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

test('admin routes require admin role at route level', () => {
  const app = read('src/App.tsx');
  assert.match(app, /path="\/admin\/roles"[\s\S]*?<ProtectedRoute requireAdmin>[\s\S]*?<AdminRoles \/>/);
  assert.match(app, /path="\/admin"[\s\S]*?<ProtectedRoute requireAdmin>[\s\S]*?<AdminDashboard \/>/);
});

test('pre-checkout validation blocks provider-unverified inventory', () => {
  const fn = read('supabase/functions/pre-checkout-validate/index.ts');
  assert.match(fn, /provider_confirmation_ready: boolean/);
  assert.match(fn, /Provider confirmation capability is not verified for live checkout/);
  assert.match(fn, /providerRef\.bookable === true/);
  assert.match(fn, /provider_confirmation_supported === true/);
});

test('checkout creation only accepts provider-confirmable quote items', () => {
  const fn = read('supabase/functions/create-booking-checkout/index.ts');
  assert.match(fn, /v\.provider_confirmation_ready === true/);
  assert.match(fn, /No provider-confirmable items in quote/);
  assert.match(fn, /booking_state: "payment_completed_provider_pending"/);
});

test('booking webhook separates payment from provider confirmation', () => {
  const fn = read('supabase/functions/booking-webhook/index.ts');
  assert.match(fn, /paymentState = "payment_completed"/);
  assert.match(fn, /providerState = "provider_pending"/);
  assert.match(fn, /bookingState = "payment_completed_provider_pending"/);
  assert.match(fn, /status: bookingState/);
  assert.match(fn, /payment_status: paymentState/);
  assert.match(fn, /provider_status: providerState/);
  assert.match(fn, /provider_confirmation_required: true/);
  assert.match(fn, /traveler_notification_status: "not_sent"/);
  assert.doesNotMatch(fn, /status: "confirmed"/);
  assert.doesNotMatch(fn, /provider_status: "provider_confirmed"/);
  assert.doesNotMatch(fn, /type: "booking_confirmed"/);
  assert.doesNotMatch(fn, /\.from\("notifications"\)[\s\S]*?\.insert/);
  assert.doesNotMatch(fn, /\.from\("booking_receipts"\)[\s\S]*?\.insert/);
  assert.match(fn, /fallbackUserId !== userId/);
  assert.match(fn, /Cart item ownership mismatch/);
  assert.match(fn, /Do not send taai traveler-facing notifications until provider confirmation/);
});

test('traveler document data is minimized outside flight checkout', () => {
  const save = read('supabase/functions/save-traveler-details/index.ts');
  const quote = read('supabase/functions/get-checkout-quote/index.ts');
  const checkout = read('src/pages/Checkout.tsx');

  assert.match(save, /function minimizeTravelerData/);
  assert.match(save, /if \(itemType\.toLowerCase\(\) === "flight"\)/);
  assert.match(quote, /function redactTravelerData/);
  assert.doesNotMatch(checkout, /Add travel docs \(optional\)/);
  assert.match(checkout, /collect only for flight items/);
});

test('success page does not claim provider-confirmed booking', () => {
  const page = read('src/pages/BookingSuccess.tsx');
  assert.doesNotMatch(page, /Booking Confirmed!/);
  assert.doesNotMatch(page, /booked successfully/);
  assert.match(page, /Provider confirmation is still pending/);
});

let failures = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(error && error.stack ? error.stack : error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`Gate 7 stabilization checks passed (${cases.length} checks).`);
}
