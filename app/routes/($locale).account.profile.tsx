import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type MetaFunction,
} from 'react-router';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: MetaFunction = () => {
  return [{title: 'Profile'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  await context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: ActionFunctionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl lg:text-6xl font-bold uppercase mb-12">
          MY PROFILE
        </h1>
        
        <div className="max-w-2xl">
          <Form method="PUT">
            <div className="border-2 border-black p-8">
              <h2 className="text-2xl font-bold uppercase mb-8">
                PERSONAL INFORMATION
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label 
                    htmlFor="firstName" 
                    className="block text-lg font-bold uppercase mb-2"
                  >
                    FIRST NAME
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="ENTER FIRST NAME"
                    aria-label="First name"
                    defaultValue={customer.firstName ?? ''}
                    minLength={2}
                    className="w-full px-4 py-3 border-2 border-black text-lg font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor="lastName" 
                    className="block text-lg font-bold uppercase mb-2"
                  >
                    LAST NAME
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="ENTER LAST NAME"
                    aria-label="Last name"
                    defaultValue={customer.lastName ?? ''}
                    minLength={2}
                    className="w-full px-4 py-3 border-2 border-black text-lg font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </div>
              </div>
              
              {action?.error && (
                <div className="mt-6 p-4 border-2 border-red-500 bg-red-50">
                  <p className="text-red-500 font-bold uppercase">
                    ERROR: {action.error}
                  </p>
                </div>
              )}
              
              {action?.customer && !action?.error && (
                <div className="mt-6 p-4 border-2 border-green-500 bg-green-50">
                  <p className="text-green-700 font-bold uppercase">
                    ✓ PROFILE UPDATED SUCCESSFULLY
                  </p>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={state !== 'idle'}
                className="mt-8 w-full px-8 py-4 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors text-xl font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state !== 'idle' ? 'UPDATING...' : 'UPDATE PROFILE'}
              </button>
            </div>
          </Form>
          
          <div className="mt-8 border-2 border-black p-8">
            <h2 className="text-2xl font-bold uppercase mb-4">
              ACCOUNT DETAILS
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="font-bold uppercase">EMAIL:</span>
                <span className="font-mono">{customer.email}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold uppercase">MEMBER SINCE:</span>
                <span className="font-mono">
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
