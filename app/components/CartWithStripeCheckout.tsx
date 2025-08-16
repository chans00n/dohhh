/**
 * Enhanced Cart Summary with Custom Stripe Checkout Integration
 * Redirects to full-page checkout for campaign products
 */

import {useCallback, useMemo} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {useNavigate} from 'react-router';
import {
  getCampaignFromCart,
  calculateCartTotals,
} from '~/lib/cart-helpers';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartWithStripeCheckout({cart, layout}: CartSummaryProps) {
  const {close} = useAside();
  const navigate = useNavigate();
  
  const className = layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  // Extract campaign information from cart using helper
  const campaignInfo = useMemo(() => getCampaignFromCart(cart), [cart]);

  // Calculate totals using helper
  const {subtotal} = useMemo(() => calculateCartTotals(cart), [cart]);

  // Handle checkout button click
  const handleCheckoutClick = useCallback(() => {
    // Always use our custom checkout for all items
    close();
    navigate('/checkout/campaign');
  }, [navigate, close]);

  return (
    <div aria-labelledby="cart-summary" className={`${className} space-y-4`}>
      <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
        <h4 className="text-lg font-semibold text-neutral-900">Order Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-semibold text-neutral-900">
              {cart.cost?.subtotalAmount?.amount ? (
                <Money data={cart.cost?.subtotalAmount} />
              ) : (
                '-'
              )}
            </span>
          </div>
        </div>
      </div>
      
      <CartDiscounts discountCodes={cart.discountCodes} />
      <CartGiftCard giftCardCodes={cart.appliedGiftCards} />
      
      {/* Custom Checkout Button */}
      {cart?.lines?.nodes?.length ? (
        <div className="space-y-3">
          <button
            onClick={handleCheckoutClick}
            className="block w-full bg-amber-600 hover:bg-amber-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Continue to Checkout →
          </button>
          
          <p className="text-xs text-center text-neutral-500">
            Secure checkout powered by Stripe
          </p>
        </div>
      ) : null}
    </div>
  );
}

// Reuse existing discount component
function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      <dl hidden={!codes.length} className="mb-2">
        <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
          <div>
            <dt className="text-xs text-neutral-500 uppercase tracking-wider">Applied Discount</dt>
            <dd className="font-mono text-sm text-green-700">{codes?.join(', ')}</dd>
          </div>
          <UpdateDiscountForm>
            <button type="submit" className="text-red-600 hover:text-red-700 text-sm font-medium">
              Remove
            </button>
          </UpdateDiscountForm>
        </div>
      </dl>

      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex gap-2">
          <input 
            type="text" 
            name="discountCode" 
            placeholder="Discount code"
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors text-sm font-medium"
          >
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

// Reuse existing gift card component  
function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes?: CartApiQueryFragment['appliedGiftCards'];
}) {
  const appliedGiftCardCodes = giftCardCodes?.map(({lastCharacters}) => `***${lastCharacters}`);

  return (
    <div hidden={!appliedGiftCardCodes?.length}>
      <div className="bg-green-50 rounded-lg p-3 space-y-2">
        <h5 className="text-xs text-neutral-500 uppercase tracking-wider">Applied Gift Cards</h5>
        <ul className="space-y-1">
          {appliedGiftCardCodes?.map((code) => (
            <li key={code} className="flex justify-between items-center">
              <span className="font-mono text-sm text-green-700">{code}</span>
              <UpdateGiftCardForm>
                <button type="submit" className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Remove
                </button>
              </UpdateGiftCardForm>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Form components for updating cart
function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountsUpdate}
    >
      <input
        type="hidden"
        name="discountCodes"
        value={JSON.stringify(discountCodes || [])}
      />
      {children}
    </CartForm>
  );
}

function UpdateGiftCardForm({children}: {children: React.ReactNode}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
    >
      {children}
    </CartForm>
  );
}