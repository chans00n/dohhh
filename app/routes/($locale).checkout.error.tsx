import {useSearchParams} from 'react-router';
import {CheckoutError} from '~/components/checkout/CheckoutError';

export default function CheckoutErrorPage() {
  const [searchParams] = useSearchParams();
  
  // Get error details from URL params
  const errorType = searchParams.get('type') || 'payment_failed';
  const errorMessage = searchParams.get('message') || 'Something went wrong with your payment';
  
  const handleRetry = () => {
    // Go back to cart to retry checkout
    window.location.href = '/cart';
  };
  
  const handleCancel = () => {
    // Return to home or campaigns page
    window.location.href = '/';
  };
  
  return (
    <CheckoutError
      type={errorType as any}
      errorMessage={errorMessage}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}