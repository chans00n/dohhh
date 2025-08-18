/**
 * API Route for Email Capture
 * Stores email addresses in Shopify customer database for campaign updates
 */

import {data, type ActionFunctionArgs} from '@shopify/remix-oxygen';

export async function action({request, context}: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email')?.toString();
  const campaignId = formData.get('campaignId')?.toString();
  const campaignName = formData.get('campaignName')?.toString();

  if (!email || !campaignId) {
    return data(
      {error: 'Missing required fields'},
      {status: 400}
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return data(
      {error: 'Invalid email format'},
      {status: 400}
    );
  }

  try {
    // Create or update customer in Shopify using Storefront API
    const CUSTOMER_CREATE_MUTATION = `
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            acceptsMarketing
          }
          customerUserErrors {
            field
            message
            code
          }
        }
      }
    `;

    // First, try to create the customer
    const {customerCreate} = await context.storefront.mutate(
      CUSTOMER_CREATE_MUTATION,
      {
        variables: {
          input: {
            email,
            acceptsMarketing: true,
            password: Math.random().toString(36).slice(-8) + 'Aa1!', // Generate random password
          },
        },
      },
    );

    // Check for errors
    if (customerCreate?.customerUserErrors?.length > 0) {
      const errors = customerCreate.customerUserErrors;
      
      // If customer already exists, that's okay - they're still subscribed
      if (errors.some((e: any) => e.code === 'TAKEN')) {
        console.log('Customer already exists, updating subscription:', email);
        
        // Store campaign subscription info in a metafield or tag
        // For now, we'll track it in our logs
        console.log('Campaign subscription:', {
          email,
          campaignId,
          campaignName,
          timestamp: new Date().toISOString(),
          status: 'existing_customer',
        });

        return data({
          success: true,
          message: 'Email already subscribed - we\'ll keep you posted!',
        });
      }

      // Other errors
      console.error('Customer creation errors:', errors);
      return data(
        {error: 'Failed to subscribe. Please try again.'},
        {status: 400}
      );
    }

    // Success - new customer created
    console.log('New customer created and subscribed:', {
      email,
      campaignId,
      campaignName,
      customerId: customerCreate?.customer?.id,
      timestamp: new Date().toISOString(),
      status: 'new_customer',
    });

    return data({
      success: true,
      message: 'Successfully subscribed to campaign updates',
    });

  } catch (error) {
    console.error('Error subscribing email:', error);
    return data(
      {error: 'Failed to subscribe. Please try again.'},
      {status: 500}
    );
  }
}

// GET method not supported
export async function loader() {
  return data(
    {error: 'Method not allowed'},
    {status: 405}
  );
}