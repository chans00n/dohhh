/**
 * Brutalist-styled Stripe Checkout Component
 */

import {useState, useEffect, useCallback, useMemo} from 'react';
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';
import type {
  StripeCheckoutProps,
  CheckoutFormState,
  CustomerFormData,
  DeliveryConfig,
  CheckoutSummary,
  DeliveryMethod,
} from '~/types/stripe-checkout.types';
import {
  validateCheckoutForm,
  calculateOrderSummary,
  formatPhoneNumber,
} from '~/utils/checkout-validation';
import {DELIVERY_PRICING, DEFAULT_TIP_OPTIONS} from '~/types/stripe-checkout.types';

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
  {value: 'IL', label: 'Illinois'},
  {value: 'IN', label: 'Indiana'},
  {value: 'IA', label: 'Iowa'},
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

export function BrutalistCheckout({
  campaignId,
  campaignName,
  campaignImage,
  items,
  onSuccess,
  onError,
  onCancel,
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
    const errors = validateCheckoutForm(formState, currentStep);
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({...prev, errors}));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, [formState, currentStep]);

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
          return_url: window.location.origin + '/checkout/success',
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
        if (onError) onError(new Error(error.message));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (error: any) {
      setPaymentError('Failed to process payment');
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, formState, onSuccess, onError]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3">
      {/* Main Form Section */}
      <div className="lg:col-span-2 p-8 lg:p-12 border-r-4 border-black">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['INFO', 'DELIVERY', 'TIP', 'PAYMENT'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-10 h-10 border-4 flex items-center justify-center font-black
                  ${currentStep > index + 1 
                    ? 'bg-black text-white border-black' 
                    : currentStep === index + 1
                    ? 'bg-white text-black border-black'
                    : 'bg-gray-200 text-gray-400 border-gray-400'}
                `}>
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-2 font-black text-sm ${
                  currentStep >= index + 1 ? 'text-black' : 'text-gray-400'
                }`}>{step}</span>
              </div>
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
                className="w-full p-4 border-4 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
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
                className="w-full p-4 border-4 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
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
                className="w-full p-4 border-4 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
                placeholder="(555) 555-5555"
              />
            </div>

            <button
              onClick={proceedToNextStep}
              className="w-full bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors"
            >
              CONTINUE TO DELIVERY →
            </button>
          </div>
        )}

        {/* Step 2: Delivery */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              SHIPPING INFORMATION
            </h2>
            
            <div className="p-6 border-4 border-black bg-black text-white">
              <div className="flex items-center justify-between">
                <span className="font-black text-lg">FLAT RATE SHIPPING</span>
                <span className="font-black text-lg">$15.00</span>
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
                  className="w-full p-4 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
                  placeholder="Street Address"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formState.delivery.address?.city || ''}
                    onChange={(e) => updateDelivery({
                      address: {...formState.delivery.address!, city: e.target.value}
                    })}
                    className="p-4 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
                    placeholder="City"
                  />
                  
                  <select
                    value={formState.delivery.address?.state || ''}
                    onChange={(e) => updateDelivery({
                      address: {...formState.delivery.address!, state: e.target.value}
                    })}
                    className="p-4 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
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
                  className="w-full p-4 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
                  placeholder="ZIP Code"
                />
              </div>

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                className="flex-1 bg-white text-black border-4 border-black py-4 px-6 font-black text-lg hover:bg-gray-100 transition-colors"
              >
                ← BACK
              </button>
              <button
                onClick={proceedToNextStep}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors"
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
                  className={`p-4 border-4 font-black text-lg transition-colors ${
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
                <span className="p-4 border-4 border-black font-black">$</span>
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
                  className="flex-1 p-4 border-4 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-gray-400"
                  placeholder="Enter custom amount"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                className="flex-1 bg-white text-black border-4 border-black py-4 px-6 font-black text-lg hover:bg-gray-100 transition-colors"
              >
                ← BACK
              </button>
              <button
                onClick={proceedToNextStep}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors"
              >
                CONTINUE TO PAYMENT →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black border-b-4 border-black pb-2 mb-6">
              PAYMENT
            </h2>
            
            <div className="p-6 border-4 border-black bg-white">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card'],
                }}
              />
            </div>

            {paymentError && (
              <div className="p-4 bg-red-100 border-4 border-red-600">
                <p className="text-red-600 font-bold">{paymentError}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={goToPreviousStep}
                disabled={isProcessing}
                className="flex-1 bg-white text-black border-4 border-black py-4 px-6 font-black text-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ← BACK
              </button>
              <button
                onClick={handleSubmit}
                disabled={!stripe || isProcessing}
                className="flex-1 bg-black text-white py-4 px-6 font-black text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'PROCESSING...' : `PAY $${summary.total.toFixed(2)}`}
              </button>
            </div>
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