import {
  data as remixData,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Form, NavLink, Outlet, useLoaderData} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: LoaderFunctionArgs) {
  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `WELCOME, ${customer.firstName.toUpperCase()}`
      : `WELCOME TO YOUR ACCOUNT`
    : 'ACCOUNT DETAILS';

  return (
    <div className="min-h-screen bg-white">
      {/* Account Header */}
      <div className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h1 className="text-4xl lg:text-5xl font-bold uppercase">{heading}</h1>
            <div className="flex items-center gap-4">
              <span className="text-lg uppercase">{customer?.emailAddress?.emailAddress}</span>
              <Logout />
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <AccountMenu />
        </div>
      </div>
      
      {/* Content */}
      <div className="min-h-[60vh]">
        <Outlet context={{customer}} />
      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="flex flex-wrap gap-0">
      <NavLink 
        to="/account/orders" 
        className={({isActive}) => 
          isActive 
            ? 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black bg-black text-white'
            : 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black hover:bg-gray-100'
        }
      >
        ORDERS
      </NavLink>
      <NavLink 
        to="/account/profile" 
        className={({isActive}) => 
          isActive 
            ? 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black bg-black text-white'
            : 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black hover:bg-gray-100'
        }
      >
        PROFILE
      </NavLink>
      <NavLink 
        to="/account/addresses" 
        className={({isActive}) => 
          isActive 
            ? 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black bg-black text-white'
            : 'px-6 py-4 text-lg font-bold uppercase border-r-2 border-black hover:bg-gray-100'
        }
      >
        ADDRESSES
      </NavLink>
      <NavLink 
        to="/account/campaigns" 
        className={({isActive}) => 
          isActive 
            ? 'px-6 py-4 text-lg font-bold uppercase bg-black text-white'
            : 'px-6 py-4 text-lg font-bold uppercase hover:bg-gray-100'
        }
      >
        MY CAMPAIGNS
      </NavLink>
    </nav>
  );
}

function Logout() {
  return (
    <Form method="POST" action="/account/logout">
      <button 
        type="submit"
        className="px-6 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase"
      >
        SIGN OUT
      </button>
    </Form>
  );
}