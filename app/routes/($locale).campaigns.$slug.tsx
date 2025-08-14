import {data, type ActionFunctionArgs, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Form, useLoaderData, useNavigation, Link, type MetaFunction, useFetcher} from 'react-router';
import {useState, useEffect} from 'react';
import {useAside} from '~/components/Aside';
import {type Campaign} from '~/lib/campaigns';
import {CampaignStory} from '~/components/campaigns/CampaignStory';
import {CAMPAIGN_BY_HANDLE_QUERY, CAMPAIGN_LIST_QUERY, CAMPAIGN_RECENT_QUERY} from '~/graphql/campaigns/ProductCampaignFragments';
import {productToCampaign} from '~/lib/campaigns.server';
import {Footer} from '~/components/Footer';

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'JUST NOW';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} MINUTES AGO`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} HOURS AGO`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} DAYS AGO`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

// Backers Display Component
function BackersDisplay({ backersJson }: { backersJson: string }) {
  let backers = [];
  
  // Try to parse the JSON data from Shopify
  if (backersJson && backersJson !== '') {
    try {
      backers = JSON.parse(backersJson);
      console.log('Using real backer data from Shopify');
      
      // Sort backers by most recent first
      backers.sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return dateB - dateA; // Most recent first
      });
    } catch (e) {
      console.error('Failed to parse backers JSON:', e);
      // Fall back to empty array if parse fails
      backers = [];
    }
  }
  
  // If no backers data, show empty state
  if (!backers || backers.length === 0) {
    backers = [];
  }
  
  return (
    <div className="space-y-0">
      {/* Desktop Table View */}
      <div className="hidden lg:block border-2 border-black">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-black text-white font-bold uppercase">
          <div className="col-span-3">BACKER</div>
          <div className="col-span-2">COOKIES</div>
          <div className="col-span-2">AMOUNT</div>
          <div className="col-span-2">LOCATION</div>
          <div className="col-span-3">WHEN</div>
        </div>
        
        {/* Backer rows */}
        {backers.length > 0 ? (
          backers.map((backer: any, idx: number) => (
            <div 
              key={idx} 
              className="grid grid-cols-12 gap-4 p-4 border-t-2 border-black hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-3 font-bold">{backer.name || 'ANONYMOUS'}</div>
              <div className="col-span-2">{backer.quantity || 1}</div>
              <div className="col-span-2 font-bold">${(backer.amount || 0).toFixed(2)}</div>
              <div className="col-span-2">{backer.location || ''}</div>
              <div className="col-span-3 text-sm uppercase">{getRelativeTime(backer.timestamp || backer.createdAt || new Date().toISOString())}</div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center border-t-2 border-black">
            <p className="text-2xl font-bold uppercase mb-2">BE THE FIRST BACKER</p>
            <p className="text-lg">NO ONE HAS BACKED THIS CAMPAIGN YET</p>
          </div>
        )}
      </div>
      
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {backers.length > 0 ? (
          backers.map((backer: any, idx: number) => (
            <div key={idx} className="border-2 border-black p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-lg">{backer.name || 'ANONYMOUS'}</p>
                <p className="text-sm uppercase">{getRelativeTime(backer.timestamp || backer.createdAt || new Date().toISOString())}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold">{backer.quantity || 1}</span> COOKIES</p>
                <p className="text-xl font-bold">${(backer.amount || 0).toFixed(2)}</p>
                {backer.location && <p className="text-sm uppercase">{backer.location}</p>}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center border-2 border-black">
            <p className="text-2xl font-bold uppercase mb-2">BE THE FIRST BACKER</p>
            <p className="text-lg">NO ONE HAS BACKED THIS CAMPAIGN YET</p>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      {backers.length > 0 && (
        <div className="mt-8 p-8 lg:p-6 border-2 border-black bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-lg uppercase mb-2">TOTAL BACKERS</p>
              <p className="text-3xl font-bold">{backers.length}</p>
            </div>
            <div>
              <p className="text-lg uppercase mb-2">TOTAL COOKIES</p>
              <p className="text-3xl font-bold">
                {backers.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-lg uppercase mb-2">TOTAL RAISED</p>
              <p className="text-3xl font-bold">
                ${backers.reduce((sum: number, b: any) => sum + (b.amount || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const meta: MetaFunction<typeof loader> = ({data, params}) => {
  const campaign = data?.campaign;
  const imageUrl = campaign?.images?.[0]?.url || 'https://www.dohhh.shop/dohhh-share.png';
  const progress = campaign?.progress?.percentage || 0;
  
  // Extract plain text from rich text description if needed
  let plainDescription = campaign?.description || '';
  if (plainDescription && plainDescription.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(plainDescription);
      const extractText = (node: any): string => {
        if (node.type === 'text' && node.value) return node.value;
        if (node.children) {
          return node.children.map((c: any) => extractText(c)).join(' ');
        }
        return '';
      };
      plainDescription = extractText(parsed);
    } catch {
      // Keep original if parsing fails
    }
  }
  
  return [
    {title: `${campaign?.name || 'Campaign'} | DOHHH`},
    {name: 'description', content: plainDescription || `Support the ${campaign?.name} campaign. Help us make a difference with perfectly imperfect cookies for important causes.`},
    {
      rel: 'canonical',
      href: `https://www.dohhh.shop/campaigns/${params.slug}`,
    },
    
    // Open Graph tags
    {property: 'og:type', content: 'article'},
    {property: 'og:title', content: `${campaign?.name || 'Campaign'} | DOHHH`},
    {property: 'og:description', content: plainDescription || 'Join this meaningful campaign and make a difference with DOHHH cookies.'},
    {property: 'og:url', content: `https://www.dohhh.shop/campaigns/${params.slug}`},
    {property: 'og:image', content: imageUrl},
    {property: 'og:image:alt', content: campaign?.name || 'DOHHH Campaign'},
    {property: 'og:site_name', content: 'DOHHH'},
    {property: 'article:author', content: 'DOHHH'},
    
    // Twitter Card tags
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:site', content: '@dohhh_dohhh'},
    {name: 'twitter:title', content: `${campaign?.name || 'Campaign'} | Support This Campaign`},
    {name: 'twitter:description', content: plainDescription?.substring(0, 200) || 'Help us reach our goal and make a difference.'},
    {name: 'twitter:image', content: imageUrl},
    {name: 'twitter:label1', content: 'Progress'},
    {name: 'twitter:data1', content: `${progress}% funded`},
    {name: 'twitter:label2', content: 'Goal'},
    {name: 'twitter:data2', content: `${campaign?.goal?.quantity || 0} cookies`},
  ];
};

export async function loader({params, context}: LoaderFunctionArgs) {
  const handle = params.slug || '';
  let dataByHandle: any = null;
  try {
    dataByHandle = await context.storefront.query(CAMPAIGN_BY_HANDLE_QUERY, {variables: {handle}, cache: context.storefront.CacheNone()});
  } catch (e: any) {
    console.error('Storefront query error CAMPAIGN_BY_HANDLE_QUERY', e?.message || e);
  }
  let product = dataByHandle?.product;
  if (!product) {
    try {
      const dataList = await context.storefront.query(CAMPAIGN_LIST_QUERY, {cache: context.storefront.CacheNone()});
      let nodes = dataList?.products?.nodes || [];
      if (!nodes.length) {
        const recent = await context.storefront.query(CAMPAIGN_RECENT_QUERY, {cache: context.storefront.CacheNone()});
        nodes = recent?.products?.nodes || [];
      }
      product = nodes.find((p: any) => {
        const s = p?.campaignSlug?.value || p?.campaignSlugCustom?.value;
        const sCustom = p?.campaignSlugCustomNs?.value;
        if (s && typeof s === 'string') return s === handle;
        if (sCustom && typeof sCustom === 'string') return sCustom === handle;
        const ids = p?.metafields || [];
        return ids.some((m: any) => (
          (m?.namespace === 'campaign' && m?.key === 'slug' && m?.value === handle) ||
          (m?.namespace === 'custom.campaign' && m?.key === 'slug' && m?.value === handle) ||
          (m?.namespace === 'custom' && m?.key === 'campaign_slug' && m?.value === handle)
        ));
      });
    } catch (e: any) {
      console.error('Storefront query error CAMPAIGN_LIST_QUERY', e?.message || e);
    }
  }
  const campaign = product ? productToCampaign(product) : null;
  if (!campaign) {
    throw new Response('Not found', {status: 404});
  }
  const variants = product?.variants?.nodes || [];
  const variantId = variants[0]?.id || '';
  
  // Get backers data from Shopify metafield - try both possible field names
  const backersJson = product?.campaignBackers?.value || product?.campaignBackersJsonCustomNs?.value || '';
  
  return {campaign, variantId, variants, backersJson};
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

export default function CampaignDetail() {
  const {campaign, variantId, variants, backersJson} = useLoaderData() as {
    campaign: Campaign; 
    variantId: string; 
    variants: Array<{id: string; title: string; availableForSale: boolean; price: {amount: string; currencyCode: string}}>;
    backersJson?: string
  };
  
  // Debug logging
  console.log('Campaign object:', campaign);
  console.log('Campaign description:', campaign.description);
  console.log('Campaign description_rich:', campaign.description_rich);
  
  const fetcher = useFetcher();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(variantId);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Open cart drawer when item is successfully added
  useEffect(() => {
    if (fetcher.data?.success) {
      open('cart');
      // Reset quantity after successful add
      setQuantity(1);
    }
  }, [fetcher.data, open]);
  
  const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Get price from selected variant or use campaign price
  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const variantPrice = selectedVariantData?.price?.amount ? parseFloat(selectedVariantData.price.amount) : (campaign.price || 30);
  const totalPrice = variantPrice * quantity;
  
  return (
    <div className="bg-white min-h-screen">
      {/* Campaign Header and Purchase Section */}
      <section className="w-full grid grid-cols-1 xl:grid-cols-3 border-b-2 border-black">
        {/* Left - Images Section */}
        <div className="xl:col-span-2 xl:border-r-2 border-black">
          <div className="flex flex-col lg:flex-row lg:h-[600px] w-full">
            {/* Thumbnail Gallery - Left side on desktop */}
            {campaign.images && campaign.images.length > 1 && (
              <div className="flex lg:flex-col gap-2 p-4 order-2 lg:order-1 lg:w-auto h-auto lg:h-[600px] lg:pt-0 overflow-x-scroll lg:overflow-x-visible lg:overflow-y-auto">
                <div className="flex lg:flex-col gap-2">
                  {campaign.images.slice(0, 6).map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 border-2 ${
                        selectedImage === idx ? 'border-black' : 'border-gray-300'
                      } hover:border-black transition-colors`}
                    >
                      <img
                        src={image.url}
                        alt={`${campaign.name} ${idx + 1}`}
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
                src={campaign.images?.[selectedImage]?.url || '/Dohhh-Cash-Celebrate.png'}
                alt={campaign.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="lg:p-12">
            <h1 className="text-4xl lg:text-6xl font-bold uppercase mb-4">
              {campaign.name}
            </h1>
            <div className="text-xl mb-6 uppercase">
              <CampaignStory campaign={{...campaign, story: campaign.description_rich || campaign.description || ''}} />
            </div>
          </div>
        </div>
        
        {/* Right - Purchase Section */}
        <div className="py-8 lg:p-8 lg:pl-8 lg:pr-12 lg:pt-0 lg:pb-12 w-full xl:col-span-1">
          <h2 className="text-2xl uppercase mb-2 lg:mt-0">BACK THIS CAMPAIGN</h2>
          <p className="text-3xl font-bold uppercase mb-8">${variantPrice.toFixed(2)}</p>
          
          <fetcher.Form method="post" className="space-y-8 w-full max-w-2xl">
            <input type="hidden" name="variantId" value={selectedVariant} />
            
            {/* Variant Selector - Only show if multiple variants */}
            {variants.length > 1 && (
              <div className="w-full">
                <label className="text-xl uppercase mb-4 block">SELECT OPTION</label>
                <div className="space-y-4">
                  {variants.map((variant) => (
                    <label 
                      key={variant.id}
                      className={`block border-2 border-black p-6 cursor-pointer transition-colors ${
                        selectedVariant === variant.id ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                      } ${!variant.availableForSale ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={variant.id}
                        checked={selectedVariant === variant.id}
                        onChange={() => setSelectedVariant(variant.id)}
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
                  className="flex-1 border-t-2 border-b-2 border-black px-4 lg:px-8 py-6 text-2xl text-center my-0 rounded-none"
                  style={{
                    borderLeft: 'none',
                    borderRight: 'none',
                    marginTop: '0',
                    marginBottom: '0',
                    borderRadius: '0'
                  }}
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
          
          {/* Campaign details */}
          <div className="mt-12 pt-8 border-t-2 border-black space-y-2">
            <p className="text-lg">CAMPAIGN ENDS: {new Date(campaign.goal.deadline).toLocaleDateString().toUpperCase()}</p>
            <p className="text-lg">SHIPS FROM: HUNTINGTON BEACH, CA</p>
            <p className="text-lg">100% GOES TO CAMPAIGN</p>
          </div>
        </div>
      </section>
      
      {/* Stats Grid */}
      <section className="w-full grid grid-cols-2 lg:grid-cols-6 border-b-2 border-black">
        <div className="p-8 lg:p-12 border-r-2 border-b-2 lg:border-b-0 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            {campaign.progress.percentage}%
          </p>
          <p className="text-lg uppercase">FUNDED</p>
        </div>
        <div className="p-8 lg:p-12 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            {campaign.progress.currentQuantity}
          </p>
          <p className="text-lg uppercase">COOKIES</p>
        </div>
        <div className="p-8 lg:p-12 border-r-2 border-b-2 lg:border-b-0 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            {campaign.progress.backerCount}
          </p>
          <p className="text-lg uppercase">BACKERS</p>
        </div>
        <div className="p-8 lg:p-12 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            {daysLeft}
          </p>
          <p className="text-lg uppercase">DAYS LEFT</p>
        </div>
        <div className="p-8 lg:p-12 border-r-2 lg:border-r-2 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            ${campaign.progress.totalRaised.toFixed(2)}
          </p>
          <p className="text-lg uppercase">RAISED</p>
        </div>
        <div className="p-8 lg:p-12 border-black">
          <p className="text-4xl lg:text-5xl font-bold mb-2">
            ${campaign.progress.backerCount > 0 ? (campaign.progress.totalRaised / campaign.progress.backerCount).toFixed(0) : '0'}
          </p>
          <p className="text-lg uppercase">AVG/BACKER</p>
        </div>
      </section>
      
      {/* Progress Bar */}
      <section className="w-full px-4 lg:px-8 py-8 lg:py-16">
        <div className="border-2 border-black h-16">
          <div 
            className="bg-black h-full transition-all duration-500" 
            style={{width: `${campaign.progress.percentage}%`}}
          />
        </div>
        <div className="flex justify-between mt-6">
          <p className="text-xl uppercase">
            GOAL: {campaign.goal.quantity} COOKIES
          </p>
          <p className="text-xl uppercase">
            DEADLINE: {new Date(campaign.goal.deadline).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }).toUpperCase()}
          </p>
        </div>
      </section>
      
      {/* Campaign Mission Section - Similar to DOHHH Way */}
      <section className="w-full bg-white border-b-2 border-black">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left - Image/Video */}
            <div className="border-b-2 lg:border-b-0 lg:border-r-2 border-black">
              {campaign.video ? (
                <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] bg-black">
                  <iframe
                    src={campaign.video}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={campaign.images?.[1]?.url || campaign.images?.[0]?.url || "/cash-lifting-gym.png"}
                  alt={`${campaign.name} Mission`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Right - Content */}
            <div className="py-8 lg:p-12">
              <h2 className="text-3xl lg:text-5xl font-bold uppercase mb-8 border-b-2 border-black pb-4">
                THE CAMPAIGN MISSION
              </h2>
              
              <div className="space-y-6">
                {/* Campaign Promise */}
                <div className="border-2 border-black p-6 bg-yellow-50">
                  <h3 className="text-2xl font-bold uppercase mb-3">MAKING IMPACT, ONE COOKIE AT A TIME</h3>
                  <p className="text-lg uppercase leading-relaxed">
                    <CampaignStory campaign={campaign} />
                  </p>
                </div>
                
                {/* Three Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">01</div>
                    <h4 className="font-bold uppercase mb-1">DIRECT IMPACT</h4>
                    <p className="text-sm uppercase">100% of proceeds go to the cause</p>
                  </div>
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">02</div>
                    <h4 className="font-bold uppercase mb-1">TRANSPARENT</h4>
                    <p className="text-sm uppercase">Track every cookie, every dollar</p>
                  </div>
                  <div className="border-2 border-black p-4 hover:bg-black hover:text-white transition-colors">
                    <div className="text-4xl font-bold mb-2">03</div>
                    <h4 className="font-bold uppercase mb-1">COMMUNITY</h4>
                    <p className="text-sm uppercase">Join backers making a difference</p>
                  </div>
                </div>
                
                {/* The Impact */}
                <div className="border-l-8 border-black pl-6 py-2">
                  <h4 className="font-bold uppercase mb-1">
                    YOUR CONTRIBUTION MATTERS
                  </h4>
                  <p className="text-lg uppercase leading-relaxed">
                  This isn't just any competition – it's the American Open, where the nation's top weightlifters gather to compete. For Cash, it's the culmination of years of training, dedication, and early morning gym sessions. Your support helps a young athlete chase his Olympic dreams while building his entrepreneurial spirit.
                  </p>
                </div>
                
                {/* Call to Action */}
                <div className="bg-black text-white p-6">
                  <p className="text-2xl font-bold uppercase text-center">
                    {daysLeft > 0 ? `${daysLeft} DAYS LEFT TO MAKE A DIFFERENCE` : 'CAMPAIGN ENDING SOON'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Campaign Highlights Section */}
      <section className="w-full bg-white border-b-2 border-black">
        <div className="w-full px-4 lg:px-8 py-8 lg:py-12">
          <h2 className="text-3xl lg:text-5xl font-bold uppercase mb-8">
            CAMPAIGN HIGHLIGHTS
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Highlight 1 - Why This Matters */}
            <div className="border-2 border-black">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {campaign.images?.[2] ? (
                  <img
                    src={campaign.images[2].url}
                    alt="Why This Matters"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">🎯</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold uppercase mb-3">ONE BIG DREAM</h3>
                <p className="text-base uppercase leading-relaxed">
                We need to sell {campaign.goal.quantity} cookies to fully fund Cash's Texas adventure.
                </p>
              </div>
            </div>
            
            {/* Highlight 2 - The Goal */}
            <div className="border-2 border-black">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {campaign.images?.[3] ? (
                  <img
                    src={campaign.images[3].url}
                    alt="The Goal"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">🚀</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold uppercase mb-3">WHAT YOU GET</h3>
                <p className="text-base uppercase leading-relaxed">
                Each cookie is crafted with premium ingredients and the determination of someone who knows what it takes to achieve big goals.
                </p>
              </div>
            </div>
            
            {/* Highlight 3 - The Impact */}
            <div className="border-2 border-black">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {campaign.images?.[4] ? (
                  <img
                    src={campaign.images[4].url}
                    alt="The Impact"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">💪</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold uppercase mb-3">JOIN TEAM CASH</h3>
                <p className="text-base uppercase leading-relaxed">
                Every cookie brings him one step closer to that competition platform in Fort Worth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Impact Metrics Section */}
      <section className="w-full bg-white border-b-2 border-black py-12">
        <div className="w-full">
          <h2 className="text-3xl lg:text-5xl font-bold uppercase mb-8 text-center">
            CAMPAIGN IMPACT
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 px-4 lg:px-8">
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">100%</div>
              <p className="text-sm lg:text-base uppercase font-bold">Goes to Cause</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">{campaign.progress.backerCount}</div>
              <p className="text-sm lg:text-base uppercase font-bold">Supporters</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">{campaign.progress.currentQuantity}</div>
              <p className="text-sm lg:text-base uppercase font-bold">Cookies Sold</p>
            </div>
            <div className="text-center border-2 border-black p-4 lg:p-6">
              <div className="text-3xl lg:text-4xl font-bold mb-2">{daysLeft}</div>
              <p className="text-sm lg:text-base uppercase font-bold">Days to Go</p>
            </div>
          </div>
        </div>
      </section>

      {/* Backers Section */}
      <section className="w-full">
        <div className="px-4 py-8 lg:p-12">
          <h2 className="text-4xl lg:text-5xl font-bold uppercase mb-8">CAMPAIGN BACKERS</h2>
          <BackersDisplay backersJson={backersJson || ''} />
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}