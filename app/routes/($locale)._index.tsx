import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from 'react-router';
import {useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';
import {CAMPAIGN_LIST_QUERY} from '~/graphql/campaigns/ProductCampaignFragments';
import {productToCampaign} from '~/lib/campaigns.server';
import type {Campaign} from '~/lib/campaigns';
import {RichText} from '~/components/campaigns/RichText';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction = () => {
  return [
    {title: 'DOHHH - Perfectly Imperfect Cookies for Important Causes'},
    {name: 'description', content: 'DOHHH makes perfectly imperfect cookies for perfectly important causes. Small batch, handcrafted cookies that support meaningful campaigns and make a difference.'},
    {name: 'keywords', content: 'cookies, handcrafted cookies, small batch cookies, charity cookies, campaign cookies, DOHHH, perfectly imperfect, Huntington Beach'},
    
    // Open Graph tags for social sharing
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'DOHHH - Perfectly Imperfect Cookies for Important Causes'},
    {property: 'og:description', content: 'We make perfectly imperfect cookies for perfectly important causes. Because the best stories - and cookies - are beautifully human.'},
    {property: 'og:url', content: 'https://www.dohhh.shop'},
    {property: 'og:site_name', content: 'DOHHH'},
    {property: 'og:image', content: 'https://www.dohhh.shop/dohhh-share.png'},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:locale', content: 'en_US'},
    
    // Twitter Card tags
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:site', content: '@dohhh_dohhh'},
    {name: 'twitter:title', content: 'DOHHH - Perfectly Imperfect Cookies'},
    {name: 'twitter:description', content: 'Small batch, handcrafted cookies that support meaningful campaigns and make a difference.'},
    {name: 'twitter:image', content: 'https://www.dohhh.shop/dohhh-share.png'},
    
    // Additional SEO tags
    {name: 'robots', content: 'index, follow'},
    {name: 'author', content: 'DOHHH'},
    {name: 'viewport', content: 'width=device-width, initial-scale=1'},
    {httpEquiv: 'content-language', content: 'en-US'},
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  
  // Get campaigns
  let campaignsRes: any = null;
  try {
    campaignsRes = await args.context.storefront.query(CAMPAIGN_LIST_QUERY);
  } catch (e: any) {
    console.error('Storefront query error on home CAMPAIGN_LIST_QUERY', e?.message || e);
  }
  
  const allProducts = campaignsRes?.products?.nodes || [];
  const campaigns: Campaign[] = allProducts
    .map(productToCampaign)
    .filter(Boolean) as Campaign[];
  
  // Get regular products (non-campaigns)
  let regularProductsRes: any = null;
  try {
    regularProductsRes = await args.context.storefront.query(REGULAR_PRODUCTS_QUERY);
  } catch (e: any) {
    console.error('Storefront query error on home REGULAR_PRODUCTS_QUERY', e?.message || e);
  }
  
  const regularProducts = regularProductsRes?.products?.nodes || [];
  
  return {...deferredData, ...criticalData, campaigns, regularProducts};
}

async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);
  return {featuredCollection: collections.nodes[0]};
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      console.error(error);
      return null;
    });
  return {recommendedProducts};
}

// FAQ Accordion Component
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0); // First question open by default
  
  const faqs = [
    {
      question: "HOW DOES COOKIE CROWDFUNDING WORK?",
      answer: "It's beautifully simple! Cookie lovers launch campaigns for their perfectly imperfect creations, and dreamers like you back them by pre-ordering small batches. Once we hit the goal, we handcraft every Dohhh-licious cookie and deliver them fresh. It's like Kickstarter, but way more delicious - and guaranteed to make you smile with every bite."
    },
    {
      question: "WHEN WILL I RECEIVE MY COOKIES?",
      answer: "Good things take time! Each campaign shows its deadline and estimated delivery date right on the page. Typically, your handcrafted cookies arrive 1-2 weeks after a campaign closes successfully. We'll send tracking info once your small-batch order ships from our California bakery - because waiting is easier when you know your Dohhh-licious treats are on the way."
    },
    {
      question: "WHAT HAPPENS IF A CAMPAIGN DOESN'T REACH ITS GOAL?",
      answer: "We believe every dream deserves a chance! Even if a campaign doesn't hit its original goal by the deadline, we're committed to making it happen anyway. We'll handcraft those perfectly imperfect cookies in whatever quantities were backed - because supporting dreamers is what we're all about. Your small-batch order will still be Dohhh-licious, and every backer still gets their cookies. Sometimes the best stories aren't about hitting targets, they're about showing up for each other."
    },
    {
      question: "CAN I BACK MULTIPLE CAMPAIGNS?",
      answer: "Absolutely! Go ahead and be a serial backer - we love cookie enthusiasts who support multiple dreams. Each campaign is tracked separately, so you'll get updates on all your perfectly imperfect investments. Many of our biggest supporters have backed dozens of Dohhh-licious campaigns. Don't be a Dohhh-Dohhh - spread the love!"
    },
    {
      question: "ARE THE COOKIES MADE FRESH?",
      answer: "Always! Every single cookie is handcrafted fresh to order once campaigns close successfully. No frozen dough, no shortcuts, no compromises. Just premium ingredients, small-batch love, and perfectly imperfect cookies shipped at peak Dohhh-liciousness. Because life's too short for stale cookies."
    },
    {
      question: "DO YOU SHIP INTERNATIONALLY?",
      answer: "Not yet, but we're dreaming big! Right now we ship within the US only, but we're working on bringing our handcrafted, perfectly imperfect cookies to cookie lovers worldwide. Sign up for our newsletter so you'll be the first to know when we go global - because everyone deserves Dohhh-licious dreams."
    }
  ];
  
  return (
    <section className="w-full">
      <div className="px-8 py-16 border-t-2 border-black">
        <h2 className="font-bold uppercase" style={{fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '3rem', marginTop: '0', lineHeight: '1'}}>FAQ</h2>
      </div>
      
      <div className="w-full">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b-2 border-black">
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              className="w-full px-8 py-8 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
            >
              <span className="text-xl lg:text-2xl font-bold uppercase pr-4">
                {faq.question}
              </span>
              <span className="text-3xl flex-shrink-0">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            
            {openIndex === index && (
              <div className="px-8 py-8 bg-gray-50">
                <p className="text-lg uppercase">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div className="bg-white min-h-screen">
      {/* NEW HERO SECTION - Cookie Focused */}
      <section className="w-full border-b-2 border-black">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Bold Statement */}
          <div className="bg-black text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-center border-b-2 lg:border-b-0 lg:border-r-2 border-black min-h-[600px] lg:min-h-[700px]">
            <h1 
              className="font-bold uppercase tracking-tighter"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                lineHeight: '0.85',
                marginBottom: '2.5rem',
                marginTop: '0',
                fontWeight: '700'
              }}
            >
              PERFECTLY<br/>
              IMPERFECT<br/>
              COOKIES
            </h1>
            <div className="mb-12">
              <p className="text-xl lg:text-xl xl:text-2xl uppercase leading-tight">
                FOUR FLAVORS, ZERO COMPROMISES. MADE WITH INTENTION FOR PEOPLE WHO KNOW THE DIFFERENCE BETWEEN REAL COOKIES AND WHATEVER THEY'RE SELLING AT THE GROCERY STORE.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/collections/cookies"
                className="inline-block text-center text-lg border-2 border-white px-8 py-4 bg-white text-black hover:bg-transparent hover:text-white transition-colors uppercase font-bold"
              >
                SHOP COOKIES NOW
              </Link>
              <Link 
                to="/campaigns"
                className="inline-block text-center text-lg border-2 border-white px-8 py-4 text-white bg-black hover:bg-white hover:text-black transition-colors uppercase font-bold"
              >
                VIEW CAMPAIGNS
              </Link>
            </div>
          </div>
          
          {/* Right Side - Featured Cookie Grid */}
          <div className="grid grid-cols-2">
            {/* Top Left - Image */}
            <div className="border-b-2 border-r-2 border-black h-64 lg:h-96 bg-gray-100">
              <img 
                src="/CTA-cookie.png" 
                alt="Featured Cookie" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Top Right - Stats */}
            <div className="border-b-2 border-black p-6 lg:p-8 flex flex-col justify-center bg-amber-600 text-white">
              <p className="text-5xl lg:text-6xl font-bold">4</p>
              <p className="text-lg uppercase font-bold">FLAVORS</p>
              <p className="text-sm uppercase mt-2">AVAILABLE NOW</p>
            </div>
            {/* Bottom Left - Message */}
            <div className="border-r-2 border-black p-6 lg:p-8 flex flex-col justify-center">
              <p className="text-2xl lg:text-3xl font-bold uppercase">FREE SHIPPING</p>
              <p className="text-sm uppercase mt-2">ON ORDERS $100</p>
            </div>
            {/* Bottom Right - Image */}
            <div className="h-64 lg:h-96 bg-gray-100">
              <img 
                src="/the_dohhh_way.png" 
                alt="Cookie Collection" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Bar */}
      <section className="w-full bg-black text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white">
          <div className="p-8 text-center">
            <p className="text-4xl mb-2">🍪</p>
            <p className="text-lg font-bold uppercase">SMALL BATCH</p>
            <p className="text-sm uppercase mt-1">HANDCRAFTED WITH LOVE</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-lg font-bold uppercase">FRESH DELIVERY</p>
            <p className="text-sm uppercase mt-1">STRAIGHT FROM OUR BAKERY</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-4xl mb-2">💛</p>
            <p className="text-lg font-bold uppercase">GIVE BACK</p>
            <p className="text-sm uppercase mt-1">SUPPORT IMPORTANT CAUSES</p>
          </div>
        </div>
      </section>
      
      {/* Regular Products Section - Moved Up */}
      {data.regularProducts.length > 0 && (
        <>
          <section className="w-full px-8 py-16 border-b-2 border-black">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-bold uppercase" style={{fontSize: 'clamp(3rem, 6vw, 5rem)', marginBottom: '0', marginTop: '0', lineHeight: '1'}}>SHOP COOKIES</h2>
                <p className="text-xl mt-4 uppercase">{data.regularProducts.length} DELICIOUS OPTIONS</p>
              </div>
              <Link 
                to="/collections/cookies"
                className="hidden lg:inline-block text-lg border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors uppercase font-bold"
              >
                VIEW ALL →
              </Link>
            </div>
          </section>
          
          <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.regularProducts.slice(0, 6).map((product: any, idx: number) => (
              <Link
                key={product.id}
                to={`/products/${product.handle}`}
                className={`block border-b-2 border-black ${idx % 3 !== 2 ? 'lg:border-r-2' : ''} ${idx % 2 !== 1 ? 'md:border-r-2 lg:border-r-2' : 'md:border-r-0'} hover:bg-gray-50 transition-colors group`}
              >
                <div className="h-80 lg:h-96 overflow-hidden">
                  {product.featuredImage && (
                    <img
                      src={product.featuredImage.url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-8">
                  <h3 className="font-bold uppercase" style={{fontSize: '1.5rem', marginBottom: '0.5rem', marginTop: '0', lineHeight: '1.1'}}>{product.title}</h3>
                  <p className="text-xl font-bold">
                    ${product.priceRange?.minVariantPrice?.amount || '0'}
                  </p>
                  <p className="text-sm uppercase mt-2 text-gray-600">ADD TO CART →</p>
                </div>
              </Link>
            ))}
          </section>
          
          {data.regularProducts.length > 6 && (
            <section className="w-full border-b-2 border-black">
              <Link 
                to="/collections/cookies"
                className="block p-8 text-center hover:bg-gray-50 transition-colors"
              >
                <p className="text-2xl font-bold uppercase">VIEW ALL {data.regularProducts.length} PRODUCTS →</p>
              </Link>
            </section>
          )}
        </>
      )}
      
      {/* Campaigns Section - Moved Down and Made Smaller */}
      {data.campaigns.length > 0 && (
        <>
          <section className="w-full px-8 py-16 border-b-2 border-black bg-gray-50">
            <h2 className="font-bold uppercase" style={{fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '0', marginTop: '0', lineHeight: '1'}}>ACTIVE CAMPAIGNS</h2>
            <p className="text-xl mt-4 uppercase">BACK A COOKIE DREAM</p>
          </section>
          
          <section className="w-full">
            {data.campaigns.map((campaign, idx) => {
          const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <Link 
              key={campaign.id}
              to={`/campaigns/${campaign.slug}`}
              className="block border-b-2 border-black transition-colors hover:bg-gray-50 group"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 p-6 lg:p-8">
                {/* Image */}
                <div className="md:col-span-3 mb-4 md:mb-0">
                  <div className="h-48 md:h-32 lg:h-40">
                    <img
                      src={campaign.images?.[0]?.url || '/Dohhh-Cash-Celebrate.png'}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Content */}
                <div className="md:col-span-6 md:px-6">
                  <h3 className="font-bold uppercase" style={{fontSize: '1.5rem', marginBottom: '0.5rem', marginTop: '0', lineHeight: '1.1'}}>
                    {campaign.name}
                  </h3>
                  <p className="text-sm uppercase text-gray-600 mb-3 line-clamp-2">
                    {campaign.description || 'Support this cookie campaign'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="font-bold">{campaign.progress.percentage}% FUNDED</span>
                    <span>•</span>
                    <span>{campaign.progress.backerCount} BACKERS</span>
                    <span>•</span>
                    <span>{daysLeft} DAYS LEFT</span>
                  </div>
                </div>
                
                {/* Progress & CTA */}
                <div className="md:col-span-3 flex flex-col justify-center mt-4 md:mt-0">
                  <div className="border-2 border-black h-8 mb-3">
                    <div 
                      className="bg-black h-full transition-all duration-500" 
                      style={{width: `${campaign.progress.percentage}%`}}
                    />
                  </div>
                  <p className="text-sm uppercase text-center font-bold group-hover:underline">
                    VIEW CAMPAIGN →
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
          </section>
        </>
      )}
      
      {/* FAQ Section */}
      <FAQAccordion />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

function FeaturedCollection({collection}: {collection: FeaturedCollectionFragment}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link className="featured-collection" to={`/collections/${collection.handle}`}>
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}


const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image { id url altText width height }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes { ...FeaturedCollection }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product { id title handle priceRange { minVariantPrice { amount currencyCode } } featuredImage { id url altText width height } }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) { nodes { ...RecommendedProduct } }
  }
` as const;

const REGULAR_PRODUCTS_QUERY = `#graphql
  query RegularProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 12, sortKey: UPDATED_AT, reverse: true, query: "NOT tag:campaign") { 
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