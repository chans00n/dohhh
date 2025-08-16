/**
 * Wrapper component that manages payment intent creation and Stripe initialization
 */

import {useState, useEffect} from 'react';
import {StripeProvider} from './StripeProvider.client';
import {BrutalistCheckout} from './BrutalistCheckout.client';
import type {CampaignOrderItem} from '~/lib/stripe.types';
import {DELIVERY_PRICING} from '~/types/stripe-checkout.types';

interface CheckoutWrapperProps {
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess: (result: any) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}

export function CheckoutWrapper({
  campaignId,
  campaignName,
  campaignImage,
  items,
  onSuccess,
  onError,
  onCancel,
}: CheckoutWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate initial totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const initialTotal = subtotal + DELIVERY_PRICING.pickup; // Start with pickup (free)

  useEffect(() => {
    // Create payment intent on mount
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            campaignId,
            campaignName,
            items,
            deliveryMethod: 'pickup',
            deliveryPrice: DELIVERY_PRICING.pickup,
            subtotal,
            total: initialTotal,
            customer: {
              email: 'pending@example.com',
              name: 'Pending',
            },
          }),
        });

        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error('Failed to create payment intent:', data.error);
          setError(data.error || 'Failed to initialize payment');
        }
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError('Failed to connect to payment system');
      } finally {
        setIsLoading(false);
      }
    };

    if (initialTotal > 0) {
      createPaymentIntent();
    }
  }, [campaignId, campaignName, items, subtotal, initialTotal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-lg font-bold">INITIALIZING SECURE CHECKOUT...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 bg-red-50 border-4 border-red-600">
          <h3 className="text-xl font-black text-red-600 mb-2">PAYMENT SYSTEM ERROR</h3>
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={onCancel}
            className="mt-4 px-6 py-3 bg-black text-white font-black hover:bg-gray-800"
          >
            RETURN TO CART
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-8">
        <div className="p-6 bg-yellow-50 border-4 border-yellow-600">
          <p className="text-yellow-600 font-bold">Waiting for payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <BrutalistCheckout
        campaignId={campaignId}
        campaignName={campaignName}
        campaignImage={campaignImage}
        items={items}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </StripeProvider>
  );
}