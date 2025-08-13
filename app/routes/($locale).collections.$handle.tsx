import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction, Link, useSearchParams} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {useState} from 'react';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction<typeof loader> = ({data}) => {
  const collection = data?.collection;
  const productCount = collection?.products?.nodes?.length || 0;
  
  return [
    {title: `${collection?.title ?? ''} | DOHHH Collection`},
    {name: 'description', content: collection?.description || `Explore our ${collection?.title} collection. ${productCount} perfectly imperfect, handcrafted cookies available.`},
    {
      rel: 'canonical',
      href: `https://www.dohhh.shop/collections/${collection?.handle}`,
    },
    
    // Open Graph tags
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${collection?.title} | DOHHH Collection`},
    {property: 'og:description', content: collection?.description || `Shop our ${collection?.title} collection of handcrafted cookies.`},
    {property: 'og:url', content: `https://www.dohhh.shop/collections/${collection?.handle}`},
    {property: 'og:image', content: 'https://www.dohhh.shop/dohhh-share.png'},
    {property: 'og:site_name', content: 'DOHHH'},
    
    // Twitter Card tags
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:site', content: '@dohhh_dohhh'},
    {name: 'twitter:title', content: `${collection?.title} Collection | DOHHH`},
    {name: 'twitter:description', content: `${productCount} products in our ${collection?.title} collection.`},
    {name: 'twitter:image', content: 'https://www.dohhh.shop/dohhh-share.png'},
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  
  const url = new URL(request.url);
  const sortKey = url.searchParams.get('sort') || 'TITLE';
  const reverse = url.searchParams.get('reverse') === 'true';

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle, 
        ...paginationVariables,
        sortKey,
        reverse,
      },
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const currentSort = searchParams.get('sort') || 'TITLE';
  const showAvailable = searchParams.get('available') === 'true';
  
  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
  
  const handleSort = (value: string) => {
    const [sortKey, reverse] = value.split('-');
    updateParam('sort', sortKey);
    updateParam('reverse', reverse || null);
  };
  
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };
  
  const activeFiltersCount = [showAvailable].filter(Boolean).length;
  
  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <section className="w-full px-8 py-16 border-b-2 border-black">
        <h1 className="text-6xl lg:text-8xl font-bold uppercase">{collection.title}</h1>
        {collection.description && (
          <p className="text-xl mt-4">{collection.description}</p>
        )}
        <p className="text-xl mt-2">{collection.products.nodes.length} PRODUCTS AVAILABLE</p>
      </section>
      
      {/* Controls Bar */}
      <section className="w-full border-b-2 border-black">
        <div className="flex flex-col lg:flex-row">
          {/* Left - Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between px-4 lg:px-8 py-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black hover:bg-black hover:text-white transition-colors lg:min-w-[200px]"
          >
            <span className="text-lg uppercase">
              FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            <span className="text-2xl">{showFilters ? '−' : '+'}</span>
          </button>
          
          {/* Center - Sort */}
          <div className="flex-1 px-4 lg:px-8 py-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
            <select
              value={`${currentSort}${searchParams.get('reverse') === 'true' ? '-true' : ''}`}
              onChange={(e) => handleSort(e.target.value)}
              className="w-full text-lg uppercase bg-transparent outline-none cursor-pointer"
            >
              <option value="TITLE">NAME: A-Z</option>
              <option value="TITLE-true">NAME: Z-A</option>
              <option value="PRICE">PRICE: LOW TO HIGH</option>
              <option value="PRICE-true">PRICE: HIGH TO LOW</option>
              <option value="CREATED_AT-true">NEWEST FIRST</option>
              <option value="BEST_SELLING">BEST SELLING</option>
            </select>
          </div>
          
          {/* Right - View Toggle */}
          <div className="flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 lg:px-8 py-6 border-r-2 border-black transition-colors ${
                viewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
              }`}
            >
              <span className="text-lg uppercase">GRID</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 lg:px-8 py-6 transition-colors ${
                viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
              }`}
            >
              <span className="text-lg uppercase">LIST</span>
            </button>
          </div>
        </div>
      </section>
      
      {/* Filters Panel */}
      {showFilters && (
        <section className="w-full border-b-2 border-black">
          <div className="grid grid-cols-1 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-black">
            {/* Availability Filter */}
            <div className="p-6 lg:p-8">
              <h3 className="text-xl uppercase mb-4">AVAILABILITY</h3>
              <label className="flex items-center cursor-pointer hover:font-bold">
                <input
                  type="checkbox"
                  checked={showAvailable}
                  onChange={(e) => updateParam('available', e.target.checked ? 'true' : null)}
                  className="mr-3 w-5 h-5 border-2 border-black"
                />
                <span className="uppercase">IN STOCK ONLY</span>
              </label>
            </div>
            
            {/* Clear Filters */}
            <div className="p-6 lg:p-8 lg:col-span-3 flex items-center">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-lg uppercase border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
                >
                  CLEAR ALL FILTERS
                </button>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Products Display */}
      {viewMode === 'grid' ? (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {collection.products.nodes.map((product: any, idx: number) => (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className="group border-b-2 border-r-2 border-black hover:bg-gray-50 transition-colors"
            >
              {/* Product Image */}
              <div className="h-80 lg:h-96 w-full overflow-hidden">
                <img
                  src={product.featuredImage?.url || '/placeholder.png'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Product Info */}
              <div className="p-6 lg:p-8">
                <h3 className="text-2xl font-bold uppercase mb-2 group-hover:underline">
                  {product.title}
                </h3>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">
                    ${product.priceRange.minVariantPrice.amount}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="w-full">
          {collection.products.nodes.map((product: any) => (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              className="group flex flex-col lg:flex-row border-b-2 border-black hover:bg-gray-50 transition-colors"
            >
              {/* Product Image */}
              <div className="w-full lg:w-64 h-64 lg:h-48 overflow-hidden border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                <img
                  src={product.featuredImage?.url || '/placeholder.png'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Product Info */}
              <div className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="mb-4 lg:mb-0">
                  <h3 className="text-2xl lg:text-3xl font-bold uppercase mb-2 group-hover:underline">
                    {product.title}
                  </h3>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-3xl font-bold">
                    ${product.priceRange.minVariantPrice.amount}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
      
      {/* Empty State */}
      {collection.products.nodes.length === 0 && (
        <section className="w-full px-8 py-24 text-center">
          <h2 className="text-4xl font-bold uppercase mb-4">NO PRODUCTS FOUND</h2>
          <p className="text-xl mb-8">TRY ADJUSTING YOUR FILTERS</p>
          <button 
            onClick={clearFilters}
            className="inline-block text-xl border-2 border-black px-12 py-6 hover:bg-black hover:text-white transition-colors"
          >
            CLEAR FILTERS
          </button>
        </section>
      )}
      
      {/* Pagination */}
      {(collection.products.pageInfo.hasPreviousPage || collection.products.pageInfo.hasNextPage) && (
        <section className="w-full border-t-2 border-black">
          <div className="flex justify-between items-center px-4 lg:px-8 py-8">
            {collection.products.pageInfo.hasPreviousPage ? (
              <Link
                to={collection.products.pageInfo.startCursor ? `?cursor=${collection.products.pageInfo.startCursor}&direction=previous` : ''}
                className="text-xl uppercase border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-colors"
              >
                ← PREVIOUS
              </Link>
            ) : (
              <div />
            )}
            {collection.products.pageInfo.hasNextPage ? (
              <Link
                to={collection.products.pageInfo.endCursor ? `?cursor=${collection.products.pageInfo.endCursor}` : ''}
                className="text-xl uppercase border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-colors"
              >
                NEXT →
              </Link>
            ) : (
              <div />
            )}
          </div>
        </section>
      )}
      
      {/* Footer */}
      <Footer />
      
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
