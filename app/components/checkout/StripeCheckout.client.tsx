/**
 * Client-side only wrapper for StripeCheckout
 * This ensures all Stripe hooks and components are only used in the browser
 */

import {useEffect, useState} from 'react';
import type {StripeCheckoutProps} from '~/types/stripe-checkout.types';

// Store the actual component after dynamic import
let StripeCheckoutComponent: any = null;

export function StripeCheckoutClient(props: StripeCheckoutProps) {
  const [Component, setComponent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    const loadComponent = async () => {
      try {
        if (!StripeCheckoutComponent) {
          // Dynamically import the actual StripeCheckout component
          const module = await import('./StripeCheckout');
          StripeCheckoutComponent = module.StripeCheckout;
        }
        setComponent(() => StripeCheckoutComponent);
      } catch (err) {
        console.error('Error loading StripeCheckout:', err);
        setError('Failed to load checkout component');
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-700">Loading checkout form...</span>
        </div>
      </div>
    );
  }

  if (error || !Component) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
        <p className="text-red-600" style={{color: '#dc2626'}}>
          {error || 'Checkout form is not available. Please refresh and try again.'}
        </p>
      </div>
    );
  }

  return <Component {...props} />;
}