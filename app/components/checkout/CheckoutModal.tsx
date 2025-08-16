/**
 * Checkout Modal Component
 * Provides a modal wrapper for the Stripe checkout experience
 */

import {useEffect, useCallback, lazy, Suspense} from 'react';
import type {CampaignOrderItem} from '~/lib/stripe.types';

// Dynamically import Stripe components to avoid SSR issues
const StripeProvider = lazy(() => 
  import('./StripeProvider.client').then(m => ({default: m.StripeProvider}))
);
const StripeCheckout = lazy(() => 
  import('./StripeCheckout.client').then(m => ({default: m.StripeCheckoutClient}))
);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  campaignImage,
  items,
  onSuccess,
  onError,
}: CheckoutModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle successful payment
  const handleSuccess = useCallback((result: any) => {
    console.log('Payment successful:', result);
    if (onSuccess) {
      onSuccess(result);
    }
    // Close modal after short delay to show success state
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-slideUp" style={{backgroundColor: 'white'}}>
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4" style={{backgroundColor: 'white'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Secure Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-white" style={{backgroundColor: 'white'}}>
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading checkout...</span>
              </div>
            </div>
          }>
            <StripeProvider>
              <StripeCheckout
                campaignId={campaignId}
                campaignName={campaignName}
                campaignImage={campaignImage}
                items={items}
                onSuccess={handleSuccess}
                onError={onError}
                onCancel={onClose}
              />
            </StripeProvider>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/**
 * Checkout Page Component
 * Provides a full-page checkout experience
 */
interface CheckoutPageProps {
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onBack?: () => void;
}

export function CheckoutPage({
  campaignId,
  campaignName,
  campaignImage,
  items,
  onSuccess,
  onError,
  onBack,
}: CheckoutPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Go back"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Secure Checkout
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading checkout...</span>
            </div>
          </div>
        }>
          <StripeProvider>
            <StripeCheckout
              campaignId={campaignId}
              campaignName={campaignName}
              campaignImage={campaignImage}
              items={items}
              onSuccess={onSuccess}
              onError={onError}
              onCancel={onBack}
            />
          </StripeProvider>
        </Suspense>
      </div>

      {/* Trust Badges */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              256-bit SSL Encryption
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
              Secure Payment Processing
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              PCI Compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}