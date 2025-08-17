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
    title: "OOPS! PAYMENT DIDN'T GO THROUGH",
    message: "Don't be a Dohhh-Dohhh - let's try that again! Your card wasn't charged.",
    showRetry: true,
    showSupport: true,
  },
  card_declined: {
    icon: '🚫',
    title: 'CARD DECLINED',
    message: 'Your card was declined. Please try a different payment method or contact your bank.',
    showRetry: true,
    showSupport: false,
  },
  network_error: {
    icon: '🌐',
    title: 'CONNECTION LOST',
    message: "Even our cookies need a good connection! Check your internet and try again.",
    showRetry: true,
    showSupport: false,
  },
  order_creation_failed: {
    icon: '📦',
    title: 'ORDER HICCUP',
    message: "Your payment went through but we had trouble creating your order. Don't worry - we're on it!",
    showRetry: false,
    showSupport: true,
  },
  inventory_error: {
    icon: '🍪',
    title: 'OUT OF COOKIES!',
    message: "Someone beat you to the last batch! But don't worry, we're baking more.",
    showRetry: true,
    showSupport: false,
  },
  session_expired: {
    icon: '⏰',
    title: 'SESSION EXPIRED',
    message: "You took a bit too long (we get it, choosing cookies is hard!). Let's start fresh.",
    showRetry: true,
    showSupport: false,
  },
  generic_error: {
    icon: '😅',
    title: 'SOMETHING WENT WRONG',
    message: "Even we make mistakes sometimes! Let's try this again.",
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
                TRY AGAIN
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
          <p className="font-bold mb-2">NEED IMMEDIATE HELP?</p>
          <p>
            Email us at{' '}
            <a href="mailto:hello@dohhh.shop" className="underline">
              hello@dohhh.shop
            </a>
          </p>
          <p className="mt-2">
            We're here Monday-Friday, 9am-5pm PST
          </p>
        </div>
      </div>
    </div>
  );
}