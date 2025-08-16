/**
 * Test Page for Cart to Checkout Integration
 * Demonstrates the custom Stripe checkout flow from cart
 */

import {useState, lazy, Suspense} from 'react';
import {useLoaderData} from 'react-router';
import {CartMain} from '~/components/CartMain';

// Lazy load test component to avoid SSR issues
const CheckoutTestComponent = lazy(() => 
  import('~/components/checkout/CheckoutIntegrationExample').then(m => ({
    default: m.CheckoutTestComponent
  }))
);

export async function loader() {
  // Mock cart data for testing
  const mockCart = {
    id: 'gid://shopify/Cart/test123',
    checkoutUrl: 'https://checkout.shopify.com/test',
    totalQuantity: 2,
    lines: {
      nodes: [
        {
          id: 'gid://shopify/CartLine/1',
          quantity: 2,
          merchandise: {
            id: 'gid://shopify/ProductVariant/123456789',
            price: {
              amount: '6.99',
              currencyCode: 'USD',
            },
            product: {
              id: 'gid://shopify/Product/10058503946559',
              title: 'Support Our Campaign Cookie',
              handle: 'campaign-cookie',
              tags: ['campaign', 'cookies'],
            },
            image: {
              url: 'https://cdn.shopify.com/cookie-image.jpg',
              altText: 'Campaign Cookie',
            },
            selectedOptions: [
              {name: 'Size', value: 'Regular'},
            ],
          },
        },
      ],
    },
    cost: {
      totalAmount: {
        amount: '13.98',
        currencyCode: 'USD',
      },
      subtotalAmount: {
        amount: '13.98',
        currencyCode: 'USD',
      },
    },
    discountCodes: [],
    appliedGiftCards: [],
  };

  // Return plain object for Remix loader
  return {
    mockCart,
    testMode: true,
  };
}

export default function TestCheckoutIntegration() {
  const {mockCart, testMode} = useLoaderData<typeof loader>();
  const [showTestCart, setShowTestCart] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-bold text-yellow-900 mb-2">
          ⚠️ Test Mode Active
        </h2>
        <p className="text-yellow-700">
          This is a test page for the cart to checkout integration. 
          Use test card numbers for payments.
        </p>
      </div>

      <h1 className="text-3xl font-bold mb-8">Cart to Checkout Integration Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Instructions */}
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Flow</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Add items to cart (or use mock cart)</li>
              <li>Click "Back this Campaign" button</li>
              <li>Fill out checkout form</li>
              <li>Use test card: 4242 4242 4242 4242</li>
              <li>Complete payment</li>
              <li>Verify cart is cleared</li>
            </ol>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Cards</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-mono">4242 4242 4242 4242</span>
                <span className="text-green-600">Success</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">4000 0000 0000 0002</span>
                <span className="text-red-600">Declined</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">4000 0025 0000 3155</span>
                <span className="text-yellow-600">Requires Auth</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Use any future date for expiry, any 3 digits for CVC
            </p>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Integration Points</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Cart detects campaign products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Checkout button changes for campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Cart data passes to checkout</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Stripe payment processing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Shopify order creation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Cart clears after success</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Test Components */}
        <div className="space-y-6">
          {/* Mock Cart Display */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Mock Cart</h2>
            <button
              onClick={() => setShowTestCart(!showTestCart)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg font-medium transition"
            >
              {showTestCart ? 'Hide' : 'Show'} Test Cart
            </button>
            
            {showTestCart && (
              <div className="mt-4 border-t pt-4">
                <CartMain cart={mockCart as any} layout="page" />
              </div>
            )}
          </section>

          {/* Direct Checkout Test */}
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Direct Checkout Test</h2>
            {typeof window !== 'undefined' && (
              <Suspense fallback={<div>Loading checkout test...</div>}>
                <CheckoutTestComponent />
              </Suspense>
            )}
          </section>
        </div>
      </div>

      {/* Integration Code Example */}
      <section className="mt-12 bg-gray-900 text-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Integration Code</h2>
        <pre className="text-sm overflow-x-auto">
          <code>{`// In your cart component:
import {CartWithStripeCheckout} from '~/components/CartWithStripeCheckout';

// Replace CartSummary with CartWithStripeCheckout
<CartWithStripeCheckout cart={cart} layout={layout} />

// The component automatically:
// 1. Detects campaign products
// 2. Shows "Back this Campaign" for campaigns
// 3. Opens Stripe checkout modal
// 4. Handles payment and order creation
// 5. Clears cart on success`}</code>
        </pre>
      </section>

      {/* Debug Info */}
      {testMode && (
        <section className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify({
              cartId: mockCart.id,
              itemCount: mockCart.totalQuantity,
              total: mockCart.cost.totalAmount.amount,
              hasCampaignTag: true,
              stripeEnabled: !!window.ENV?.STRIPE_PUBLISHABLE_KEY,
            }, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}