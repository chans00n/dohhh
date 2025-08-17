import {Link, useSearchParams, useLoaderData} from 'react-router';
import {useEffect, useState, useRef} from 'react';
import {CartForm} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {data} from '@shopify/remix-oxygen';
import {CheckoutSuccess} from '~/components/checkout/CheckoutSuccess';
import {CheckoutLoading} from '~/components/checkout/CheckoutLoading';

// Query to get campaign data for the success page
const CAMPAIGN_QUERY = `#graphql
  query CampaignSuccess($productId: ID!) {
    product(id: $productId) {
      id
      title
      handle
      campaignBackers: metafield(namespace: "campaign", key: "backers") {
        value
      }
      campaignBackerCount: metafield(namespace: "campaign", key: "backer_count") {
        value
      }
      campaignTotalRaised: metafield(namespace: "campaign", key: "total_raised") {
        value
      }
      campaignCurrentQuantity: metafield(namespace: "campaign", key: "current_quantity") {
        value
      }
      campaignGoalQuantity: metafield(namespace: "campaign", key: "goal_quantity") {
        value
      }
    }
  }
`;

export async function loader({context, request}: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const orderName = url.searchParams.get('order_name');
    const campaignId = url.searchParams.get('campaign_id');
    const orderTotal = url.searchParams.get('total');
    
    // Get cart to pass to client for clearing
    const cart = await context.cart.get();
    
    // Fetch campaign data if campaign ID is provided
    let campaignData = null;
    if (campaignId) {
      try {
        const {product} = await context.storefront.query(CAMPAIGN_QUERY, {
          variables: {
            productId: campaignId,
          },
        });
        
        if (product) {
          // Use the metafield values directly since webhook updates them
          const backersJson = product.campaignBackers?.value || '';
          const backerCount = parseInt(product.campaignBackerCount?.value || '0');
          const currentAmount = parseFloat(product.campaignTotalRaised?.value || '0');
          const currentQuantity = parseInt(product.campaignCurrentQuantity?.value || '0');
          const goalQuantity = parseInt(product.campaignGoalQuantity?.value || '250');
          
          let backers = [];
          if (backersJson) {
            try {
              backers = JSON.parse(backersJson);
              console.log('Campaign data from metafields:', {
                backerCount,
                currentAmount,
                currentQuantity,
                backersLength: backers.length
              });
            } catch (e) {
              console.error('Error parsing backers JSON:', e);
            }
          }
          
          // Calculate target amount based on goal quantity * price per cookie
          const targetAmount = goalQuantity * 7; // Assuming $7 per cookie average
          const percentComplete = Math.min((currentQuantity / goalQuantity) * 100, 100);
          
          campaignData = {
            id: product.id,
            name: product.title,
            handle: product.handle,
            campaignProgress: {
              currentAmount,
              goalAmount: targetAmount,
              backerCount,
              percentComplete,
            },
            backers, // Include backers array to find the current user's backer number
          };
        }
      } catch (error) {
        console.error('Error fetching campaign data:', error);
      }
    }
    
    return data({ 
      cart,
      orderName: orderName || null,
      orderTotal: orderTotal ? parseFloat(orderTotal) : null,
      campaignData,
    });
  } catch (error) {
    // If anything fails, still show success page
    console.error('Error in success page loader:', error);
    return data({ 
      cart: null, 
      orderName: null,
      orderTotal: null,
      campaignData: null,
    });
  }
}

function CartClearForm({cart}: {cart: any}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (buttonRef.current && !submitted) {
        setSubmitted(true);
        buttonRef.current.click();
        console.log('Auto-clicking cart clear button');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [submitted]);
  
  if (!cart?.lines?.nodes?.length) return null;
  
  const lineIds = cart.lines.nodes.map((line: any) => line.id);
  
  return (
    <div style={{ display: 'none' }}>
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesRemove}
        inputs={{ lineIds }}
      >
        <button ref={buttonRef} type="submit">Clear Cart</button>
      </CartForm>
    </div>
  );
}

export default function CheckoutSuccessV2() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get data from URL params and loader
  const paymentIntent = searchParams.get('payment_intent');
  const orderNameFromUrl = searchParams.get('order_name');
  const customerEmail = searchParams.get('email');
  
  // Prepare items from cart data (if available)
  const items = loaderData?.cart?.lines?.nodes?.map((line: any) => ({
    name: line.merchandise.product.title,
    quantity: line.quantity,
    price: parseFloat(line.cost.totalAmount.amount),
  })) || [];
  
  // Calculate backer number (could be based on order or just increment from existing)
  let backerNumber = loaderData?.campaignData?.campaignProgress?.backerCount 
    ? loaderData.campaignData.campaignProgress.backerCount + 1 
    : undefined;

  useEffect(() => {
    // Simulate loading for polished experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <CheckoutLoading stage="complete" campaignName={loaderData?.campaignData?.name} />;
  }

  return (
    <>
      {/* Auto-submit CartForm to clear cart */}
      <CartClearForm cart={loaderData?.cart} />
      
      <CheckoutSuccess
        orderName={orderNameFromUrl || loaderData?.orderName || '#DOHHH_SUCCESS'}
        orderTotal={loaderData?.orderTotal || 0}
        campaignName={loaderData?.campaignData?.name}
        campaignId={loaderData?.campaignData?.handle}
        items={items}
        customerEmail={customerEmail || 'your email'}
        backerNumber={backerNumber}
        campaignProgress={loaderData?.campaignData?.campaignProgress}
      />
    </>
  );
}