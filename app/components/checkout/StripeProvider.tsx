/**
 * Stripe Provider Component
 * Wraps the application with Stripe context
 */

import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js';
import {useMemo} from 'react';
import type {StripeProviderProps} from '~/types/stripe-checkout.types';

/**
 * Stripe appearance customization
 */
const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorText: '#1a1a1a',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e5e5e5',
      boxShadow: 'none',
      padding: '12px',
    },
    '.Input:focus': {
      border: '1px solid #000000',
      boxShadow: '0 0 0 1px #000000',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '8px',
    },
    '.Error': {
      color: '#df1b41',
      fontSize: '13px',
      marginTop: '4px',
    },
  },
};

/**
 * Stripe Elements options
 */
const elementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    },
  ],
};

export function StripeProvider({children, publishableKey}: StripeProviderProps) {
  // Use provided key or get from environment
  const stripeKey = publishableKey || window.ENV?.STRIPE_PUBLISHABLE_KEY;

  // Memoize Stripe promise
  const stripePromise = useMemo(() => {
    if (!stripeKey) {
      console.error('Stripe publishable key is missing');
      return null;
    }
    return loadStripe(stripeKey);
  }, [stripeKey]);

  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">
          Payment system is not configured. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance,
        ...elementsOptions,
      }}
    >
      {children}
    </Elements>
  );
}