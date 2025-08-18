/**
 * Client-side only Stripe Provider Component
 * This ensures Stripe only loads in the browser, not during SSR
 */

import {useMemo, useEffect, useState} from 'react';
import type {StripeProviderProps} from '~/types/stripe-checkout.types';

// Type-safe dynamic imports
let stripePromise: Promise<any> | null = null;
let Elements: any = null;

/**
 * Load Stripe dynamically to avoid SSR issues
 */
async function loadStripe() {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then(module => {
      const {loadStripe} = module;
      const key = window.ENV?.STRIPE_PUBLISHABLE_KEY;
      
      if (!key) {
        console.error('Stripe publishable key is missing');
        return null;
      }
      
      return loadStripe(key);
    });
  }
  return stripePromise;
}

/**
 * Load Stripe Elements dynamically
 */
async function loadElements() {
  if (!Elements) {
    const module = await import('@stripe/react-stripe-js');
    Elements = module.Elements;
  }
  return Elements;
}

/**
 * Stripe appearance customization - Brutalist theme
 */
const appearance = {
  theme: 'flat' as const,  // Use flat theme for better control
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorSurface: '#ffffff',
    colorText: '#000000',
    colorTextSecondary: '#666666',
    colorTextPlaceholder: '#999999',
    colorDanger: '#dc2626',
    colorWarning: '#f59e0b',
    colorSuccess: '#10b981',
    fontFamily: '"Courier New", Courier, monospace',
    fontSizeBase: '16px',
    fontWeightBold: '700',
    spacingUnit: '4px',
    borderRadius: '0px', // No rounded corners - brutalist style
  },
  rules: {
    '.Input': {
      backgroundColor: '#ffffff',
      border: '2px solid #000000',
      borderRadius: '0px',
      boxShadow: 'none',
      padding: '16px',
      color: '#000000',
      fontWeight: '700',
      fontSize: '16px',
    },
    '.Input:focus': {
      backgroundColor: '#ffffff',
      border: '2px solid #000000',
      borderRadius: '0px',
      boxShadow: '0 0 0 4px rgba(156, 163, 175, 0.5)', // Gray ring like our other inputs
      color: '#000000',
      outline: 'none',
    },
    '.Input::placeholder': {
      color: '#999999',
      fontWeight: '400',
    },
    '.Label': {
      fontWeight: '900',
      fontSize: '12px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      marginBottom: '8px',
      color: '#000000',
    },
    '.Error': {
      color: '#dc2626',
      fontSize: '14px',
      fontWeight: '700',
      marginTop: '8px',
    },
    '.Tab': {
      backgroundColor: '#ffffff',
      border: '2px solid #000000',
      borderRadius: '0px',
      color: '#000000',
      fontWeight: '700',
      padding: '12px',
    },
    '.Tab--selected': {
      backgroundColor: '#000000',
      color: '#ffffff',
      borderColor: '#000000',
    },
    '.Tab:hover': {
      backgroundColor: '#f3f4f6',
    },
    '.TabLabel': {
      color: 'inherit',
      fontWeight: '700',
      textTransform: 'uppercase',
      fontSize: '14px',
    },
    '.Block': {
      backgroundColor: '#ffffff',
      boxShadow: 'none',
      borderRadius: '0px',
      border: 'none',
    },
    // Additional rules for dropdowns and other elements
    '.DropdownItem': {
      borderRadius: '0px',
      fontWeight: '700',
    },
    '.DropdownItem--selected': {
      backgroundColor: '#000000',
      color: '#ffffff',
    },
  },
};

export function StripeProvider({children, clientSecret}: StripeProviderProps & {clientSecret?: string | null}) {
  const [stripe, setStripe] = useState<any>(null);
  const [ElementsComponent, setElementsComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    const initStripe = async () => {
      try {
        setIsLoading(true);
        
        // Load both Stripe and Elements
        const [stripeInstance, ElementsComp] = await Promise.all([
          loadStripe(),
          loadElements(),
        ]);
        
        if (!stripeInstance) {
          setError('Failed to load Stripe. Please check your configuration.');
          return;
        }
        
        setStripe(stripeInstance);
        setElementsComponent(() => ElementsComp);
      } catch (err) {
        console.error('Error loading Stripe:', err);
        setError('Failed to load payment system. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initStripe();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🍪</div>
          <p className="text-gray-700 font-black uppercase">PREPARING SECURE CHECKOUT...</p>
          <p className="text-sm text-gray-500 mt-2">DOHHH! ALMOST READY...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !stripe || !ElementsComponent) {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-black">
        <p className="text-black font-black uppercase">
          {error || 'DOHHH! PAYMENT SYSTEM TOOK A COOKIE BREAK. PLEASE REFRESH OR CONTACT THE DOHHH SQUAD.'}
        </p>
      </div>
    );
  }

  // Prepare Elements options
  const elementsOptions: any = {
    appearance,
  };
  
  // Add clientSecret if provided (required for PaymentElement)
  if (clientSecret) {
    elementsOptions.clientSecret = clientSecret;
  }

  // Render Stripe Elements provider
  return (
    <ElementsComponent
      stripe={stripe}
      options={elementsOptions}
    >
      {children}
    </ElementsComponent>
  );
}