import {type LoaderFunctionArgs, redirect} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {CampaignCheckoutWrapper} from '~/components/checkout/CampaignCheckoutWrapper';

export async function loader({context}: LoaderFunctionArgs) {
  const cart = await context.cart.get();
  
  if (!cart || !cart.lines || cart.lines.nodes.length === 0) {
    throw redirect('/cart');
  }

  // Allow all items through our custom checkout
  // No longer checking for campaign items only

  // Return using Response with JSON
  return new Response(JSON.stringify({cart}), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export default function CampaignCheckout() {
  const {cart} = useLoaderData<typeof loader>();
  
  // Transform cart items for checkout
  const items = cart.lines.nodes.map((line: any) => ({
    variantId: line.merchandise.id,
    productId: line.merchandise.product.id,
    name: line.merchandise.product.title,
    variant: line.merchandise.title !== 'Default Title' ? line.merchandise.title : '',
    price: parseFloat(line.merchandise.price.amount),
    quantity: line.quantity,
    image: line.merchandise.image?.url || line.merchandise.product.featuredImage?.url,
  }));

  // Check if we have campaign items
  const campaignItem = cart.lines.nodes.find((line: any) => {
    const product = line.merchandise.product;
    return product.tags?.some((tag: string) => 
      tag.toLowerCase().includes('campaign')
    ) || product.handle?.includes('campaign') || product.handle?.includes('uplift');
  });

  // Use campaign details if available, otherwise use generic order details
  const campaignName = campaignItem 
    ? campaignItem.merchandise.product.title 
    : (cart.lines.nodes.length === 1 
        ? cart.lines.nodes[0]?.merchandise.product.title 
        : 'Your Order');
  
  const campaignId = campaignItem 
    ? campaignItem.merchandise.product.id 
    : (cart.lines.nodes[0]?.merchandise.product.id || 'order');
  
  const campaignImage = campaignItem
    ? campaignItem.merchandise.product.featuredImage?.url
    : cart.lines.nodes[0]?.merchandise.product.featuredImage?.url;

  return (
    <CampaignCheckoutWrapper
      campaignId={campaignId}
      campaignName={campaignName}
      campaignImage={campaignImage}
      items={items}
      isCampaign={!!campaignItem}
    />
  );
}