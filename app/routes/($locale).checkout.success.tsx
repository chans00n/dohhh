import {Link, useSearchParams, useLoaderData} from 'react-router';
import {useEffect, useState, useRef} from 'react';
import {CartForm} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {data} from '@shopify/remix-oxygen';

export async function loader({context, request}: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const orderName = url.searchParams.get('order_name');
    
    // Get cart to pass to client for clearing
    const cart = await context.cart.get();
    
    return data({ 
      cart,
      orderName: orderName || null 
    });
  } catch (error) {
    // If anything fails, still show success page
    console.error('Error in success page loader:', error);
    return data({ cart: null, orderName: null });
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

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const paymentIntent = searchParams.get('payment_intent');
  const orderNameFromUrl = searchParams.get('order_name');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // Use the actual Shopify order name if available
    if (orderNameFromUrl) {
      setOrderNumber(orderNameFromUrl);
    } else if (loaderData?.orderName) {
      setOrderNumber(loaderData.orderName);
    } else {
      // Fallback to a placeholder if no order name available
      setOrderNumber('Processing...');
    }
  }, [orderNameFromUrl, loaderData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Auto-submit CartForm to clear cart */}
      <CartClearForm cart={loaderData?.cart} />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-block p-8 bg-black rounded-full mb-6">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tight">ORDER CONFIRMED!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for backing this campaign</p>
          {orderNumber && (
            <p className="text-lg text-gray-500">Order #{orderNumber}</p>
          )}
        </div>

        {/* Order Details Box */}
        <div className="border-4 border-black p-8 mb-8">
          <h2 className="text-2xl font-black mb-6 border-b-4 border-black pb-2">WHAT'S NEXT?</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white font-black flex items-center justify-center mr-4">
                1
              </div>
              <div>
                <h3 className="font-black text-lg mb-1">CONFIRMATION EMAIL</h3>
                <p className="text-gray-600">You'll receive an order confirmation email shortly with all your order details.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white font-black flex items-center justify-center mr-4">
                2
              </div>
              <div>
                <h3 className="font-black text-lg mb-1">CAMPAIGN UPDATES</h3>
                <p className="text-gray-600">We'll keep you updated on the campaign progress and production timeline.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white font-black flex items-center justify-center mr-4">
                3
              </div>
              <div>
                <h3 className="font-black text-lg mb-1">SHIPPING NOTIFICATION</h3>
                <p className="text-gray-600">Once your order ships, you'll receive tracking information via email.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/campaigns"
            className="block text-center bg-white text-black border-4 border-black py-4 px-6 font-black text-lg hover:bg-gray-100 transition-colors"
          >
            BROWSE MORE CAMPAIGNS
          </Link>
          <Link
            to="/"
            className="block text-center bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors"
          >
            RETURN TO HOMEPAGE
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-12 pt-12 border-t-4 border-black text-center">
          <p className="text-gray-600 mb-2">Questions about your order?</p>
          <p className="font-black">Contact us at hello@dohhh.com</p>
        </div>
      </main>
    </div>
  );
}