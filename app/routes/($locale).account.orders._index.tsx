import {Link, useLoaderData, type MetaFunction} from 'react-router';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export const meta: MetaFunction = () => {
  return [{title: 'Orders'}];
};

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

export default function Orders() {
  const {customer} = useLoaderData<{customer: CustomerOrdersFragment}>();
  const {orders} = customer;
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl lg:text-6xl font-bold uppercase mb-12">
          ORDER HISTORY
        </h1>
        {orders.nodes.length ? <OrdersTable orders={orders} /> : <EmptyOrders />}
      </div>
    </div>
  );
}

function OrdersTable({orders}: Pick<CustomerOrdersFragment, 'orders'>) {
  return (
    <div className="space-y-6">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders />
      )}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="border-2 border-black p-12 text-center">
      <p className="text-2xl font-bold uppercase mb-6">NO ORDERS YET</p>
      <p className="text-lg mb-8 uppercase">Start supporting campaigns and get your cookies!</p>
      <Link 
        to="/campaigns" 
        className="inline-block px-8 py-4 border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors text-xl font-bold uppercase"
      >
        BROWSE CAMPAIGNS →
      </Link>
    </div>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <div className="border-2 border-black p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="flex-1">
          <Link to={`/account/orders/${btoa(order.id)}`} className="hover:underline">
            <h3 className="text-2xl font-bold uppercase mb-2">ORDER #{order.number}</h3>
          </Link>
          <p className="text-lg uppercase mb-1">
            {new Date(order.processedAt).toLocaleDateString('en-US', { 
              month: 'SHORT', 
              day: 'NUMERIC', 
              year: 'NUMERIC' 
            })}
          </p>
          <div className="flex gap-4 flex-wrap">
            <span className={`inline-block px-3 py-1 border-2 border-black text-sm font-bold uppercase ${
              order.financialStatus === 'PAID' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {order.financialStatus}
            </span>
            {fulfillmentStatus && (
              <span className={`inline-block px-3 py-1 border-2 border-black text-sm font-bold uppercase ${
                fulfillmentStatus === 'DELIVERED' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {fulfillmentStatus}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold mb-4">
            <Money data={order.totalPrice} />
          </div>
          <Link 
            to={`/account/orders/${btoa(order.id)}`}
            className="inline-block px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors font-bold uppercase"
          >
            VIEW ORDER →
          </Link>
        </div>
      </div>
    </div>
  );
}
