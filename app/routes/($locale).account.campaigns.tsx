import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData, type MetaFunction} from 'react-router';
import {Money, flattenConnection, getPaginationVariables} from '@shopify/hydrogen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';

export const meta: MetaFunction = () => [{title: 'Dohhh | My Campaigns'}];

export async function loader({request, context}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
      },
    },
  );

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer};
}

export default function AccountCampaigns() {
  const {customer} = useLoaderData<typeof loader>();
  const orders = customer?.orders?.nodes || [];
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl lg:text-6xl font-bold uppercase mb-12">
          MY SUPPORTED CAMPAIGNS
        </h1>
        
        {orders.length === 0 ? (
          <EmptyCampaigns />
        ) : (
          <CampaignsList orders={orders} />
        )}
      </div>
    </div>
  );
}

function EmptyCampaigns() {
  return (
    <div className="border-2 border-black p-12 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold uppercase mb-6">
          NO CAMPAIGNS YET
        </h2>
        <p className="text-xl mb-8 uppercase">
          You haven't supported any crowdfunding campaigns yet. 
          Start making a difference today!
        </p>
        <Link 
          to="/campaigns" 
          className="inline-block px-8 py-4 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors text-xl font-bold uppercase"
        >
          BROWSE CAMPAIGNS →
        </Link>
      </div>
    </div>
  );
}

function CampaignsList({orders}: {orders: any[]}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {orders.map((order: any) => {
        // Extract campaign/product info from the order
        const lineItems = flattenConnection(order.lineItems);
        const firstItem = lineItems[0];
        const campaignName = firstItem?.title || 'Cookie Campaign';
        const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status || 'PROCESSING';
        
        return (
          <div 
            key={order.id} 
            className="border-2 border-black p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold uppercase mb-2">
                  {campaignName}
                </h3>
                <p className="text-sm uppercase text-gray-600">
                  ORDER #DOHHH_{order.number}
                </p>
              </div>
              <span className={`inline-block px-3 py-1 border-2 border-black text-sm font-bold uppercase ${
                order.financialStatus === 'PAID' ? 'bg-black text-white' : 'bg-yellow-100'
              }`}>
                {order.financialStatus}
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="font-bold uppercase">Contribution:</span>
                <span className="font-mono">
                  <Money data={order.totalPrice} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase">Date:</span>
                <span className="font-mono">
                  {new Date(order.processedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase">Fulfillment:</span>
                <span className={`inline-block px-2 py-1 border border-black text-xs font-bold uppercase ${
                  fulfillmentStatus === 'DELIVERED' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {fulfillmentStatus}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link 
                to="/campaigns"
                className="flex-1 px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase text-center"
              >
                VIEW CAMPAIGNS
              </Link>
              <Link 
                to={`/account/orders/${btoa(order.id)}`}
                className="px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase"
              >
                ORDER →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
