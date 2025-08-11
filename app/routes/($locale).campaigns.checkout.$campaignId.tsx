import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({params, context}: LoaderFunctionArgs) {
  const variantIdParam = params.campaignId as string;
  const variantId = variantIdParam.startsWith('gid://') ? variantIdParam : `gid://shopify/ProductVariant/${variantIdParam}`;
  const result = await context.cart.create({
    lines: [{merchandiseId: variantId, quantity: 1}],
  });
  if (!result.cart?.checkoutUrl) {
    throw new Response('No checkout URL found', {status: 500});
  }
  const headers = context.cart.setCartId(result.cart.id);
  return redirect(result.cart.checkoutUrl, {headers});
}

export default function Component() { return null; }
