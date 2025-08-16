/**
 * TypeScript Definitions for Stripe Checkout Component
 */

import type {Stripe, StripeElements} from '@stripe/stripe-js';
import type {CampaignOrderItem} from '~/lib/stripe.types';

/**
 * Customer Information Form Data
 */
export interface CustomerFormData {
  email: string;
  name: string;
  phone?: string;
}

/**
 * Delivery Address Form Data
 */
export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Delivery Method Options
 */
export type DeliveryMethod = 'shipping';

/**
 * Delivery Configuration
 */
export interface DeliveryConfig {
  method: DeliveryMethod;
  address?: DeliveryAddress;
  instructions?: string;
}

/**
 * Tip Amount Options
 */
export interface TipOption {
  label: string;
  value: number; // In dollars
  percentage?: number; // Optional percentage display
}

/**
 * Checkout Form State
 */
export interface CheckoutFormState {
  customer: CustomerFormData;
  delivery: DeliveryConfig;
  tipAmount: number;
  tipPercentage?: number;
  customTip?: boolean;
  items: CampaignOrderItem[];
  processing: boolean;
  errors: Record<string, string>;
}

/**
 * Checkout Component Props
 */
export interface StripeCheckoutProps {
  campaignId: string;
  campaignName: string;
  campaignImage?: string;
  items: CampaignOrderItem[];
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

/**
 * Stripe Provider Props
 */
export interface StripeProviderProps {
  children: React.ReactNode;
  publishableKey?: string;
}

/**
 * Payment Form Props
 */
export interface PaymentFormProps {
  stripe: Stripe | null;
  elements: StripeElements | null;
  clientSecret: string;
  formData: CheckoutFormState;
  onSubmit: () => Promise<void>;
}

/**
 * Checkout Summary
 */
export interface CheckoutSummary {
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  itemCount: number;
}

/**
 * Validation Rules
 */
export interface ValidationRules {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

/**
 * Field Validation Configuration
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'radio';
  rules: ValidationRules;
  placeholder?: string;
  options?: Array<{value: string; label: string}>;
}

/**
 * Checkout Step Configuration
 */
export interface CheckoutStep {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  isComplete: (data: CheckoutFormState) => boolean;
}

/**
 * Delivery Pricing Configuration
 */
export const DELIVERY_PRICING: Record<DeliveryMethod, number> = {
  shipping: 8,
};

/**
 * Default Tip Options
 */
export const DEFAULT_TIP_OPTIONS: TipOption[] = [
  {label: 'No Tip', value: 0},
  {label: '10%', value: 0, percentage: 10},
  {label: '15%', value: 0, percentage: 15},
  {label: '20%', value: 0, percentage: 20},
  {label: 'Custom', value: -1}, // -1 indicates custom amount
];

/**
 * Checkout Error Types
 */
export enum CheckoutError {
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CARD_DECLINED = 'CARD_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
}

/**
 * Error Messages
 */
export const ERROR_MESSAGES: Record<CheckoutError, string> = {
  [CheckoutError.PAYMENT_FAILED]: 'Payment failed. Please try again.',
  [CheckoutError.VALIDATION_ERROR]: 'Please check your information and try again.',
  [CheckoutError.NETWORK_ERROR]: 'Network error. Please check your connection.',
  [CheckoutError.CARD_DECLINED]: 'Your card was declined.',
  [CheckoutError.INSUFFICIENT_FUNDS]: 'Insufficient funds.',
  [CheckoutError.PROCESSING_ERROR]: 'Error processing payment. Please try again.',
};

/**
 * Checkout Status
 */
export type CheckoutStatus = 
  | 'idle'
  | 'loading'
  | 'ready'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

/**
 * Checkout Context Value
 */
export interface CheckoutContextValue {
  status: CheckoutStatus;
  formState: CheckoutFormState;
  summary: CheckoutSummary;
  updateCustomer: (data: Partial<CustomerFormData>) => void;
  updateDelivery: (data: Partial<DeliveryConfig>) => void;
  updateTip: (amount: number) => void;
  validateField: (field: string, value: any) => string | null;
  submitPayment: () => Promise<void>;
  reset: () => void;
}