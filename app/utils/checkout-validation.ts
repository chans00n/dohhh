/**
 * Checkout Form Validation Utilities
 */

import type {
  ValidationRules,
  CustomerFormData,
  DeliveryAddress,
  CheckoutFormState,
} from '~/types/stripe-checkout.types';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex (US format)
 */
const PHONE_REGEX = /^(\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

/**
 * Postal code validation regex (US format)
 */
const POSTAL_CODE_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Validate a single field value
 */
export function validateField(
  value: any,
  rules: ValidationRules,
  fieldName: string
): string | null {
  // Check required
  if (rules.required && !value) {
    return `${fieldName} is required`;
  }

  // Skip other validations if empty and not required
  if (!value) return null;

  const stringValue = String(value).trim();

  // Check email format
  if (rules.email && !EMAIL_REGEX.test(stringValue)) {
    return 'Please enter a valid email address';
  }

  // Check phone format
  if (rules.phone && !PHONE_REGEX.test(stringValue)) {
    return 'Please enter a valid phone number';
  }

  // Check min length
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Check max length
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `${fieldName} must be no more than ${rules.maxLength} characters`;
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return `${fieldName} format is invalid`;
  }

  return null;
}

/**
 * Validate customer information
 */
export function validateCustomer(customer: CustomerFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate email
  const emailError = validateField(
    customer.email,
    {required: true, email: true},
    'Email'
  );
  if (emailError) errors.email = emailError;

  // Validate name
  const nameError = validateField(
    customer.name,
    {required: true, minLength: 2, maxLength: 100},
    'Name'
  );
  if (nameError) errors.name = nameError;

  // Validate phone (required)
  const phoneError = validateField(
    customer.phone,
    {required: true, phone: true},
    'Phone'
  );
  if (phoneError) errors.phone = phoneError;

  return errors;
}

/**
 * Validate delivery address
 */
export function validateDeliveryAddress(address: DeliveryAddress): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate street address
  const line1Error = validateField(
    address.line1,
    {required: true, minLength: 3, maxLength: 200},
    'Street address'
  );
  if (line1Error) errors.line1 = line1Error;

  // Validate city
  const cityError = validateField(
    address.city,
    {required: true, minLength: 2, maxLength: 100},
    'City'
  );
  if (cityError) errors.city = cityError;

  // Validate state
  const stateError = validateField(
    address.state,
    {required: true, minLength: 2, maxLength: 2},
    'State'
  );
  if (stateError) errors.state = stateError;

  // Validate postal code
  const postalError = validateField(
    address.postal_code,
    {required: true, pattern: POSTAL_CODE_REGEX},
    'Postal code'
  );
  if (postalError) errors.postal_code = postalError;

  return errors;
}

/**
 * Validate entire checkout form
 */
export function validateCheckoutForm(formState: CheckoutFormState): Record<string, string> {
  let errors: Record<string, string> = {};

  // Validate customer info
  const customerErrors = validateCustomer(formState.customer);
  errors = {...errors, ...customerErrors};

  // Validate delivery address if shipping or local delivery
  if (formState.delivery.method !== 'pickup' && formState.delivery.address) {
    const addressErrors = validateDeliveryAddress(formState.delivery.address);
    Object.keys(addressErrors).forEach(key => {
      errors[`address.${key}`] = addressErrors[key];
    });
  } else if (formState.delivery.method !== 'pickup' && !formState.delivery.address) {
    errors['delivery.address'] = 'Delivery address is required';
  }

  // Validate items
  if (!formState.items || formState.items.length === 0) {
    errors.items = 'No items in cart';
  }

  // Validate tip amount
  if (formState.tipAmount < 0) {
    errors.tipAmount = 'Tip amount cannot be negative';
  }

  return errors;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    // Remove country code
    return formatPhoneNumber(cleaned.substring(1));
  }
  
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
}

/**
 * Format postal code
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  
  return cleaned.substring(0, 5);
}

/**
 * Sanitize form input
 */
export function sanitizeInput(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 500); // Limit length
}

/**
 * Check if form is valid
 */
export function isFormValid(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0;
}

/**
 * Get field error message
 */
export function getFieldError(
  errors: Record<string, string>,
  fieldName: string
): string | undefined {
  return errors[fieldName];
}

/**
 * Calculate order summary
 */
export function calculateOrderSummary(
  items: any[],
  deliveryMethod: string,
  tipAmount: number
) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // We only support flat rate shipping now at $8
  const deliveryPrice = deliveryMethod === 'shipping' ? 8 : 0;
  
  const total = subtotal + deliveryPrice + tipAmount;
  
  return {
    subtotal,
    deliveryPrice,
    deliveryFee: deliveryPrice, // Keep for backwards compatibility
    tip: tipAmount,
    tipAmount,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}