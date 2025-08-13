import {Suspense, useState, useEffect} from 'react';
import {Await, NavLink, useAsyncValue, Link, useLoaderData} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  campaignDeadline?: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
  campaignDeadline,
}: HeaderProps) {
  const {shop, menu} = header;
  const [timeLeft, setTimeLeft] = useState('');
  
  // Campaign countdown timer - use actual campaign deadline or default to 7 days
  useEffect(() => {
    let targetDate: Date;
    
    if (campaignDeadline) {
      // Use the actual campaign deadline from metafields
      targetDate = new Date(campaignDeadline);
    } else {
      // Fallback to 7 days from now if no campaign deadline provided
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
    }
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance < 0) {
        setTimeLeft('Campaign Ended');
        clearInterval(interval);
        return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft(`${days}D ${hours}H ${minutes}M ${seconds}S`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [campaignDeadline]);
  
  return (
    <>
      {/* Animated Promo Bar */}
      <div className="bg-neutral-900 text-white py-2 overflow-hidden relative">
        <div className="animate-scroll-left flex whitespace-nowrap">
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">PERFECTLY IMPERFECT</span>
          <span className="px-8">•</span>
          <span className="px-8">SMALL BATCH COOKIES</span>
          <span className="px-8">•</span>
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">DOHHH-LICIOUS DREAMS</span>
          <span className="px-8">•</span>
          <span className="px-8">HANDCRAFTED</span>
          <span className="px-8">•</span>
          {/* Duplicate content for seamless loop */}
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">PERFECTLY IMPERFECT</span>
          <span className="px-8">•</span>
          <span className="px-8">SMALL BATCH COOKIES</span>
          <span className="px-8">•</span>
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">DOHHH-LICIOUS DREAMS</span>
          <span className="px-8">•</span>
          <span className="px-8">HANDCRAFTED</span>
          <span className="px-8">•</span>
        </div>
      </div>
      
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
            <img src="/dohhh-light.png" alt="DOHHH" className="h-8" />
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink
                to="/campaigns"
                className={({isActive}) => `text-sm font-medium uppercase tracking-wider transition-colors hover:text-amber-600 ${
                  isActive ? 'text-amber-600' : 'text-neutral-900'
                }`}
              >
                Campaigns
              </NavLink>
              
              <NavLink
                to="/collections/cookies"
                className={({isActive}) => `text-sm font-medium uppercase tracking-wider transition-colors hover:text-amber-600 ${
                  isActive ? 'text-amber-600' : 'text-neutral-900'
                }`}
              >
                Cookies
              </NavLink>
              
              <NavLink
                to="/collections/goods"
                className={({isActive}) => `text-sm font-medium uppercase tracking-wider transition-colors hover:text-amber-600 ${
                  isActive ? 'text-amber-600' : 'text-neutral-900'
                }`}
              >
                Goods
              </NavLink>
            </nav>
            
            {/* Right Side - Countdown, Search, Cart */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Mobile Menu Toggle */}
              <HeaderMenuMobileToggle />
              
              {/* Countdown Timer */}
              <div className="hidden lg:flex flex-col items-end">
                <div className="text-xs text-neutral-500 uppercase tracking-wider">Campaign Ends</div>
                <div className="text-sm font-bold text-neutral-900 font-mono">{timeLeft}</div>
              </div>
              
              {/* Search & Cart */}
              <div className="flex items-center gap-2 md:gap-4">
                <SearchToggle />
                <CartToggle cart={cart} />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();

  if (viewport === 'mobile') {
    return (
      <nav className="flex flex-col space-y-1" role="navigation">
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className={({isActive}) => `block px-4 py-3 text-base font-medium transition-colors ${
            isActive ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Home
        </NavLink>
        
        <NavLink
          onClick={close}
          prefetch="intent"
          to="/campaigns"
          className={({isActive}) => `block px-4 py-3 text-base font-medium transition-colors ${
            isActive ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Campaigns
        </NavLink>
        
        <NavLink
          onClick={close}
          prefetch="intent"
          to="/collections/cookies"
          className={({isActive}) => `block px-4 py-3 text-base font-medium transition-colors ${
            isActive ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Cookies
        </NavLink>
        
        <NavLink
          onClick={close}
          prefetch="intent"
          to="/collections/goods"
          className={({isActive}) => `block px-4 py-3 text-base font-medium transition-colors ${
            isActive ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Goods
        </NavLink>
      </nav>
    );
  }

  const className = `header-menu-${viewport}`;
  return (
    <nav className={className} role="navigation">
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="md:hidden text-neutral-900 hover:text-amber-600 transition-colors p-2"
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button 
      className="text-neutral-900 hover:text-amber-600 transition-colors p-2"
      onClick={() => open('search')}
      aria-label="Search"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      className="relative text-neutral-900 hover:text-amber-600 transition-colors p-2"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      aria-label="Open cart"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {count !== null && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'fallback',
  items: [
    { id: 'campaigns', resourceId: null, tags: [], title: 'Campaigns', type: 'HTTP', url: '/campaigns', items: [] },
    { id: 'cookies', resourceId: null, tags: [], title: 'Cookies', type: 'HTTP', url: '/collections/cookies', items: [] },
    { id: 'goods', resourceId: null, tags: [], title: 'Goods', type: 'HTTP', url: '/collections/goods', items: [] },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
