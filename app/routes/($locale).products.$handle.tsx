import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {data, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction, useFetcher} from 'react-router';
import {useState, useEffect} from 'react';
import {useAside} from '~/components/Aside';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  return [
    {title: `${data?.product.title ?? ''} | DOHHH`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: LoaderFunctionArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export async function action({request, context}: ActionFunctionArgs) {
  const form = await request.formData();
  const quantity = Number(form.get('quantity') || 1);
  const variantId = String(form.get('variantId') || '');

  // Get existing cart or create new one
  let cart = await context.cart.get();
  let headers = new Headers();
  
  if (!cart?.id) {
    // Create new cart with the item
    const result = await context.cart.create({
      lines: [{merchandiseId: variantId, quantity}],
    });
    headers = context.cart.setCartId(result.cart.id);
    cart = result.cart;
  } else {
    // Add to existing cart (this properly adds to existing items)
    const result = await context.cart.addLines([{merchandiseId: variantId, quantity}]);
    cart = result.cart;
  }
  
  // Return success with cart data
  return data(
    { success: true, cart },
    { headers }
  );
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );
  
  const [selectedVariantId, setSelectedVariantId] = useState(selectedVariant?.id || '');

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  // Open cart drawer when item is successfully added
  useEffect(() => {
    if (fetcher.data?.success) {
      open('cart');
      // Reset quantity after successful add
      setQuantity(1);
    }
  }, [fetcher.data, open]);

  const {title, descriptionHtml, vendor} = product;
  
  // Get all product images
  const images = product.images?.nodes || [selectedVariant?.image].filter(Boolean);
  const currentImage = images[selectedImage] || selectedVariant?.image;
  
  // Get all variants
  const variants = product.variants?.nodes || [selectedVariant];
  
  // Get price from selected variant
  const variantPrice = selectedVariant?.price?.amount ? parseFloat(selectedVariant.price.amount) : 0;
  const totalPrice = variantPrice * quantity;

  return (
    <div className="bg-white min-h-screen">
      {/* Product Header and Purchase Section */}
      <section className="w-full grid grid-cols-1 xl:grid-cols-3 border-b-2 border-black">
        {/* Left - Images Section */}
        <div className="xl:col-span-2 xl:border-r-2 border-black">
          <div className="flex flex-col lg:flex-row lg:h-[600px] w-full">
            {/* Thumbnail Gallery - Left side on desktop */}
            {images && images.length > 1 && (
              <div className="flex lg:flex-col gap-2 p-4 order-2 lg:order-1 lg:w-auto h-auto lg:h-[600px] lg:pt-0 overflow-x-scroll lg:overflow-x-visible lg:overflow-y-auto">
                <div className="flex lg:flex-col gap-2">
                  {images.slice(0, 6).map((image: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 border-2 ${
                        selectedImage === idx ? 'border-black' : 'border-gray-300'
                      } hover:border-black transition-colors`}
                    >
                      <img
                        src={image.url}
                        alt={`${title} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main Image - Takes remaining space with padding */}
            <div className="flex-1 order-1 lg:order-2 h-96 lg:h-[600px] lg:pr-8">
              <img
                src={currentImage?.url || '/placeholder.png'}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="px-4 py-8 lg:p-12">
            <h1 className="text-4xl lg:text-6xl font-bold uppercase mb-4">
              {title}
            </h1>
            {vendor && (
              <p className="text-lg uppercase mb-6">
                BY {vendor}
              </p>
            )}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
            </div>
          </div>
        </div>
        
        {/* Right - Purchase Section */}
        <div className="px-4 py-8 lg:p-8 lg:pl-8 lg:pr-12 lg:pt-0 lg:pb-12 w-full xl:col-span-1">
          <h2 className="text-2xl uppercase mb-2 lg:mt-0">PRODUCT DETAILS</h2>
          <p className="text-3xl font-bold uppercase mb-8">${variantPrice.toFixed(2)}</p>
          
          <fetcher.Form method="post" className="space-y-8 w-full max-w-2xl">
            <input type="hidden" name="variantId" value={selectedVariantId} />
            
            {/* Variant Selector - Only show if multiple variants */}
            {variants.length > 1 && (
              <div className="w-full">
                <label className="text-xl uppercase mb-4 block">SELECT OPTION</label>
                <div className="space-y-4">
                  {variants.map((variant: any) => (
                    <label 
                      key={variant.id}
                      className={`block border-2 border-black p-6 cursor-pointer transition-colors ${
                        selectedVariantId === variant.id ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                      } ${!variant.availableForSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        checked={selectedVariantId === variant.id}
                        onChange={() => setSelectedVariantId(variant.id)}
                        disabled={!variant.availableForSale}
                        className="sr-only"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xl uppercase">
                          {variant.title}
                        </span>
                        <span className="text-xl font-bold">
                          ${variant.price?.amount ? parseFloat(variant.price.amount).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      {!variant.availableForSale && (
                        <span className="text-sm uppercase mt-2 block">SOLD OUT</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div className="w-full">
              <label className="text-xl uppercase mb-4 block">QUANTITY</label>
              <div className="flex w-full">
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 border-2 border-black px-4 lg:px-8 py-6 text-2xl hover:bg-black hover:text-white transition-colors"
                >
                  -
                </button>
                <input 
                  name="quantity" 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 border-t-2 border-b-2 border-l-0 border-r-0 border-black px-4 lg:px-8 py-6 text-2xl text-center"
                />
                <button 
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 border-2 border-black px-4 lg:px-8 py-6 text-2xl hover:bg-black hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Total */}
            <div className="border-t-2 border-black pt-8">
              <div className="flex justify-between items-center mb-8">
                <span className="text-2xl uppercase">TOTAL</span>
                <span className="text-3xl font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                className="w-full border-2 border-black py-6 text-2xl uppercase bg-black text-white hover:bg-white hover:text-black transition-colors"
                disabled={fetcher.state !== 'idle'}
              >
                {fetcher.state === 'submitting' ? 'ADDING TO CART...' : 'ADD TO CART →'}
              </button>
            </div>
          </fetcher.Form>
          
          {/* Product details */}
          <div className="mt-12 pt-8 border-t-2 border-black space-y-2">
            <p className="text-lg">SKU: {selectedVariant?.sku || 'N/A'}</p>
            <p className="text-lg">AVAILABILITY: {selectedVariant?.availableForSale ? 'IN STOCK' : 'OUT OF STOCK'}</p>
            {vendor && <p className="text-lg">BRAND: {vendor.toUpperCase()}</p>}
          </div>
        </div>
      </section>
      
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 100) {
      nodes {
        ...ProductVariant
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;