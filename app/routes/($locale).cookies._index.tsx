import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction, useSearchParams} from 'react-router';
import {useState} from 'react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {Footer} from '~/components/Footer';

export const meta: MetaFunction = () => [{title: 'COOKIES | DOHHH'}];

export async function loader({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  
  const url = new URL(request.url);
  const sortKey = url.searchParams.get('sort') || 'TITLE';
  const reverse = url.searchParams.get('reverse') === 'true';
  const productType = url.searchParams.get('type') || '';
  const available = url.searchParams.get('available') === 'true';
  
  // Build query filter
  let query = 'NOT tag:campaign'; // Exclude campaign products
  if (productType) {
    query += ` AND product_type:"${productType}"`;
  }
  if (available) {
    query += ' AND available_for_sale:true';
  }
  
  const {products} = await context.storefront.query(PRODUCTS_QUERY, {
    variables: {
      ...paginationVariables,
      sortKey,
      reverse,
      query,
    },
  });
  
  // Get unique product types for filter
  const {productTypes} = await context.storefront.query(PRODUCT_TYPES_QUERY, {
    variables: {
      first: 100,
      query: 'NOT tag:campaign',
    },
  });
  
  const types = [...new Set(productTypes?.nodes?.map((p: any) => p.productType).filter(Boolean))];
  
  return {products, types};
}

export default function CookiesIndex() {
  const {products, types} = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const currentSort = searchParams.get('sort') || 'TITLE';
  const currentType = searchParams.get('type') || '';
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
  
  const activeFiltersCount = [currentType, showAvailable].filter(Boolean).length;
  
  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <section className="w-full px-8 py-16 border-b-2 border-black">
        <h1 className="text-6xl lg:text-8xl font-bold uppercase">COOKIES</h1>
        <p className="text-xl mt-4">{products.nodes.length} PRODUCTS AVAILABLE</p>
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
            {/* Product Type Filter */}
            <div className="p-6 lg:p-8">
              <h3 className="text-xl uppercase mb-4">PRODUCT TYPE</h3>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer hover:font-bold">
                  <input
                    type="radio"
                    name="type"
                    checked={!currentType}
                    onChange={() => updateParam('type', null)}
                    className="mr-3 w-5 h-5 border-2 border-black"
                  />
                  <span className="uppercase">ALL TYPES</span>
                </label>
                {types.map((type: string) => (
                  <label key={type} className="flex items-center cursor-pointer hover:font-bold">
                    <input
                      type="radio"
                      name="type"
                      checked={currentType === type}
                      onChange={() => updateParam('type', type)}
                      className="mr-3 w-5 h-5 border-2 border-black"
                    />
                    <span className="uppercase">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
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
            <div className="p-6 lg:p-8 lg:col-span-2 flex items-center">
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
          {products.nodes.map((product: any, idx: number) => (
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
                {product.vendor && (
                  <p className="text-sm uppercase mb-3">{product.vendor}</p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">
                    ${product.priceRange.minVariantPrice.amount}
                  </p>
                  {!product.availableForSale && (
                    <span className="text-sm uppercase border border-black px-3 py-1">SOLD OUT</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="w-full">
          {products.nodes.map((product: any) => (
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
                  {product.vendor && (
                    <p className="text-lg uppercase">{product.vendor}</p>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-3xl font-bold">
                    ${product.priceRange.minVariantPrice.amount}
                  </p>
                  {!product.availableForSale && (
                    <span className="text-sm uppercase border-2 border-black px-4 py-2">SOLD OUT</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
      
      {/* Empty State */}
      {products.nodes.length === 0 && (
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
      {(products.pageInfo.hasPreviousPage || products.pageInfo.hasNextPage) && (
        <section className="w-full border-t-2 border-black">
          <div className="flex justify-between items-center px-4 lg:px-8 py-8">
            {products.pageInfo.hasPreviousPage ? (
              <Link
                to={products.pageInfo.startCursor ? `?cursor=${products.pageInfo.startCursor}&direction=previous` : ''}
                className="text-xl uppercase border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-colors"
              >
                ← PREVIOUS
              </Link>
            ) : (
              <div />
            )}
            {products.pageInfo.hasNextPage ? (
              <Link
                to={products.pageInfo.endCursor ? `?cursor=${products.pageInfo.endCursor}` : ''}
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
    </div>
  );
}

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    handle
    vendor
    productType
    availableForSale
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  query Products(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $before: String
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $before
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      query: $query
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_TYPES_QUERY = `#graphql
  query ProductTypes(
    $first: Int!
    $query: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productTypes: products(first: $first, query: $query) {
      nodes {
        productType
      }
    }
  }
`;