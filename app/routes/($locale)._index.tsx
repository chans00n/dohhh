import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from 'react-router';
import {Suspense, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment, RecommendedProductsQuery} from 'storefrontapi.generated';
import {CAMPAIGN_LIST_QUERY} from '~/graphql/campaigns/ProductCampaignFragments';
import {productToCampaign} from '~/lib/campaigns.server';
import type {Campaign} from '~/lib/campaigns';
import {RichText} from '~/components/campaigns/RichText';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction = () => {
  return [{title: 'DOHHH'}];
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
      answer: "Cookie crowdfunding allows passionate bakers to launch campaigns for their unique cookie creations. Backers support campaigns by pre-ordering cookies, and once the funding goal is met, the cookies are baked and delivered. It's a way to bring innovative cookie ideas to life while building a community of cookie enthusiasts."
    },
    {
      question: "WHEN WILL I RECEIVE MY COOKIES?",
      answer: "Delivery times vary by campaign. Each campaign has a specific deadline and estimated delivery date listed on its page. Typically, cookies are delivered 2-4 weeks after a campaign successfully closes. You'll receive tracking information once your order ships from our bakery in Austin, TX."
    },
    {
      question: "WHAT HAPPENS IF A CAMPAIGN DOESN'T REACH ITS GOAL?",
      answer: "If a campaign doesn't reach its funding goal by the deadline, all backers are automatically refunded in full. No cookies are produced, and no charges are finalized. We only move forward with production when a campaign is fully funded to ensure quality and sustainability."
    },
    {
      question: "CAN I BACK MULTIPLE CAMPAIGNS?",
      answer: "Absolutely! You can back as many campaigns as you'd like. Each campaign is tracked separately, and you'll receive updates for each one you support. Many of our backers enjoy discovering and supporting multiple unique cookie creations."
    },
    {
      question: "ARE THE COOKIES MADE FRESH?",
      answer: "Yes, all cookies are made fresh to order once a campaign closes successfully. We never use frozen dough or pre-made cookies. Each batch is crafted with premium ingredients and shipped at peak freshness to ensure the best possible taste and texture."
    },
    {
      question: "DO YOU SHIP INTERNATIONALLY?",
      answer: "Currently, we ship within the United States only. We're working on expanding our shipping capabilities to serve cookie lovers worldwide. Sign up for our newsletter to be notified when international shipping becomes available."
    }
  ];
  
  return (
    <section className="w-full">
      <div className="px-8 py-16 border-t-2 border-black">
        <h2 className="text-6xl lg:text-8xl font-bold uppercase mb-12">FAQ</h2>
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
                <p className="text-lg">
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
      {/* Campaigns Section */}
      <section className="w-full">
        {data.campaigns.map((campaign, idx) => {
          const daysLeft = Math.ceil((new Date(campaign.goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          return (
            <div 
              key={campaign.id}
              className="border-b-2 border-black transition-colors group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 group-hover:bg-gray-50">
                {/* Image */}
                <Link 
                  to={`/campaigns/${campaign.slug}`}
                  className="lg:col-span-4 block"
                >
                  <div className="h-96 lg:h-auto">
                    <img
                      src={campaign.images?.[0]?.url || '/Dohhh-Cash-Celebrate.png'}
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                
                {/* Content */}
                <div className="lg:col-span-5 px-4 py-8 md:p-8 lg:p-12 lg:border-r-2 lg:border-black">
                  <h2 className="text-3xl lg:text-4xl font-bold uppercase mb-4">
                    {campaign.name}
                  </h2>
                  <div className="text-lg mb-6">
                    {campaign.story && campaign.story.trim().startsWith('{') ? (
                      <RichText json={campaign.story} />
                    ) : campaign.story ? (
                      <div dangerouslySetInnerHTML={{ __html: campaign.story }} />
                    ) : (
                      <p>{campaign.description}</p>
                    )}
                  </div>
                  <Link 
                    to={`/campaigns/${campaign.slug}`}
                    className="inline-block text-lg border-2 w-full border-black px-6 py-3 bg-white text-black hover:bg-neutral-400 hover:text-white transition-colors"
                  >
                    BACK THIS CAMPAIGN →
                  </Link>
                </div>
                
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1">
                  <div className="p-6 border-r lg:border-r-0 lg:border-b-2 border-black">
                    <p className="text-3xl font-bold">{campaign.progress.percentage}%</p>
                    <p className="text-sm uppercase">FUNDED</p>
                  </div>
                  <div className="p-6 lg:border-b-2 border-black">
                    <p className="text-3xl font-bold">{campaign.progress.backerCount}</p>
                    <p className="text-sm uppercase">BACKERS</p>
                  </div>
                  <div className="p-6 border-r lg:border-r-0 lg:border-b-2 border-black border-t-2 lg:border-t-0">
                    <p className="text-3xl font-bold">{daysLeft}</p>
                    <p className="text-sm uppercase">DAYS LEFT</p>
                  </div>
                  <div className="p-6 border-t-2 lg:border-t-0">
                    <p className="text-3xl font-bold">${campaign.progress.totalRaised.toFixed(2)}</p>
                    <p className="text-sm uppercase">RAISED</p>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="px-4 md:px-8 py-8 group-hover:bg-gray-50">
                <div className="border-2 border-black h-12">
                  <div 
                    className="bg-black h-full transition-all duration-500" 
                    style={{width: `${campaign.progress.percentage}%`}}
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <p className="text-lg">
                    {campaign.progress.currentQuantity} / {campaign.goal.quantity} COOKIES
                  </p>
                  <p className="text-lg">
                    DEADLINE: {new Date(campaign.goal.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>
      
      {/* Regular Products Section */}
      {data.regularProducts.length > 0 && (
        <>
          <section className="w-full px-8 py-16 border-b-2 border-black">
            <h2 className="text-6xl lg:text-8xl font-bold uppercase">SHOP</h2>
            <p className="text-xl mt-4">{data.regularProducts.length} PRODUCTS AVAILABLE</p>
          </section>
          
          <section className="w-full grid grid-cols-1 lg:grid-cols-3">
            {data.regularProducts.map((product: any, idx: number) => (
              <Link
                key={product.id}
                to={`/products/${product.handle}`}
                className={`block border-b-2 border-black ${idx % 3 !== 2 ? 'lg:border-r-2' : ''} hover:bg-gray-50 transition-colors`}
              >
                <div className="h-96">
                  {product.featuredImage && (
                    <img
                      src={product.featuredImage.url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold uppercase mb-2">{product.title}</h3>
                  <p className="text-xl font-bold">
                    ${product.priceRange?.minVariantPrice?.amount || '0'}
                  </p>
                </div>
              </Link>
            ))}
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

function RecommendedProducts({products}: {products: Promise<RecommendedProductsQuery | null>}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response ? response.products.nodes.map((product) => (
                <ProductItem key={product.id} product={product} />
              )) : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
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