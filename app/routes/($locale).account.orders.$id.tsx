import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from 'react-router';
import {Money, Image, flattenConnection} from '@shopify/hydrogen';
import type {OrderLineItemFullFragment} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [{title: `Order ${data?.order?.name}`}];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors} = await context.customerAccount.query(
    CUSTOMER_ORDER_QUERY,
    {
      variables: {orderId},
    },
  );

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  const lineItems = flattenConnection(order.lineItems);
  const discountApplications = flattenConnection(order.discountApplications);

  const fulfillmentStatus =
    flattenConnection(order.fulfillments)[0]?.status ?? 'N/A';

  const firstDiscount = discountApplications[0]?.value;

  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' && firstDiscount;

  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue' &&
    firstDiscount?.percentage;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();
  
  // Extract order number with DOHHH_ prefix
  const orderNumber = order.name?.replace('#', 'DOHHH_') || order.name;
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Order Header */}
        <div className="border-b-2 border-black pb-6 mb-8">
          <h1 className="text-5xl lg:text-6xl font-bold uppercase mb-4">
            ORDER #{orderNumber}
          </h1>
          <p className="text-xl uppercase">
            PLACED ON {new Date(order.processedAt!).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }).toUpperCase()}
          </p>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase mb-6">ORDER ITEMS</h2>
          <div className="border-2 border-black">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-black bg-black text-white font-bold uppercase">
              <div className="col-span-6">PRODUCT</div>
              <div className="col-span-2 text-right">PRICE</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>
            
            {/* Line Items */}
            {lineItems.map((lineItem, lineItemIndex) => (
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
            
            {/* Order Summary */}
            <div className="border-t-2 border-black">
              {((discountValue && discountValue.amount) || discountPercentage) && (
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-300">
                  <div className="col-span-10 text-right font-bold uppercase">DISCOUNTS</div>
                  <div className="col-span-2 text-right font-mono">
                    {discountPercentage ? (
                      <span>-{discountPercentage}% OFF</span>
                    ) : (
                      discountValue && <Money data={discountValue!} />
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-300">
                <div className="col-span-10 text-right font-bold uppercase">SUBTOTAL</div>
                <div className="col-span-2 text-right font-mono">
                  <Money data={order.subtotal!} />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-300">
                <div className="col-span-10 text-right font-bold uppercase">TAX</div>
                <div className="col-span-2 text-right font-mono">
                  <Money data={order.totalTax!} />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 p-4 bg-black text-white">
                <div className="col-span-10 text-right font-bold uppercase text-xl">TOTAL</div>
                <div className="col-span-2 text-right font-mono text-xl">
                  <Money data={order.totalPrice!} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping and Status */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div className="border-2 border-black p-6">
            <h3 className="text-xl font-bold uppercase mb-4">SHIPPING ADDRESS</h3>
            {order?.shippingAddress ? (
              <address className="not-italic space-y-2">
                <p className="font-bold uppercase">{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted && (
                  <p className="font-mono">{order.shippingAddress.formatted}</p>
                )}
                {order.shippingAddress.formattedArea && (
                  <p className="font-mono">{order.shippingAddress.formattedArea}</p>
                )}
              </address>
            ) : (
              <p className="text-gray-500 uppercase">NO SHIPPING ADDRESS DEFINED</p>
            )}
          </div>
          
          {/* Order Status */}
          <div className="border-2 border-black p-6">
            <h3 className="text-xl font-bold uppercase mb-4">ORDER STATUS</h3>
            <div className="space-y-4">
              <div>
                <span className="font-bold uppercase">PAYMENT: </span>
                <span className={`inline-block px-3 py-1 border-2 border-black text-sm font-bold uppercase ${
                  order.financialStatus === 'PAID' ? 'bg-black text-white' : 'bg-yellow-100'
                }`}>
                  {order.financialStatus}
                </span>
              </div>
              <div>
                <span className="font-bold uppercase">FULFILLMENT: </span>
                <span className={`inline-block px-3 py-1 border-2 border-black text-sm font-bold uppercase ${
                  fulfillmentStatus === 'DELIVERED' ? 'bg-black text-white' : 'bg-blue-100'
                }`}>
                  {fulfillmentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Order Status Link */}
        <div className="mt-8">
          <a 
            target="_blank" 
            href={order.statusPageUrl} 
            rel="noreferrer"
            className="inline-block px-8 py-4 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-xl font-bold uppercase"
          >
            VIEW ORDER STATUS →
          </a>
        </div>
      </div>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  const lineItemTotal = {
    amount: (parseFloat(lineItem.price?.amount || '0') * lineItem.quantity).toFixed(2),
    currencyCode: lineItem.price?.currencyCode || 'USD'
  };
  
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-300 hover:bg-gray-50">
      <div className="col-span-6 flex gap-4">
        {lineItem?.image && (
          <div className="border-2 border-black">
            <Image data={lineItem.image} width={96} height={96} />
          </div>
        )}
        <div>
          <p className="font-bold uppercase">{lineItem.title}</p>
          {lineItem.variantTitle && (
            <p className="text-sm uppercase text-gray-600">{lineItem.variantTitle}</p>
          )}
        </div>
      </div>
      <div className="col-span-2 text-right font-mono">
        <Money data={lineItem.price!} />
      </div>
      <div className="col-span-2 text-center font-mono">
        {lineItem.quantity}
      </div>
      <div className="col-span-2 text-right font-mono">
        <Money data={lineItemTotal} />
      </div>
    </div>
  );
}
