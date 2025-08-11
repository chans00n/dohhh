import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useRef} from 'react';
import {FetcherWithComponents} from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

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
      <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
    </div>
  );
}
function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="space-y-3">
      <a 
        href={checkoutUrl} 
        target="_self"
        className="block w-full bg-amber-600 hover:bg-amber-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
      >
        Continue to Checkout →
      </a>
      <p className="text-xs text-center text-neutral-500">
        
      </p>
    </div>
  );
}

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
      {/* Have existing discount, display it with a remove option */}
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

      {/* Show an input to apply a discount */}
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
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

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
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const appliedGiftCardCodes = useRef<string[]>([]);
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const codes: string[] =
    giftCardCodes?.map(({lastCharacters}) => `***${lastCharacters}`) || [];

  function saveAppliedCode(code: string) {
    const formattedCode = code.replace(/\s/g, ''); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
    giftCardCodeInput.current!.value = '';
  }

  function removeAppliedCode() {
    appliedGiftCardCodes.current = [];
  }

  return (
    <div>
      {/* Have existing gift card applied, display it with a remove option */}
      <dl hidden={!codes.length} className="mb-2">
        <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
          <div>
            <dt className="text-xs text-neutral-500 uppercase tracking-wider">Applied Gift Card</dt>
            <dd className="font-mono text-sm text-green-700">{codes?.join(', ')}</dd>
          </div>
          <UpdateGiftCardForm>
            <button type="submit" onClick={() => removeAppliedCode()} className="text-red-600 hover:text-red-700 text-sm font-medium">
              Remove
            </button>
          </UpdateGiftCardForm>
        </div>
      </dl>

      {/* Show an input to apply a gift card */}
      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        saveAppliedCode={saveAppliedCode}
      >
        <div className="flex gap-2">
          <input
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
          <button 
            type="submit"
            className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

function UpdateGiftCardForm({
  giftCardCodes,
  saveAppliedCode,
  children,
}: {
  giftCardCodes?: string[];
  saveAppliedCode?: (code: string) => void;
  removeAppliedCode?: () => void;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{
        giftCardCodes: giftCardCodes || [],
      }}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        const code = fetcher.formData?.get('giftCardCode');
        if (code && saveAppliedCode) {
          saveAppliedCode(code as string);
        }
        return children;
      }}
    </CartForm>
  );
}
