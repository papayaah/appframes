# One-Time Fee Payment Gateway Integration (HitPay)

## Goal

Implement a one-time payment system (Life-Time Deal / LTD) using **HitPay**. This is optimized for the Philippine market for native GCash support and the lowest possible transaction fees (2.3% for GCash).

## Why HitPay?

- **Native GCash/Maya**: Highest conversion for Filipino users.
- **Asian Local Reach**: 
  - **India**: UPI (450M users).
  - **China**: WeChat Pay & Alipay.
  - **SEA**: PayNow (SG), PromptPay (TH), QRIS (ID), DuitNow (MY).
- **Global Cards**: Visa, Mastercard, Amex, Apple Pay, Google Pay.
- **Lower Fees**: 2.3% for E-Wallets vs ~5% for global gateways.
- **Direct Payouts**: Payouts go directly to your Philippine Bank account via InstaPay/PESONet.
- **Simplicity**: No complex "Merchant of Record" setup; you are the direct seller.

## Database Schema Changes

We will add a `user_licenses` table to track purchases.

```typescript
// db/schema.ts

export const userLicenses = pgTable('user_licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  licenseType: text('license_type').notNull().default('LIFETIME'), 
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'REVOKED'
  gateway: text('gateway').notNull().default('HITPAY'),
  hitpayPaymentId: text('hitpay_payment_id').unique(), // For idempotency (Payment Request ID)
  amount: integer('amount').notNull(), // In cents/subunits
  currency: text('currency').notNull().default('PHP'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
}, (t) => ({
  userIdIdx: index('user_licenses_user_id_idx').on(t.userId),
}));
```

## Implementation Strategy

### 1. HitPay API Setup
- Generate an **API Key** and **Salt** from the HitPay Dashboard.
- Define a "Payment Request" via their API to get a redirect URL.

### 2. Checkout Flow
- **Request**: Create a Payment Request.
- **Payload**: Include `email`, `amount`, `currency`, and `reference_number` (your user ID).
- **Redirection**: Send the user to the `url` returned by HitPay.

### 3. Webhook Handler (`/api/payments/webhook`)
- Listen for the `payment_request.completed` event.
- **Security**: Verify the `Hitpay-Signature` header.
  - Compute `HMAC-SHA256` using your **Salt** and the raw POST body.
  - Compare with the header to ensure the request is from HitPay.
- **Fulfillment**: On match, update `user_licenses` to `ACTIVE`.

### 4. Access Control
Create a helper to check if the current user has an active license record.

```typescript
// lib/payments.ts
export async function hasActiveLicense(userId: string): Promise<boolean> {
  const license = await db.query.userLicenses.findFirst({
    where: and(
      eq(userLicenses.userId, userId),
      eq(userLicenses.status, 'ACTIVE')
    )
  });
  return !!license;
}
```

## User Experience (UX) Flow

1.  **Upgrade UI**: User clicks "Unlock Pro (₱XXX One-time)".
2.  **Checkout**: User is redirected to HitPay, selects **GCash**, and pays instantly inside the GCash app.
3.  **Success**: HitPay redirects back to `/app/settings?status=success`.
4.  **Activation**: The webhook activates the license in < 1 second.

## Environment Variables

- `HITPAY_API_KEY`: For creating payment requests.
- `HITPAY_SALT`: For verifying webhook signatures.
- `HITPAY_X_ENDPOINT`: HitPay API base URL (Sandbox or Production).

## Security & Whitelisting

To ensure reliable and secure payment processing, implement the following:

### Webhook IP Whitelisting
Configure your server/firewall to only accept POST requests to the webhook endpoint from HitPay's official IPs:
- **Production**: `3.1.13.32`, `52.77.254.34`
- **Sandbox**: `54.179.156.147`

### Domain Whitelisting (CSP)
If the application uses a Content Security Policy (CSP), allow the following domains:
- `script-src`: `https://hitpayapp.com`
- `connect-src`: `https://hitpayapp.com`
- `frame-src`: `https://hitpayapp.com`
- `img-src`: `https://hitpayapp.com`

## Billing Dashboard (User-facing)

We will provide a simple billing history inside the user's settings instead of using a third-party portal. This ensures a fast, integrated experience.

- **Auto-Sync**: The `user_licenses` table is updated instantly via webhooks.
- **Display**: Users can view their `Date`, `Amount`, `Currency`, and `Status` directly in the settings.
- **Receipts**: HitPay sends an automatic receipt to the user's email immediately after purchase.

## Deliverables Checklist

- [ ] Create HitPay Account (Sandbox first).
- [ ] Add `user_licenses` to `db/schema.ts` and run `npx drizzle-kit push`.
- [ ] Implement `app/api/payments/checkout/route.ts` (HitPay Payment Request).
- [ ] Implement `app/api/payments/webhook/route.ts` (Hitpay-Signature verification).
- [ ] Create a "Pro Only" UI wrapper or logic.
- [ ] Add "Billing" or "License" section in Settings to show purchase status.
