/**
 * Client-side wrapper for Stripe checkout components
 * This ensures Stripe React components only load on the client
 */

import {lazy, Suspense, useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import type {CampaignOrderItem} from '~/lib/stripe.types';

// Lazy load the checkout modal to avoid SSR issues
const CheckoutModal = lazy(() => import('./CheckoutModal').then(m => ({default: m.CheckoutModal})));

interface CheckoutModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function CheckoutModalWrapper(props: CheckoutModalWrapperProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Create or find a container for the portal
    let container = document.getElementById('checkout-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'checkout-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);
    
    return () => {
      // Cleanup if this was the last portal using this container
      if (container && container.childNodes.length === 0) {
        container.remove();
      }
    };
  }, []);

  // Only render on client side and when portal container is ready
  if (typeof window === 'undefined' || !portalContainer || !props.isOpen) {
    return null;
  }

  // Use React Portal to render outside of cart aside
  return createPortal(
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading checkout...</span>
          </div>
        </div>
      </div>
    }>
      <CheckoutModal {...props} />
    </Suspense>,
    portalContainer
  );
}