# Stripe Setup Instructions for Medusa

## Important: You need TWO different Stripe keys:

### 1. Backend (Medusa Server) - SECRET KEY
- Located in: `/dohhh/.env`
- Variable name: `STRIPE_API_KEY`
- Format: Starts with `sk_test_` or `sk_live_`
- **Security**: NEVER expose this key to the client/browser
- **Status**: ✅ Already configured correctly

### 2. Frontend (Next.js) - PUBLISHABLE KEY  
- Located in: `/dohhh-storefront/.env.local`
- Variable name: `NEXT_PUBLIC_STRIPE_KEY`
- Format: Starts with `pk_test_` or `pk_live_`
- **Security**: Safe to expose in browser
- **Status**: ❌ Currently has SECRET key - needs to be changed!

## Steps to fix:

1. Go to your Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Update `/dohhh-storefront/.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   ```

## After configuration:

1. Restart your Medusa backend server (if it's running)
2. The Next.js frontend should automatically reload
3. In Medusa Admin (http://localhost:9000/app):
   - Go to Settings → Regions
   - Edit your region
   - Add "Stripe" as a payment provider
   - Save changes

## Testing:

1. Add a product to cart
2. Go to checkout
3. You should see Stripe payment option
4. Use test card: 4242 4242 4242 4242 (any future date, any CVC)