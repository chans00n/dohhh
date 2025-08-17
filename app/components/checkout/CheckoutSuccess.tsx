/**
 * Checkout Success Component with Celebration and Campaign Impact
 * Shows order confirmation, campaign progress, and social sharing
 */

import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';

interface CheckoutSuccessProps {
  orderName?: string;
  orderTotal?: number;
  campaignName?: string;
  campaignId?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customerEmail?: string;
  backerNumber?: number;
  campaignProgress?: {
    currentAmount: number;
    goalAmount: number;
    backerCount: number;
    percentComplete: number;
  };
}

export function CheckoutSuccess({
  orderName = '#DOHHH_1001',
  orderTotal = 0,
  campaignName = 'Your Campaign',
  campaignId,
  items = [],
  customerEmail,
  backerNumber,
  campaignProgress,
}: CheckoutSuccessProps) {
  const [showCelebration, setShowCelebration] = useState(true);
  const [copied, setCopied] = useState(false);

  // Hide celebration after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Social sharing functions
  const shareOnTwitter = () => {
    const text = `I just backed ${campaignName} with some Dohhh-licious cookies! 🍪 Support small dreams with big flavor!`;
    const url = `https://www.dohhh.shop/campaigns/${campaignId}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnFacebook = () => {
    const url = `https://www.dohhh.shop/campaigns/${campaignId}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const copyShareLink = () => {
    const url = `https://www.dohhh.shop/campaigns/${campaignId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl animate-bounce">🍪</div>
          </div>
          <div className="absolute top-1/4 left-1/4 text-6xl animate-ping">✨</div>
          <div className="absolute top-1/3 right-1/4 text-6xl animate-ping animation-delay-200">✨</div>
          <div className="absolute bottom-1/3 left-1/3 text-6xl animate-ping animation-delay-400">✨</div>
          <div className="absolute bottom-1/4 right-1/3 text-6xl animate-ping animation-delay-600">✨</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 animate-fade-in">
            DOHHH-LICIOUS!
          </h1>
          <p className="text-2xl font-bold">
            Your order {orderName} is confirmed!
          </p>
          <p className="text-lg text-gray-600 mt-2">
            We sent a confirmation to {customerEmail}
          </p>
        </div>


        {/* Order Details */}
        <div className="border-2 border-black p-6 mb-8">
          <h3 className="text-2xl font-black mb-4">ORDER DETAILS</h3>
          
          <div className="space-y-2 mb-4">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t-2 border-black pt-4">
            <div className="flex justify-between text-xl font-black">
              <span>TOTAL</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-100">
            <p className="font-bold mb-2">WHAT'S NEXT?</p>
            <ul className="space-y-1 text-sm uppercase">
              <li>✓ You'll receive an order confirmation email</li>
              <li>✓ We'll start baking your fresh cookies</li>
              <li>✓ Shipping updates will be sent to your email</li>
              <li>✓ Expect delivery in 5-7 business days</li>
            </ul>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="border-2 border-black p-6 mb-8">
          <h3 className="text-2xl font-black mb-4 text-center">
            SPREAD THE DOHHH!
          </h3>
          <p className="text-center mb-6 uppercase">
            Help {campaignName} reach more supporters!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <button
              onClick={shareOnTwitter}
              className="px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
            >
              SHARE ON TWITTER
            </button>
            <button
              onClick={shareOnFacebook}
              className="px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
            >
              SHARE ON FACEBOOK
            </button>
            <button
              onClick={copyShareLink}
              className="px-6 py-3 border-2 border-black font-black hover:bg-gray-100 transition-colors"
            >
              {copied ? 'COPIED!' : 'COPY LINK'}
            </button>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center">
          <Link
            to="/campaigns"
            className="inline-block mb-4 px-8 py-4 bg-black text-white font-black text-lg hover:bg-gray-800 transition-colors"
          >
            BACK MORE CAMPAIGNS
          </Link>
          <p className="mt-4 text-gray-600">
            or{' '}
            <Link to="/" className="underline font-bold">
              return to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}