import {Image, Money, useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartWithStripeCheckout} from './CartWithStripeCheckout';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;

  return (
    <div className={className}>
      <CartEmpty hidden={linesCount} layout={layout} />
      <div className="cart-details space-y-4">
        <div aria-labelledby="cart-lines">
          <ul>
            {(cart?.lines?.nodes ?? []).map((line) => (
              <CartLineItem key={line.id} line={line} layout={layout} />
            ))}
          </ul>
        </div>
        {cartHasItems && <CartWithStripeCheckout cart={cart} layout={layout} />}
      </div>
    </div>
  );
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div hidden={hidden} className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">🍪</div>
      <h2 className="text-2xl font-black mb-2 uppercase">
        YOUR CART IS HUNGRY FOR COOKIES
      </h2>
      <p className="text-neutral-600 mb-6 font-mono">
        NOTHING HERE BUT CRUMBS... TIME TO FILL IT UP!
      </p>
      <Link 
        to="/collections/all" 
        onClick={close} 
        prefetch="viewport"
        className="inline-block bg-black hover:bg-gray-800 text-white font-black py-3 px-8 border-2 border-black transition-colors uppercase"
      >
        FEED YOUR CART
      </Link>
    </div>
  );
}
