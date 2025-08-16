/**
 * Full-page Campaign Checkout with Brutalist Design
 */

import {useState, lazy, Suspense} from 'react';
import {Link, useNavigate} from 'react-router';
import type {CampaignOrderItem} from '~/lib/stripe.types';

// Dynamically import Stripe components
const BrutalistCheckoutV2 = lazy(() => 
  import('./BrutalistCheckoutV2.client')
);

interface CampaignCheckoutPageProps {
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
}

export function CampaignCheckoutPage({
  campaignId,
  campaignName,
  campaignImage,
  items,
}: CampaignCheckoutPageProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (result: any) => {
    console.log('Payment successful:', result);
    // Clear cart and redirect to success page
    setIsLoading(true);
    
    // You might want to clear the cart here
    // await clearCart();
    
    // Redirect to success page
    setTimeout(() => {
      navigate('/checkout/success?payment_intent=' + result.id);
    }, 1500);
  };

  const handleError = (error: Error) => {
    console.error('Payment error:', error);
    // Handle error appropriately
  };

  const handleCancel = () => {
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content - No extra header, using existing site header */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Campaign Title Section */}
        <div className="mb-12 border-l-8 border-black pl-6">
          <h1 className="text-5xl font-black mb-2 tracking-tight">CHECKOUT</h1>
          <p className="text-xl text-gray-600">BACKING: {campaignName.toUpperCase()}</p>
        </div>

        {/* Checkout Form Container */}
        <div className="bg-white border-4 border-black">
          <Suspense fallback={
            <div className="flex items-center justify-center p-24">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-lg font-bold">LOADING SECURE CHECKOUT...</p>
              </div>
            </div>
          }>
            <BrutalistCheckoutV2
              campaignId={campaignId}
              campaignName={campaignName}
              campaignImage={campaignImage}
              items={items}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          </Suspense>
        </div>

        {/* Security Badges */}
        <div className="mt-12 pt-12 border-t-4 border-black">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold">PCI COMPLIANT</p>
            </div>
            <div>
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold">256-BIT SSL</p>
            </div>
            <div>
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-bold">STRIPE SECURED</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}