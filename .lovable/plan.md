

## Add Payment Method Display and Management

### Approach: Stripe-Native (PCI Compliant)

Stripe stores all payment methods. We will never store or handle raw card data. The flow is:
- A new edge function retrieves the customer's default payment method (brand + last 4 digits) from Stripe
- The subscription page displays this info read-only
- "Update Payment Method" and "Add Payment Method" buttons open the Stripe Billing Portal (already wired via `customer-portal` edge function)

This is the industry best practice -- Stripe handles PCI compliance, tokenization, and storage.

---

### 1. New Edge Function: `get-payment-info`

**File: `supabase/functions/get-payment-info/index.ts`**

- Authenticates the user via JWT
- Looks up the Stripe customer by email
- Calls `stripe.customers.retrieve(customerId)` with expanded `invoice_settings.default_payment_method`
- Also calls `stripe.paymentMethods.list({ customer: customerId, type: 'card' })` to get all cards on file
- Returns a safe subset to the client:

```text
{
  has_payment_method: true,
  default_method: {
    brand: "visa",
    last4: "4242",
    exp_month: 12,
    exp_year: 2027
  },
  all_methods: [
    { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2027, is_default: true },
    { brand: "mastercard", last4: "8888", exp_month: 3, exp_year: 2026, is_default: false }
  ]
}
```

- Add to `supabase/config.toml`: `[functions.get-payment-info]` with `verify_jwt = false` (validated in code)

### 2. Update UsageDashboard

**File: `src/components/subscription/UsageDashboard.tsx`**

Add a "Payment Method" section above the usage rows:

- On mount, call the `get-payment-info` edge function
- Display the default card as an icon (Visa/Mastercard/Amex logo via lucide `CreditCard` icon) + "ending in 4242, expires 12/27"
- If multiple methods exist, show them in a list
- Two buttons:
  - "Update Payment Method" -- calls `openCustomerPortal()` (already exists in `useSubscription`)
  - "Add Payment Method" -- same portal link (Stripe portal handles adding new methods)
- If no payment method: show "No payment method on file" with an "Add Payment Method" button

### 3. Update Subscription Page Integration

**File: `src/pages/Subscription.tsx`**

- Pass `openCustomerPortal` down to `UsageDashboard` as a prop so the payment buttons can open the Stripe portal directly

---

### Security Notes

- No card numbers, CVVs, or sensitive data ever touch our server or database
- The edge function only returns brand, last4, and expiration -- safe for display
- All payment method changes go through Stripe's PCI-compliant hosted portal
- Rate limiting and auth validation follow existing patterns

### Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/get-payment-info/index.ts` | New -- fetch payment methods from Stripe |
| `supabase/config.toml` | Add `[functions.get-payment-info]` |
| `src/components/subscription/UsageDashboard.tsx` | Add payment method display + portal buttons |
| `src/pages/Subscription.tsx` | Pass `openCustomerPortal` to UsageDashboard |

