/**
 * Checkout Error Component
 * Handles various error scenarios with clear messaging and recovery options
 */

import {Link} from 'react-router';

export type ErrorType = 
  | 'payment_failed'
  | 'card_declined' 
  | 'network_error'
  | 'order_creation_failed'
  | 'inventory_error'
  | 'session_expired'
  | 'generic_error';

interface CheckoutErrorProps {
  errorType?: ErrorType;
  errorMessage?: string;
  paymentIntentId?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

const ERROR_CONFIG: Record<ErrorType, {
  icon: string;
  title: string;
  message: string;
  showRetry: boolean;
  showSupport: boolean;
}> = {
  payment_failed: {
    icon: '💳',
    title: "DOHHH! THAT DIDN'T WORK",
    message: "Your payment hit a snag! Don't worry - your card wasn't charged. Let's give it another shot!",
    showRetry: true,
    showSupport: true,
  },
  card_declined: {
    icon: '🚫',
    title: 'BURNT COOKIES! TRY AGAIN',
    message: 'Your card got declined faster than overcooked cookies. Try a different payment method!',
    showRetry: true,
    showSupport: false,
  },
  network_error: {
    icon: '🌐',
    title: 'CRUMBLED! CONNECTION LOST',
    message: "The internet crumbled like a dry cookie! Check your connection and rebuild.",
    showRetry: true,
    showSupport: false,
  },
  order_creation_failed: {
    icon: '📦',
    title: 'OOPS! EVEN HOMER MAKES MISTAKES',
    message: "Your payment worked but we fumbled the order. DOHHH! Our team is on it!",
    showRetry: false,
    showSupport: true,
  },
  inventory_error: {
    icon: '🍪',
    title: 'ALL COOKIES DEVOURED!',
    message: "Someone ate the last batch! But we're mixing up fresh DOHHH-liciousness right now.",
    showRetry: true,
    showSupport: false,
  },
  session_expired: {
    icon: '⏰',
    title: 'COOKIES GOT STALE!',
    message: "Your session expired like milk left out too long. Time to start fresh!",
    showRetry: true,
    showSupport: false,
  },
  generic_error: {
    icon: '😅',
    title: 'DOHHH! SOMETHING CRUMBLED',
    message: "Even perfectly imperfect cookies have hiccups! Let's rebuild this batch.",
    showRetry: true,
    showSupport: true,
  },
};

export function CheckoutError({
  errorType = 'generic_error',
  errorMessage,
  paymentIntentId,
  onRetry,
  onContactSupport,
}: CheckoutErrorProps) {
  const config = ERROR_CONFIG[errorType];
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - go back to checkout
      window.history.back();
    }
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default support behavior - open email
      window.location.href = `mailto:support@dohhh.shop?subject=Checkout Error&body=Error Type: ${errorType}%0D%0APayment Intent: ${paymentIntentId || 'N/A'}%0D%0AError: ${errorMessage || 'No additional details'}`;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Icon Animation */}
        <div className="text-center mb-8">
          <div className="text-8xl animate-shake inline-block">
            {config.icon}
          </div>
        </div>

        {/* Error Message */}
        <div className="border-4 border-black p-8 bg-white">
          <h1 className="text-4xl font-black mb-4 text-center">
            {config.title}
          </h1>
          
          <p className="text-lg text-center mb-6">
            {config.message}
          </p>

          {/* Custom error message if provided */}
          {errorMessage && (
            <div className="p-4 bg-gray-100 border-2 border-gray-300 mb-6">
              <p className="text-sm font-mono">{errorMessage}</p>
            </div>
          )}

          {/* Error Details for Support */}
          {paymentIntentId && (
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500">
                Reference: {paymentIntentId}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {config.showRetry && (
              <button
                onClick={handleRetry}
                className="px-8 py-4 bg-black text-white font-black hover:bg-gray-800 transition-colors"
              >
                BAKE AGAIN
              </button>
            )}
            
            {config.showSupport && (
              <button
                onClick={handleContactSupport}
                className="px-8 py-4 border-2 border-black font-black hover:bg-gray-100 transition-colors"
              >
                CONTACT SUPPORT
              </button>
            )}
          </div>

          {/* Alternative Actions */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <p className="text-center text-gray-600 mb-4">
              Or you can:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/cart"
                className="text-center underline font-bold hover:text-gray-600"
              >
                Return to Cart
              </Link>
              <Link
                to="/campaigns"
                className="text-center underline font-bold hover:text-gray-600"
              >
                Browse Campaigns
              </Link>
              <Link
                to="/"
                className="text-center underline font-bold hover:text-gray-600"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="font-bold mb-2">NEED A COOKIE EMERGENCY HOTLINE?</p>
          <p>
            Email the DOHHH Squad at{' '}
            <a href="mailto:hello@dohhh.shop" className="underline">
              hello@dohhh.shop
            </a>
          </p>
          <p className="mt-2">
            We're baking Monday-Friday, 9am-5pm PST
          </p>
        </div>
      </div>
    </div>
  );
}