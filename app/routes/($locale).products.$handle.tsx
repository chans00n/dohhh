import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {data, type ActionFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction, useFetcher, Link} from 'react-router';
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

  const [{product}, {products: recommendedProducts}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Get recommended products
    storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {},
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
    recommendedProducts,
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
  const {product, recommendedProducts} = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
  
  // Format description to handle line breaks properly
  const formattedDescription = descriptionHtml
    ? descriptionHtml
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>') // Double line breaks become paragraphs
        .replace(/^(?!<p>)/, '<p>') // Add opening p tag if missing
        .replace(/(?!<\/p>)$/, '</p>') // Add closing p tag if missing
        .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    : '';
  
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
          
          {/* Product Information Accordion - Desktop Only */}
          <div className="hidden lg:block px-4 py-8 lg:px-8 lg:py-12 space-y-4">
            {/* Allergen Information */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'allergens' ? null : 'allergens')}
                className="w-full px-6 py-4 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <span>ALLERGEN INFORMATION</span>
                <span className="text-2xl">{expandedSection === 'allergens' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'allergens' && (
                <div className="px-6 py-4 border-t-2 border-black bg-yellow-50">
                  <p className="mb-3 font-bold">CONTAINS:</p>
                  <ul className="list-disc list-inside space-y-1 mb-4">
                    <li>WHEAT (GLUTEN)</li>
                    <li>EGGS</li>
                    <li>MILK & DAIRY</li>
                    <li>SOY (IN CHOCOLATE)</li>
                  </ul>
                  <p className="mb-3 font-bold">MAY CONTAIN TRACES OF:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>TREE NUTS</li>
                    <li>PEANUTS</li>
                  </ul>
                  <p className="mt-4 text-sm italic">
                    Our cookies are made in a facility that handles various allergens. 
                    Please contact us if you have specific dietary requirements.
                  </p>
                </div>
              )}
            </div>

            {/* Cookie Care */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'care' ? null : 'care')}
                className="w-full px-6 py-4 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <span>COOKIE CARE & STORAGE</span>
                <span className="text-2xl">{expandedSection === 'care' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'care' && (
                <div className="px-6 py-4 border-t-2 border-black">
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold mb-2">FRESHNESS GUARANTEED</p>
                      <p>Best enjoyed within 7 days of delivery for optimal taste and texture.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">STORAGE TIPS</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Store in an airtight container at room temperature</li>
                        <li>Keep away from direct sunlight and heat</li>
                        <li>Can be frozen for up to 3 months</li>
                        <li>Warm in oven at 300°F for 2-3 minutes for that fresh-baked taste</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Details */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
                className="w-full px-6 py-4 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <span>SHIPPING & DELIVERY</span>
                <span className="text-2xl">{expandedSection === 'shipping' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'shipping' && (
                <div className="px-6 py-4 border-t-2 border-black">
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold mb-2">MADE TO ORDER</p>
                      <p>All cookies are freshly baked after your order is placed to ensure maximum freshness.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-2">DELIVERY TIMELINE</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Processing: 2-3 business days</li>
                        <li>Standard Shipping: 3-5 business days</li>
                        <li>Express Shipping: 1-2 business days</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold mb-2">PACKAGING</p>
                      <p>Cookies are individually wrapped and packed in our signature DOHHH boxes to ensure they arrive in perfect condition.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right - Purchase Section */}
        <div className="px-4 py-8 lg:p-8 lg:pl-8 lg:pr-12 lg:pt-0 lg:pb-12 w-full xl:col-span-1">
        <h1 className="text-4xl lg:text-6xl font-bold uppercase">
              {title}
            </h1>
          <div className="prose prose-lg max-w-none mb-8">
              <div 
                className="[&>p]:mb-4 [&>p:last-child]:mb-0"
                dangerouslySetInnerHTML={{__html: formattedDescription}} />
            </div>
          
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
                {fetcher.state === 'submitting' ? 'ADDING TO CART...' : 'ADD TO CART'}
              </button>
            </div>
          </fetcher.Form>
          
          {/* Product Information Accordion - Mobile Only */}
          <div className="lg:hidden mt-8 space-y-4">
            {/* Allergen Information */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'allergens' ? null : 'allergens')}
                className="w-full px-4 py-3 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors text-sm"
              >
                <span>ALLERGEN INFORMATION</span>
                <span className="text-xl">{expandedSection === 'allergens' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'allergens' && (
                <div className="px-4 py-3 border-t-2 border-black bg-yellow-50">
                  <p className="mb-2 font-bold text-sm">CONTAINS:</p>
                  <ul className="list-disc list-inside space-y-1 mb-3 text-sm">
                    <li>WHEAT (GLUTEN)</li>
                    <li>EGGS</li>
                    <li>MILK & DAIRY</li>
                    <li>SOY (IN CHOCOLATE)</li>
                  </ul>
                  <p className="mb-2 font-bold text-sm">MAY CONTAIN TRACES OF:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>TREE NUTS</li>
                    <li>PEANUTS</li>
                  </ul>
                  <p className="mt-3 text-xs italic">
                    Our cookies are made in a facility that handles various allergens. 
                    Please contact us if you have specific dietary requirements.
                  </p>
                </div>
              )}
            </div>

            {/* Cookie Care */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'care' ? null : 'care')}
                className="w-full px-4 py-3 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors text-sm"
              >
                <span>COOKIE CARE & STORAGE</span>
                <span className="text-xl">{expandedSection === 'care' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'care' && (
                <div className="px-4 py-3 border-t-2 border-black">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold mb-1 text-sm">FRESHNESS GUARANTEED</p>
                      <p className="text-sm">Best enjoyed within 7 days of delivery for optimal taste and texture.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-sm">STORAGE TIPS</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Store in an airtight container at room temperature</li>
                        <li>Keep away from direct sunlight and heat</li>
                        <li>Can be frozen for up to 3 months</li>
                        <li>Warm in oven at 300°F for 2-3 minutes for that fresh-baked taste</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Details */}
            <div className="border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
                className="w-full px-4 py-3 text-left font-bold uppercase flex justify-between items-center hover:bg-gray-100 transition-colors text-sm"
              >
                <span>SHIPPING & DELIVERY</span>
                <span className="text-xl">{expandedSection === 'shipping' ? '−' : '+'}</span>
              </button>
              {expandedSection === 'shipping' && (
                <div className="px-4 py-3 border-t-2 border-black">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold mb-1 text-sm">MADE TO ORDER</p>
                      <p className="text-sm">All cookies are freshly baked after your order is placed to ensure maximum freshness.</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-sm">DELIVERY TIMELINE</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Processing: 2-3 business days</li>
                        <li>Standard Shipping: 3-5 business days</li>
                        <li>Express Shipping: 1-2 business days</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold mb-1 text-sm">PACKAGING</p>
                      <p className="text-sm">Cookies are individually wrapped and packed in our signature DOHHH boxes to ensure they arrive in perfect condition.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Product details */}
          <div className="mt-12 pt-8 border-t-2 border-black space-y-2">
            <p className="text-lg">SKU: {selectedVariant?.sku || 'N/A'}</p>
            <p className="text-lg">AVAILABILITY: {selectedVariant?.availableForSale ? 'IN STOCK' : 'OUT OF STOCK'}</p>
            {vendor && <p className="text-lg">BRAND: {vendor.toUpperCase()}</p>}
          </div>
        </div>
      </section>
      
      {/* The DOHHH Way Section */}
      <section className="w-full bg-white border-b-2 border-black">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left - Image */}
            <div className="border-b-2 lg:border-b-0 lg:border-r-2 border-black">
              <img
                src="/the_dohhh_way.png"
                alt="The DOHHH Way - Handcrafted Cookies"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Right - Content */}
            <div className="py-8 lg:p-12">
              <h2 className="text-3xl lg:text-5xl font-bold uppercase mb-8 border-b-2 border-black pb-4">
                THE DOHHH WAY
              </h2>
              
              <div className="space-y-6">
                {/* Quality Promise */}
                <div className="border-2 border-black p-6 bg-yellow-50">
                  <h3 className="text-2xl font-bold uppercase mb-3">BESPOKE COOKIES, CRAFTED WITH LOVE</h3>
                  <p className="text-lg uppercase leading-relaxed">
                    Every cookie is handcrafted to order using only the finest ingredients. 
                    No mass production. No shortcuts. Just pure cookie perfection.
                  </p>
                </div>
                
                {/* Three Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">01</div>
                    <h4 className="font-bold uppercase mb-1">PREMIUM INGREDIENTS</h4>
                    <p className="text-sm uppercase">Belgian chocolate, organic flour, real butter</p>
                  </div>
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">02</div>
                    <h4 className="font-bold uppercase mb-1">MADE FRESH</h4>
                    <p className="text-sm uppercase">Baked to order, never frozen, always fresh</p>
                  </div>
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">03</div>
                    <h4 className="font-bold uppercase mb-1">WITH PURPOSE</h4>
                    <p className="text-sm uppercase">Support amazing campaigns with every bite</p>
                  </div>
                </div>
                
                {/* The Promise */}
                <div className="border-l-8 border-black pl-6 py-2">
                  <p className="text-xl font-bold uppercase mb-2">
                    MORE THAN JUST A COOKIE
                  </p>
                  <p className="text-lg">
                    When you bite into a DOHHH cookie, you're experiencing the culmination of 
                    artisan craftsmanship, premium quality, and social impact. Each cookie tells 
                    a story — from our kitchen to your moment of indulgence, while making a 
                    difference in the world.
                  </p>
                </div>
                
                {/* Call to Action */}
                <div className="bg-black text-white p-6">
                  <p className="text-2xl font-bold uppercase text-center">
                    TASTE THE DIFFERENCE. MAKE A DIFFERENCE.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Indicators Section */}
      <section className="w-full bg-white border-b-2 border-black py-12">
        <div className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">100%</div>
              <p className="text-sm lg:text-base uppercase font-bold">Handmade</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">ZERO</div>
              <p className="text-sm lg:text-base uppercase font-bold">Preservatives</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">4</div>
              <p className="text-sm lg:text-base uppercase font-bold">Cookie Varieties</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">1ST</div>
              <p className="text-sm lg:text-base uppercase font-bold">Campaign Live</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recommendations Section */}
      {recommendedProducts && recommendedProducts.nodes && recommendedProducts.nodes.length > 0 && (
        <section className="w-full bg-white border-b-2 border-black">
          <div className="w-full py-8 lg:py-12">
            <h2 className="text-3xl lg:text-5xl font-bold uppercase mb-8 text-center">
              YOU MIGHT ALSO LIKE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-0">
              {recommendedProducts.nodes.slice(0, 3).map((recProduct: any, idx: number) => (
                <Link
                  key={recProduct.id}
                  to={`/products/${recProduct.handle}`}
                  className={`block border-2 border-black ${idx < 2 ? 'md:border-r-0' : ''} hover:bg-gray-50 transition-colors`}
                >
                  <div className="h-64 lg:h-80">
                    {recProduct.featuredImage && (
                      <img
                        src={recProduct.featuredImage.url}
                        alt={recProduct.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4 lg:p-6">
                    <h3 className="text-xl lg:text-2xl font-bold uppercase mb-2">{recProduct.title}</h3>
                    <p className="text-lg lg:text-xl font-bold">
                      ${recProduct.priceRange?.minVariantPrice?.amount || '0'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      
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

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        featuredImage {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;