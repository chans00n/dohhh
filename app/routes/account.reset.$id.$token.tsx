/**
 * Password Reset Route Handler
 * Shows branded password reset form and processes reset
 * Example: /account/reset/9725469458751/abc123def456
 */

import {json, type LoaderFunctionArgs, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Form, useNavigation} from 'react-router';
import {useState} from 'react';
import {SuccessPage, ErrorPage} from '~/components/account/BrandedConfirmation';
import {resetPasswordWithShopify} from '~/lib/shopify-account.server';

export async function loader({params}: LoaderFunctionArgs) {
  const {id, token} = params;
  
  // Log reset attempt (without exposing the full token)
  console.log('Password reset page:', {
    customerId: id,
    tokenPrefix: token?.substring(0, 8) + '...',
    timestamp: new Date().toISOString(),
  });

  // Validate parameters
  if (!id || !token) {
    console.error('Invalid reset parameters');
    return json({
      success: false,
      error: 'INVALID RESET LINK',
      suggestion: 'This link may be expired. Request a new password reset email.'
    });
  }

  return json({
    success: null,
    id,
    token
  });
}

export async function action({params, request, context}: ActionFunctionArgs) {
  const {id, token} = params;
  const formData = await request.formData();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  
  console.log('Password reset attempt:', {
    customerId: id,
    method: 'POST',
    timestamp: new Date().toISOString(),
  });

  // Validate inputs
  if (!password || !confirmPassword) {
    return json({
      success: false,
      error: 'Please enter a password',
      fieldError: true
    });
  }

  if (password !== confirmPassword) {
    return json({
      success: false,
      error: 'Passwords don\'t match',
      fieldError: true
    });
  }

  if (password.length < 8) {
    return json({
      success: false,
      error: 'Password must be at least 8 characters',
      fieldError: true
    });
  }

  try {
    const result = await resetPasswordWithShopify(id!, token!, password, context);
    
    if (result.success) {
      return json({
        success: true,
        message: 'PASSWORD RESET SUCCESSFUL!',
        nextSteps: 'Your password has been updated. You can now log in with your new password.'
      });
    } else {
      return json({
        success: false,
        error: 'RESET FAILED',
        suggestion: result.message || 'This link may be expired. Request a new reset email.'
      });
    }
  } catch (error) {
    console.error('Reset error:', error);
    return json({
      success: false,
      error: 'SOMETHING WENT WRONG',
      suggestion: 'Please try again or contact support'
    });
  }
}

export default function PasswordReset() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const isSubmitting = navigation.state === 'submitting';

  // If we have a success/error from the action, show the appropriate page
  if (data.success === true) {
    return (
      <SuccessPage 
        message={data.message!}
        nextSteps={data.nextSteps}
        showConfetti={true}
      />
    );
  }

  if (data.success === false && !data.fieldError) {
    return (
      <ErrorPage 
        error={data.error!}
        suggestion={data.suggestion}
        showRetry={false}
      />
    );
  }

  // Show the password reset form
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="border-4 border-black p-8 bg-white">
          <h1 className="text-3xl font-black uppercase mb-6">
            RESET YOUR PASSWORD
          </h1>
          <p className="text-lg uppercase mb-8">
            Enter a new password for your account
          </p>
          
          <Form method="post" className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-bold uppercase mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-black uppercase font-bold focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="MINIMUM 8 CHARACTERS"
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-black uppercase font-bold focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="ENTER SAME PASSWORD"
                required
                disabled={isSubmitting}
              />
            </div>
            
            {(error || data.error) && data.fieldError && (
              <div className="p-3 bg-red-50 border-2 border-red-500">
                <p className="text-red-600 font-bold uppercase">
                  {error || data.error}
                </p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}