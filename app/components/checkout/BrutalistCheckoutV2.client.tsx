/**
 * Brutalist-styled Stripe Checkout Component V2
 * Single payment intent created and updated as needed
 */

import {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';
import {StripeProvider} from './StripeProvider.client';
import {CheckoutLoading} from './CheckoutLoading';
import {CheckoutError} from './CheckoutError';
import type {
  StripeCheckoutProps,
  CheckoutFormState,
  CustomerFormData,
  DeliveryConfig,
  CheckoutSummary,
  DeliveryMethod,
} from '~/types/stripe-checkout.types';
import {
  calculateOrderSummary,
  formatPhoneNumber,
} from '~/utils/checkout-validation';
import {DELIVERY_PRICING} from '~/types/stripe-checkout.types';

const US_STATES = [
  {value: '', label: 'Select State'},
  {value: 'AL', label: 'Alabama'},
  {value: 'AK', label: 'Alaska'},
  {value: 'AZ', label: 'Arizona'},
  {value: 'AR', label: 'Arkansas'},
  {value: 'CA', label: 'California'},
  {value: 'CO', label: 'Colorado'},
  {value: 'CT', label: 'Connecticut'},
  {value: 'DE', label: 'Delaware'},
  {value: 'FL', label: 'Florida'},
  {value: 'GA', label: 'Georgia'},
  {value: 'HI', label: 'Hawaii'},
  {value: 'ID', label: 'Idaho'},
  {value: 'IA', label: 'Iowa'},
  {value: 'IL', label: 'Illinois'},
  {value: 'IN', label: 'Indiana'},
  {value: 'KS', label: 'Kansas'},
  {value: 'KY', label: 'Kentucky'},
  {value: 'LA', label: 'Louisiana'},
  {value: 'ME', label: 'Maine'},
  {value: 'MD', label: 'Maryland'},
  {value: 'MA', label: 'Massachusetts'},
  {value: 'MI', label: 'Michigan'},
  {value: 'MN', label: 'Minnesota'},
  {value: 'MS', label: 'Mississippi'},
  {value: 'MO', label: 'Missouri'},
  {value: 'MT', label: 'Montana'},
  {value: 'NE', label: 'Nebraska'},
  {value: 'NV', label: 'Nevada'},
  {value: 'NH', label: 'New Hampshire'},
  {value: 'NJ', label: 'New Jersey'},
  {value: 'NM', label: 'New Mexico'},
  {value: 'NY', label: 'New York'},
  {value: 'NC', label: 'North Carolina'},
  {value: 'ND', label: 'North Dakota'},
  {value: 'OH', label: 'Ohio'},
  {value: 'OK', label: 'Oklahoma'},
  {value: 'OR', label: 'Oregon'},
  {value: 'PA', label: 'Pennsylvania'},
  {value: 'RI', label: 'Rhode Island'},
  {value: 'SC', label: 'South Carolina'},
  {value: 'SD', label: 'South Dakota'},
  {value: 'TN', label: 'Tennessee'},
  {value: 'TX', label: 'Texas'},
  {value: 'UT', label: 'Utah'},
  {value: 'VT', label: 'Vermont'},
  {value: 'VA', label: 'Virginia'},
  {value: 'WA', label: 'Washington'},
  {value: 'WV', label: 'West Virginia'},
  {value: 'WI', label: 'Wisconsin'},
  {value: 'WY', label: 'Wyoming'},
];

function BrutalistCheckoutForm({
  campaignId,
  campaignName,
  campaignImage,
  items,
  onSuccess,
  onError,
  onCancel,
  paymentIntentId,
}: StripeCheckoutProps & {paymentIntentId: string}) {
  const stripe = useStripe();
  const elements = useElements();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const [formState, setFormState] = useState<CheckoutFormState>({
    customer: {
      email: '',
      name: '',
      phone: '',
    },
    delivery: {
      method: 'shipping',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
      },
      instructions: '',
    },
    tipAmount: 0,
    tipPercentage: 0,
    customTip: false,
    items,
    processing: false,
    errors: {},
  });

  const summary: CheckoutSummary = useMemo(() => {
    return calculateOrderSummary(items, formState.delivery.method, formState.tipAmount);
  }, [items, formState.delivery.method, formState.tipAmount]);

  const updateCustomer = useCallback((data: Partial<CustomerFormData>) => {
    setFormState(prev => ({
      ...prev,
      customer: {...prev.customer, ...data},
      errors: {},
    }));
  }, []);

  const updateDelivery = useCallback((data: Partial<DeliveryConfig>) => {
    setFormState(prev => ({
      ...prev,
      delivery: {...prev.delivery, ...data},
      errors: {},
    }));
  }, []);

  const proceedToNextStep = useCallback(() => {
    // Validate based on current step
    let errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      // Validate customer info only
      if (!formState.customer.email || !formState.customer.email.includes('@')) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formState.customer.name || formState.customer.name.length < 2) {
        errors.name = 'Please enter your full name';
      }
    }
    
    if (currentStep === 2) {
      // Validate shipping address
      if (!formState.delivery.address?.line1) {
        errors['address.line1'] = 'Street address is required';
      }
      if (!formState.delivery.address?.city) {
        errors['address.city'] = 'City is required';
      }
      if (!formState.delivery.address?.state) {
        errors['address.state'] = 'State is required';
      }
      if (!formState.delivery.address?.postal_code) {
        errors['address.postal_code'] = 'ZIP code is required';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({...prev, errors}));
      return;
    }
    
    // Update payment intent with customer data when moving from step 1
    if (currentStep === 1 && formState.customer.email && formState.customer.name) {
      fetch('/api/stripe/update-payment-intent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          paymentIntentId,
          customer: formState.customer,
          delivery: formState.delivery,
          tipAmount: formState.tipAmount,
          total: summary.total,
        }),
      }).catch(err => console.error('Failed to update payment intent:', err));
    }
    
    // Update payment intent with final amount when moving to payment step
    if (currentStep === 3) {
      fetch('/api/stripe/update-payment-intent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          paymentIntentId,
          customer: formState.customer,
          delivery: formState.delivery,
          tipAmount: formState.tipAmount,
          total: summary.total,
        }),
      }).catch(err => console.error('Failed to update payment intent:', err));
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, [formState, currentStep, paymentIntentId, summary.total]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const {error, paymentIntent} = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout/success/v2',
          payment_method_data: {
            billing_details: {
              name: formState.customer.name,
              email: formState.customer.email,
              phone: formState.customer.phone,
              address: formState.delivery.address ? {
                line1: formState.delivery.address.line1,
                line2: formState.delivery.address.line2 || undefined,
                city: formState.delivery.address.city,
                state: formState.delivery.address.state,
                postal_code: formState.delivery.address.postal_code,
                country: formState.delivery.address.country || 'US',
              } : undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        setShowError(true);
        if (onError) onError(new Error(error.message));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create Shopify order
        const orderData = {
          paymentIntentId: paymentIntent.id,
          orderData: {
            campaignId,
            campaignName,
            items,
            deliveryMethod: formState.delivery.method,
            deliveryPrice: DELIVERY_PRICING[formState.delivery.method],
            subtotal: summary.subtotal,
            total: summary.total,
            tipAmount: formState.tipAmount,
            customer: {
              ...formState.customer,
              address: formState.delivery.address,
            },
          },
        };

        try {
          const orderResponse = await fetch('/api/stripe/process-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData),
          });
          
          const orderResult = await orderResponse.json();
          
          if (!orderResult.success) {
            console.error('Failed to create Shopify order:', orderResult.error);
          } else if (orderResult.orderName) {
            // Redirect to success page with order name and campaign data
            const successUrl = new URL('/checkout/success/v2', window.location.origin);
            successUrl.searchParams.set('payment_intent', paymentIntent.id);
            successUrl.searchParams.set('order_name', orderResult.orderName);
            successUrl.searchParams.set('campaign_id', campaignId);
            successUrl.searchParams.set('total', summary.total.toString());
            successUrl.searchParams.set('email', formState.customer.email);
            window.location.href = successUrl.toString();
            return; // Exit early to prevent double redirect
          }
        } catch (orderError) {
          console.error('Error creating Shopify order:', orderError);
        }

        // Fallback redirect without order name if something went wrong
        const fallbackUrl = new URL('/checkout/success/v2', window.location.origin);
        fallbackUrl.searchParams.set('payment_intent', paymentIntent.id);
        fallbackUrl.searchParams.set('campaign_id', campaignId);
        fallbackUrl.searchParams.set('total', summary.total.toString());
        window.location.href = fallbackUrl.toString();
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (error: any) {
      setPaymentError('Failed to process payment');
      setShowError(true);
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, formState, summary, campaignId, campaignName, items, onSuccess, onError]);

  // Show error component if payment failed
  if (showError) {
    return (
      <CheckoutError
        type="payment_failed"
        errorMessage={paymentError || 'Payment failed'}
        onRetry={() => {
          setShowError(false);
          setPaymentError(null);
          setIsProcessing(false);
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3">
      {/* Main Form Section */}
      <div className="lg:col-span-2 p-8 lg:p-12 lg:border-r-2 lg:border-black">
        {/* Progress Indicator - Brutalist Style */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2">
            {['INFO', 'SHIPPING', 'TIP', 'PAYMENT'].map((step, index) => (
              <button
                key={step}
                onClick={() => currentStep > index + 1 && setCurrentStep(index + 1)}
                disabled={currentStep <= index + 1}
                className={`
                  p-2 md:p-3 border-2 md:border-2 font-black text-xs md:text-sm text-center transition-colors
                  ${currentStep > index + 1 
                    ? 'bg-black text-white border-black cursor-pointer hover:bg-gray-800' 
                    : currentStep === index + 1
                    ? 'bg-black text-white border-black cursor-default'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'}
                `}
              >
                <div className="text-lg md:text-2xl mb-1">
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <div className="uppercase">{step}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Customer Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              CUSTOMER INFORMATION
            </h2>
            
            <div>
              <label className="block text-sm font-black mb-2 tracking-wide">
                EMAIL ADDRESS *
              </label>
              <input
                type="email"
                value={formState.customer.email}
                onChange={(e) => updateCustomer({email: e.target.value})}
                className="w-full p-4 border-2 border-black text-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="your@email.com"
              />
              {formState.errors.email && (
                <p className="text-red-600 font-bold mt-2">{formState.errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black mb-2 tracking-wide">
                FULL NAME *
              </label>
              <input
                type="text"
                value={formState.customer.name}
                onChange={(e) => updateCustomer({name: e.target.value})}
                className="w-full p-4 border-2 border-black text-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="John Doe"
              />
              {formState.errors.name && (
                <p className="text-red-600 font-bold mt-2">{formState.errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black mb-2 tracking-wide">
                PHONE (OPTIONAL)
              </label>
              <input
                type="tel"
                value={formState.customer.phone}
                onChange={(e) => updateCustomer({phone: formatPhoneNumber(e.target.value)})}
                className="w-full p-4 border-2 border-black text-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="(555) 555-5555"
              />
            </div>

            <button
              onClick={proceedToNextStep}
              className="w-full bg-black text-white py-4 px-6 font-black text-lg rounded-none hover:bg-gray-800 transition-colors"
            >
              CONTINUE TO SHIPPING →
            </button>
          </div>
        )}

        {/* Step 2: Delivery */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              SHIPPING INFORMATION
            </h2>
            
            <div className="p-6 border-2 border-black bg-black text-white">
              <div className="flex items-center justify-between">
                <span className="font-black text-lg">FLAT RATE SHIPPING</span>
                <span className="font-black text-lg">$8.00</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-lg">SHIPPING ADDRESS</h3>
              
              <input
                type="text"
                value={formState.delivery.address?.line1 || ''}
                onChange={(e) => updateDelivery({
                  address: {...formState.delivery.address!, line1: e.target.value}
                })}
                className="w-full p-4 border-2 border-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="Street Address"
              />
              
              <input
                type="text"
                value={formState.delivery.address?.line2 || ''}
                onChange={(e) => updateDelivery({
                  address: {...formState.delivery.address!, line2: e.target.value}
                })}
                className="w-full p-4 border-2 border-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="Apartment, suite, unit, etc. (optional)"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formState.delivery.address?.city || ''}
                  onChange={(e) => updateDelivery({
                    address: {...formState.delivery.address!, city: e.target.value}
                  })}
                  className="p-4 border-2 border-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                  placeholder="City"
                />
                
                <select
                  value={formState.delivery.address?.state || ''}
                  onChange={(e) => updateDelivery({
                    address: {...formState.delivery.address!, state: e.target.value}
                  })}
                  className="p-4 border-2 border-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                >
                  {US_STATES.map(state => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={formState.delivery.address?.postal_code || ''}
                onChange={(e) => updateDelivery({
                  address: {...formState.delivery.address!, postal_code: e.target.value}
                })}
                className="w-full p-4 border-2 border-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="ZIP Code"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                className="flex-1 bg-white text-black border-2 border-black py-4 px-6 font-black text-lg rounded-none hover:bg-gray-100 transition-colors"
              >
                ← BACK
              </button>
              <button
                onClick={proceedToNextStep}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg rounded-none hover:bg-gray-800 transition-colors"
              >
                CONTINUE TO TIP →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tip */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              ADD A TIP
            </h2>
            
            <p className="font-bold">Support the campaign with an optional tip:</p>
            
            <div className="grid grid-cols-2 gap-4">
              {[0, 10, 15, 20].map(percent => (
                <button
                  key={percent}
                  onClick={() => {
                    const tipAmount = Math.round(summary.subtotal * percent) / 100;
                    setFormState(prev => ({
                      ...prev,
                      tipAmount,
                      tipPercentage: percent,
                      customTip: false,
                    }));
                  }}
                  className={`p-4 border-2 font-black text-lg transition-colors ${
                    formState.tipPercentage === percent && !formState.customTip
                      ? 'border-black bg-black text-white'
                      : 'border-black hover:bg-gray-100'
                  }`}
                >
                  {percent === 0 ? 'NO TIP' : `${percent}% ($${(Math.round(summary.subtotal * percent) / 100).toFixed(2)})`}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black mb-2 tracking-wide">
                CUSTOM TIP AMOUNT
              </label>
              <div className="flex gap-2">
                <span className="p-4 border-2 border-black font-black">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.customTip ? formState.tipAmount : ''}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setFormState(prev => ({
                      ...prev,
                      tipAmount: amount,
                      tipPercentage: 0,
                      customTip: true,
                    }));
                  }}
                  onFocus={() => {
                    setFormState(prev => ({
                      ...prev,
                      customTip: true,
                      tipPercentage: 0,
                    }));
                  }}
                  className="flex-1 p-4 border-2 border-black text-black font-bold rounded-none focus:outline-none focus:ring-4 focus:ring-gray-400"
                  placeholder="Enter custom amount"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                className="flex-1 bg-white text-black border-2 border-black py-4 px-6 font-black text-lg rounded-none hover:bg-gray-100 transition-colors"
              >
                ← BACK
              </button>
              <button
                onClick={proceedToNextStep}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg rounded-none hover:bg-gray-800 transition-colors"
              >
                CONTINUE TO PAYMENT →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && (
          <div className="space-y-6 relative">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              PAYMENT
            </h2>
            
            <div className="p-6 border-2 border-black bg-white">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card'],
                }}
              />
            </div>

            {paymentError && (
              <div className="p-4 bg-red-100 border-2 border-red-600">
                <p className="text-red-600 font-bold">{paymentError}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                disabled={isProcessing}
                className="flex-1 bg-white text-black border-2 border-black py-4 px-6 font-black text-lg rounded-none hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← BACK
              </button>
              <button
                onClick={handleSubmit}
                disabled={!stripe || isProcessing}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg rounded-none hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2">🍪</span> PROCESSING...
                  </span>
                ) : (
                  `PAY $${summary.total.toFixed(2)}`
                )}
              </button>
            </div>
            
            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="text-6xl animate-bounce mb-4">🍪</div>
                  <p className="font-black text-xl">BAKING YOUR ORDER...</p>
                  <p className="font-bold mt-2">Please don't refresh the page</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="p-8 lg:p-12 bg-gray-100">
        <h3 className="text-2xl font-black mb-6 border-b-4 border-black pb-2">
          ORDER SUMMARY
        </h3>
        
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div>
                <p className="font-bold">{item.name}</p>
                {item.variant && <p className="text-sm text-gray-600">{item.variant}</p>}
                <p className="text-sm">QTY: {item.quantity}</p>
              </div>
              <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="border-t-4 border-black pt-4 space-y-2">
          <div className="flex justify-between">
            <p className="font-bold">SUBTOTAL</p>
            <p className="font-bold">${summary.subtotal.toFixed(2)}</p>
          </div>
          <div className="flex justify-between">
            <p className="font-bold">SHIPPING</p>
            <p className="font-bold">${summary.deliveryPrice.toFixed(2)}</p>
          </div>
          {summary.tipAmount > 0 && (
            <div className="flex justify-between">
              <p className="font-bold">TIP</p>
              <p className="font-bold">${summary.tipAmount.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="border-t-4 border-black mt-4 pt-4">
          <div className="flex justify-between">
            <p className="text-xl font-black">TOTAL</p>
            <p className="text-xl font-black">${summary.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrutalistCheckoutV2(props: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Calculate initial totals
  const subtotal = props.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const initialTotal = subtotal + DELIVERY_PRICING.shipping; // Flat rate shipping

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    // Create payment intent on mount
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            campaignId: props.campaignId,
            campaignName: props.campaignName,
            items: props.items,
            deliveryMethod: 'shipping',
            deliveryPrice: DELIVERY_PRICING.shipping,
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
          setPaymentIntentId(data.paymentIntentId);
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
  }, []); // Empty dependency array to run only once

  if (isLoading) {
    return <CheckoutLoading stage="payment" campaignName={props.campaignName} />;
  }

  if (error) {
    return (
      <CheckoutError
        type="system_error"
        errorMessage={error}
        onRetry={() => window.location.reload()}
        onCancel={props.onCancel}
      />
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <div className="p-8">
        <div className="p-6 bg-yellow-50 border-2 border-yellow-600">
          <p className="text-yellow-600 font-bold">Waiting for payment system...</p>
        </div>
      </div>
    );
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <BrutalistCheckoutForm {...props} paymentIntentId={paymentIntentId} />
    </StripeProvider>
  );
}