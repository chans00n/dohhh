/**
 * Checkout Integration Example
 * Shows how to integrate the Stripe checkout component into a campaign page
 */

import {useState, useCallback} from 'react';
import {CheckoutModal, CheckoutPage} from './CheckoutModal';
import type {CampaignOrderItem} from '~/lib/stripe.types';

/**
 * Example 1: Using the Checkout Modal in a Campaign Page
 */
export function CampaignPageWithCheckout() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CampaignOrderItem[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Example campaign data
  const campaign = {
    id: 'gid://shopify/Product/10058503946559',
    name: 'Support Our Cause Campaign',
    image: '/campaign-image.jpg',
    price: 6.99,
    variantId: 'gid://shopify/ProductVariant/123456789',
  };

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    const items: CampaignOrderItem[] = [{
      id: campaign.variantId,
      name: campaign.name,
      price: campaign.price,
      quantity: quantity,
    }];
    setSelectedItems(items);
    setShowCheckout(true);
  }, [campaign, quantity]);

  // Handle checkout success
  const handleCheckoutSuccess = useCallback((result: any) => {
    console.log('Order completed:', result);
    // Show success message
    alert(`Thank you for your order! Order ID: ${result.orderId}`);
    // Reset state
    setSelectedItems([]);
    setQuantity(1);
  }, []);

  // Handle checkout error
  const handleCheckoutError = useCallback((error: Error) => {
    console.error('Checkout error:', error);
    alert('There was an error processing your order. Please try again.');
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Campaign Details */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
        <p className="text-gray-600 mb-6">
          Help us reach our goal by contributing to this campaign.
        </p>

        {/* Order Form */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">${campaign.price}</p>
              <p className="text-gray-600">per contribution</p>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Contribute ${(campaign.price * quantity).toFixed(2)}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        campaignId={campaign.id}
        campaignName={campaign.name}
        campaignImage={campaign.image}
        items={selectedItems}
        onSuccess={handleCheckoutSuccess}
        onError={handleCheckoutError}
      />
    </div>
  );
}

/**
 * Example 2: Using the Full Page Checkout
 */
export function FullPageCheckoutExample() {
  const [currentView, setCurrentView] = useState<'campaign' | 'checkout'>('campaign');
  const [selectedItems, setSelectedItems] = useState<CampaignOrderItem[]>([]);

  // Example campaign data
  const campaign = {
    id: 'gid://shopify/Product/10058503946559',
    name: 'Community Support Campaign',
    image: '/campaign-image.jpg',
    price: 9.99,
    variantId: 'gid://shopify/ProductVariant/987654321',
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = useCallback((quantity: number) => {
    const items: CampaignOrderItem[] = [{
      id: campaign.variantId,
      name: campaign.name,
      price: campaign.price,
      quantity: quantity,
    }];
    setSelectedItems(items);
    setCurrentView('checkout');
  }, [campaign]);

  // Handle checkout success
  const handleCheckoutSuccess = useCallback((result: any) => {
    console.log('Order completed:', result);
    // Redirect to success page
    window.location.href = `/order/success?id=${result.orderId}`;
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setCurrentView('campaign');
  }, []);

  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        campaignId={campaign.id}
        campaignName={campaign.name}
        campaignImage={campaign.image}
        items={selectedItems}
        onSuccess={handleCheckoutSuccess}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">{campaign.name}</h1>
          <p className="text-xl mb-6">${campaign.price} per contribution</p>
          
          <div className="space-y-4">
            {[1, 5, 10].map(qty => (
              <button
                key={qty}
                onClick={() => handleProceedToCheckout(qty)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-black transition text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Contribute {qty} {qty === 1 ? 'item' : 'items'}</p>
                    <p className="text-gray-600">Support the campaign</p>
                  </div>
                  <p className="text-xl font-bold">${(campaign.price * qty).toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Direct Integration in Campaign Route
 * This shows how to integrate into your existing campaign page
 */
export function CampaignRouteIntegration() {
  const exampleCode = `
// In your campaign route file (e.g., app/routes/($locale).campaigns.$slug.tsx)

import {useState} from 'react';
import {CheckoutModal} from '~/components/checkout/CheckoutModal';
import type {CampaignOrderItem} from '~/lib/stripe.types';

export default function CampaignPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderItems, setOrderItems] = useState<CampaignOrderItem[]>([]);
  
  // Get campaign data from loader
  const {campaign} = useLoaderData<typeof loader>();
  
  const handleOrder = (quantity: number) => {
    // Prepare order items
    const items: CampaignOrderItem[] = [{
      id: campaign.defaultVariant.id,
      name: campaign.name,
      price: parseFloat(campaign.defaultVariant.price.amount),
      quantity: quantity,
    }];
    
    setOrderItems(items);
    setShowCheckout(true);
  };
  
  const handleSuccess = (result: any) => {
    // Handle successful payment
    console.log('Payment successful:', result);
    // You can redirect or show success message
  };
  
  return (
    <>
      {/* Your existing campaign content */}
      <div className="campaign-content">
        <h1>{campaign.name}</h1>
        {/* ... other campaign details ... */}
        
        <button
          onClick={() => handleOrder(1)}
          className="order-button"
        >
          Order Now
        </button>
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        campaignId={campaign.id}
        campaignName={campaign.name}
        campaignImage={campaign.featuredImage?.url}
        items={orderItems}
        onSuccess={handleSuccess}
      />
    </>
  );
}
  `;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Integration Example</h2>
      <p className="mb-4">
        Here's how to integrate the checkout component into your existing campaign route:
      </p>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{exampleCode}</code>
      </pre>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Important Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Make sure to import the CheckoutModal component and types</li>
          <li>The campaignId should be the Shopify product ID</li>
          <li>The variantId should be the specific product variant ID</li>
          <li>Prices should be in dollars (not cents)</li>
          <li>The CheckoutModal handles all Stripe integration automatically</li>
          <li>Success callbacks receive the payment intent and order details</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example 4: Testing the Checkout Flow
 */
export function CheckoutTestComponent() {
  const [showModal, setShowModal] = useState(false);

  // Test data
  const testItems: CampaignOrderItem[] = [
    {
      id: 'gid://shopify/ProductVariant/123456789',
      name: 'Test Campaign Item',
      price: 6.99,
      quantity: 2,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Test Checkout Flow</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Card Numbers:</h3>
          <ul className="space-y-1 text-sm">
            <li>Success: 4242 4242 4242 4242</li>
            <li>Decline: 4000 0000 0000 0002</li>
            <li>Requires Auth: 4000 0025 0000 3155</li>
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            Use any future date for expiry and any 3 digits for CVC
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Test Checkout Modal
        </button>
      </div>

      <CheckoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        campaignId="test-campaign-123"
        campaignName="Test Campaign"
        items={testItems}
        onSuccess={(result) => {
          console.log('Test payment successful:', result);
          alert('Test payment successful! Check console for details.');
        }}
        onError={(error) => {
          console.error('Test payment error:', error);
          alert('Test payment failed! Check console for details.');
        }}
      />
    </div>
  );
}