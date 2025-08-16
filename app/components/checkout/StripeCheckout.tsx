/**
 * Main Stripe Checkout Component
 * Provides a complete checkout experience with customer info, delivery, tips, and payment
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
  TipOption,
} from '~/types/stripe-checkout.types';
import {
  validateCheckoutForm,
  calculateOrderSummary,
  formatPhoneNumber,
  sanitizeInput,
} from '~/utils/checkout-validation';
import {DELIVERY_PRICING, DEFAULT_TIP_OPTIONS} from '~/types/stripe-checkout.types';

/**
 * US States for dropdown
 */
const US_STATES = [
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

export function StripeCheckout({
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

  // Component state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<string>('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Form state
  const [formState, setFormState] = useState<CheckoutFormState>({
    customer: {
      email: '',
      name: '',
      phone: '',
    },
    delivery: {
      method: 'pickup',
      address: undefined,
      instructions: '',
    },
    tipAmount: 0,
    items,
    processing: false,
    errors: {},
  });

  // Calculate order summary
  const summary: CheckoutSummary = useMemo(() => {
    return calculateOrderSummary(items, formState.delivery.method, formState.tipAmount);
  }, [items, formState.delivery.method, formState.tipAmount]);

  // Calculate tip options with actual amounts
  const tipOptions: TipOption[] = useMemo(() => {
    return DEFAULT_TIP_OPTIONS.map(option => {
      if (option.percentage) {
        return {
          ...option,
          value: Number((summary.subtotal * option.percentage / 100).toFixed(2)),
        };
      }
      return option;
    });
  }, [summary.subtotal]);

  // Update customer information
  const updateCustomer = useCallback((data: Partial<CustomerFormData>) => {
    setFormState(prev => ({
      ...prev,
      customer: {...prev.customer, ...data},
      errors: {},
    }));
  }, []);

  // Update delivery configuration
  const updateDelivery = useCallback((data: Partial<DeliveryConfig>) => {
    setFormState(prev => ({
      ...prev,
      delivery: {...prev.delivery, ...data},
      errors: {},
    }));
  }, []);

  // Update delivery method
  const updateDeliveryMethod = useCallback((method: DeliveryMethod) => {
    setFormState(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        method,
        address: method === 'pickup' ? undefined : (prev.delivery.address || {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'US',
        }),
      },
      errors: {},
    }));
  }, []);

  // Update tip amount
  const updateTip = useCallback((amount: number) => {
    setFormState(prev => ({
      ...prev,
      tipAmount: amount,
    }));
    setShowCustomTip(false);
    setCustomTipAmount('');
  }, []);

  // Handle custom tip
  const handleCustomTip = useCallback(() => {
    const amount = parseFloat(customTipAmount);
    if (!isNaN(amount) && amount >= 0) {
      updateTip(amount);
    }
  }, [customTipAmount, updateTip]);

  // Create payment intent
  useEffect(() => {
    if (!clientSecret && summary.total > 0) {
      fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          campaignId,
          campaignName,
          items,
          deliveryMethod: formState.delivery.method,
          deliveryPrice: DELIVERY_PRICING[formState.delivery.method],
          subtotal: summary.subtotal,
          total: summary.total,
          customer: formState.customer,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error(data.error || 'Failed to create payment intent');
          }
        })
        .catch(error => {
          console.error('Error creating payment intent:', error);
          setPaymentError('Failed to initialize payment. Please try again.');
          if (onError) onError(error);
        });
    }
  }, [clientSecret, summary.total, campaignId, campaignName, items, formState, onError]);

  // Validate and proceed to next step
  const proceedToNextStep = useCallback(() => {
    const errors = validateCheckoutForm(formState);
    
    if (currentStep === 1) {
      // Validate customer info for step 1
      const customerErrors: Record<string, string> = {};
      if (errors.email) customerErrors.email = errors.email;
      if (errors.name) customerErrors.name = errors.name;
      if (errors.phone) customerErrors.phone = errors.phone;
      
      if (Object.keys(customerErrors).length > 0) {
        setFormState(prev => ({...prev, errors: customerErrors}));
        return;
      }
    }
    
    if (currentStep === 2 && formState.delivery.method !== 'pickup') {
      // Validate delivery address for step 2
      const addressErrors: Record<string, string> = {};
      Object.keys(errors).forEach(key => {
        if (key.startsWith('address.')) {
          addressErrors[key] = errors[key];
        }
      });
      
      if (Object.keys(addressErrors).length > 0) {
        setFormState(prev => ({...prev, errors: addressErrors}));
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, [currentStep, formState]);

  // Submit payment
  const submitPayment = useCallback(async () => {
    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not ready. Please wait...');
      return;
    }

    // Final validation
    const errors = validateCheckoutForm(formState);
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({...prev, errors}));
      setPaymentError('Please complete all required fields');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm payment with Stripe
      const {error, paymentIntent} = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: sanitizeInput(formState.customer.name),
              email: sanitizeInput(formState.customer.email),
              phone: formState.customer.phone ? sanitizeInput(formState.customer.phone) : undefined,
              address: formState.delivery.address ? {
                line1: sanitizeInput(formState.delivery.address.line1),
                line2: formState.delivery.address.line2 ? sanitizeInput(formState.delivery.address.line2) : undefined,
                city: sanitizeInput(formState.delivery.address.city),
                state: sanitizeInput(formState.delivery.address.state),
                postal_code: sanitizeInput(formState.delivery.address.postal_code),
                country: formState.delivery.address.country,
              } : undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle payment errors
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setPaymentError(error.message || 'Payment failed');
        } else {
          setPaymentError('An unexpected error occurred');
        }
        console.error('Payment error:', error);
        if (onError) onError(new Error(error.message));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        console.log('Payment successful:', paymentIntent.id);
        
        // Process order creation
        const orderResponse = await fetch('/api/stripe/process-order', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            orderData: {
              campaignId,
              campaignName,
              items,
              deliveryMethod: formState.delivery.method,
              deliveryPrice: DELIVERY_PRICING[formState.delivery.method],
              subtotal: summary.subtotal,
              total: summary.total,
              customer: {
                ...formState.customer,
                address: formState.delivery.address,
              },
            },
          }),
        });

        const orderResult = await orderResponse.json();
        
        if (orderResult.success) {
          if (onSuccess) onSuccess({...paymentIntent, orderId: orderResult.orderId});
        } else {
          console.error('Order creation failed:', orderResult.error);
          // Payment succeeded but order creation failed - still show success
          // The webhook will retry order creation
          if (onSuccess) onSuccess(paymentIntent);
        }
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      setPaymentError('Failed to process payment. Please try again.');
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, clientSecret, formState, campaignId, campaignName, items, summary, onSuccess, onError]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white" style={{backgroundColor: 'white'}}>
      {/* Campaign Header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {campaignImage && (
            <img
              src={campaignImage}
              alt={campaignName}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{campaignName}</h2>
            <p className="text-gray-600">Complete your order</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Customer Info', 'Delivery', 'Tip', 'Payment'].map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index < 3 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > index + 1
                    ? 'bg-green-500 text-white'
                    : currentStep === index + 1
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{step}</span>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Customer Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formState.customer.email}
                  onChange={(e) => updateCustomer({email: e.target.value})}
                  className={`w-full p-3 border rounded-lg ${
                    formState.errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
                {formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{formState.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formState.customer.name}
                  onChange={(e) => updateCustomer({name: e.target.value})}
                  className={`w-full p-3 border rounded-lg ${
                    formState.errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{formState.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formState.customer.phone}
                  onChange={(e) => updateCustomer({phone: formatPhoneNumber(e.target.value)})}
                  className={`w-full p-3 border rounded-lg ${
                    formState.errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(555) 555-5555"
                />
                {formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formState.errors.phone}</p>
                )}
              </div>

              <button
                onClick={proceedToNextStep}
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Continue to Delivery
              </button>
            </div>
          )}

          {/* Step 2: Delivery Method */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Delivery Method</h3>
              
              <div className="space-y-3">
                {(['pickup', 'local_delivery', 'shipping'] as DeliveryMethod[]).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                      formState.delivery.method === method
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="delivery"
                        value={method}
                        checked={formState.delivery.method === method}
                        onChange={() => updateDeliveryMethod(method)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">
                          {method === 'pickup' && 'Store Pickup'}
                          {method === 'local_delivery' && 'Local Delivery'}
                          {method === 'shipping' && 'Shipping'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {method === 'pickup' && 'Pick up at our location'}
                          {method === 'local_delivery' && 'Delivery within 10 miles'}
                          {method === 'shipping' && 'Standard shipping'}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {DELIVERY_PRICING[method] === 0 ? 'Free' : `$${DELIVERY_PRICING[method]}`}
                    </span>
                  </label>
                ))}
              </div>

              {/* Delivery Address (for local_delivery and shipping) */}
              {formState.delivery.method !== 'pickup' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Delivery Address</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formState.delivery.address?.line1 || ''}
                      onChange={(e) => updateDelivery({
                        address: {...formState.delivery.address!, line1: e.target.value}
                      })}
                      className={`w-full p-3 border rounded-lg ${
                        formState.errors['address.line1'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123 Main St"
                    />
                    {formState.errors['address.line1'] && (
                      <p className="text-red-500 text-sm mt-1">{formState.errors['address.line1']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apartment, Suite, etc. (Optional)
                    </label>
                    <input
                      type="text"
                      value={formState.delivery.address?.line2 || ''}
                      onChange={(e) => updateDelivery({
                        address: {...formState.delivery.address!, line2: e.target.value}
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formState.delivery.address?.city || ''}
                        onChange={(e) => updateDelivery({
                          address: {...formState.delivery.address!, city: e.target.value}
                        })}
                        className={`w-full p-3 border rounded-lg ${
                          formState.errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Los Angeles"
                      />
                      {formState.errors['address.city'] && (
                        <p className="text-red-500 text-sm mt-1">{formState.errors['address.city']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        State *
                      </label>
                      <select
                        value={formState.delivery.address?.state || ''}
                        onChange={(e) => updateDelivery({
                          address: {...formState.delivery.address!, state: e.target.value}
                        })}
                        className={`w-full p-3 border rounded-lg ${
                          formState.errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(state => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                      {formState.errors['address.state'] && (
                        <p className="text-red-500 text-sm mt-1">{formState.errors['address.state']}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formState.delivery.address?.postal_code || ''}
                      onChange={(e) => updateDelivery({
                        address: {...formState.delivery.address!, postal_code: e.target.value}
                      })}
                      className={`w-full p-3 border rounded-lg ${
                        formState.errors['address.postal_code'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="90001"
                      maxLength={10}
                    />
                    {formState.errors['address.postal_code'] && (
                      <p className="text-red-500 text-sm mt-1">{formState.errors['address.postal_code']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      value={formState.delivery.instructions || ''}
                      onChange={(e) => updateDelivery({instructions: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Leave at front door, ring doorbell, etc."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={proceedToNextStep}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Continue to Tip
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tip Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Add a Tip</h3>
              <p className="text-gray-600">
                Your tip helps support the campaign and shows appreciation for the service.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {tipOptions.filter(opt => opt.value >= 0).map((option) => (
                  <button
                    key={option.label}
                    onClick={() => updateTip(option.value)}
                    className={`p-4 border rounded-lg font-medium transition ${
                      formState.tipAmount === option.value && !showCustomTip
                        ? 'border-black bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div>{option.label}</div>
                    {option.value > 0 && (
                      <div className="text-sm text-gray-600">${option.value.toFixed(2)}</div>
                    )}
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    setShowCustomTip(true);
                    setFormState(prev => ({...prev, tipAmount: 0}));
                  }}
                  className={`p-4 border rounded-lg font-medium transition ${
                    showCustomTip
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Custom Amount
                </button>
              </div>

              {showCustomTip && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">
                      Enter Custom Tip Amount
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customTipAmount}
                        onChange={(e) => setCustomTipAmount(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-r-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCustomTip}
                    className="self-end px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
                  >
                    Apply
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={proceedToNextStep}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && clientSecret && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">Payment Information</h3>
              
              <div className="p-4 bg-white border border-gray-200 rounded-lg" style={{backgroundColor: 'white'}}>
                <PaymentElement
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                  }}
                />
              </div>

              {paymentError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{paymentError}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={submitPayment}
                  disabled={!stripe || !elements || isProcessing}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Pay $${summary.total.toFixed(2)}`}
                </button>
              </div>

              {onCancel && (
                <button
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="w-full text-gray-600 underline hover:text-gray-800 transition"
                >
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6" style={{backgroundColor: 'white'}}>
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            {/* Items */}
            <div className="space-y-3 pb-4 border-b">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${summary.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span>
                  {summary.deliveryFee === 0 ? 'Free' : `$${summary.deliveryFee.toFixed(2)}`}
                </span>
              </div>
              
              {summary.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip</span>
                  <span>${summary.tip.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${summary.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Campaign Info */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-gray-600">
                Contributing to: <span className="font-medium">{campaignName}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}