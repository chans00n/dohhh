import {Suspense, useState, useEffect} from 'react';
import {Await, NavLink, useAsyncValue, Link, useLoaderData} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator} from '~/components/ui/dropdown';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const [timeLeft, setTimeLeft] = useState('');
  
  // Campaign countdown timer (example: 7 days from now)
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    
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
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      {/* Animated Promo Bar */}
      <div className="bg-neutral-900 text-white py-2 overflow-hidden relative">
        <div className="animate-scroll-left flex whitespace-nowrap">
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">GIVE ME COOKIES</span>
          <span className="px-8">•</span>
          <span className="px-8">SUPPORT LOCAL CAMPAIGNS</span>
          <span className="px-8">•</span>
          <span className="px-8">DOHHH DOHHH</span>
          <span className="px-8">•</span>
          <span className="px-8">OR GIVE ME DEATH</span>
          <span className="px-8">•</span>
          <span className="px-8">SUPPORT LOCAL CAMPAIGNS</span>
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
                to="/cookies"
                className={({isActive}) => `text-sm font-medium uppercase tracking-wider transition-colors hover:text-amber-600 ${
                  isActive ? 'text-amber-600' : 'text-neutral-900'
                }`}
              >
                Cookies
              </NavLink>
              
              <Dropdown>
                <DropdownTrigger className="flex items-center gap-1 text-sm font-medium uppercase tracking-wider text-neutral-900 transition-colors hover:text-amber-600">
                  More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </DropdownTrigger>
                <DropdownContent>
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Social</div>
                    <DropdownItem href="https://twitter.com">Twitter</DropdownItem>
                    <DropdownItem href="https://instagram.com">Instagram</DropdownItem>
                    <DropdownItem href="https://tiktok.com">TikTok</DropdownItem>
                  </div>
                  
                  <DropdownSeparator />
                  
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Help</div>
                    <DropdownItem href="/pages/faq">FAQ</DropdownItem>
                    <DropdownItem href="/pages/contact">Contact</DropdownItem>
                    <DropdownItem href="/pages/refunds">Refunds</DropdownItem>
                  </div>
                  
                  <DropdownSeparator />
                  
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Legal</div>
                    <DropdownItem href="/policies/privacy-policy">Privacy Policy</DropdownItem>
                    <DropdownItem href="/policies/terms-of-service">Terms</DropdownItem>
                  </div>
                </DropdownContent>
              </Dropdown>
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
          to="/cookies"
          className={({isActive}) => `block px-4 py-3 text-base font-medium transition-colors ${
            isActive ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' : 'text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          Cookies
        </NavLink>
        
        <div className="border-t border-neutral-200 my-2" />
        
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Social</div>
          <a href="https://twitter.com" className="block py-2 text-neutral-700 hover:text-amber-600">Twitter</a>
          <a href="https://instagram.com" className="block py-2 text-neutral-700 hover:text-amber-600">Instagram</a>
          <a href="https://tiktok.com" className="block py-2 text-neutral-700 hover:text-amber-600">TikTok</a>
        </div>
        
        <div className="border-t border-neutral-200 my-2" />
        
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Help</div>
          <NavLink to="/pages/faq" onClick={close} className="block py-2 text-neutral-700 hover:text-amber-600">FAQ</NavLink>
          <NavLink to="/pages/contact" onClick={close} className="block py-2 text-neutral-700 hover:text-amber-600">Contact</NavLink>
          <NavLink to="/pages/refunds" onClick={close} className="block py-2 text-neutral-700 hover:text-amber-600">Refunds</NavLink>
        </div>
        
        <div className="border-t border-neutral-200 my-2" />
        
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Legal</div>
          <NavLink to="/policies/privacy-policy" onClick={close} className="block py-2 text-neutral-700 hover:text-amber-600">Privacy Policy</NavLink>
          <NavLink to="/policies/terms-of-service" onClick={close} className="block py-2 text-neutral-700 hover:text-amber-600">Terms</NavLink>
        </div>
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
    { id: 'collections', resourceId: null, tags: [], title: 'Collections', type: 'HTTP', url: '/collections', items: [] },
    { id: 'campaigns', resourceId: null, tags: [], title: 'Campaigns', type: 'HTTP', url: '/campaigns', items: [] },
    { id: 'cookies', resourceId: null, tags: [], title: 'Cookies', type: 'HTTP', url: '/cookies', items: [] },
    { id: 'policies', resourceId: null, tags: [], title: 'Policies', type: 'HTTP', url: '/policies', items: [] },
    { id: 'about', resourceId: 'gid://shopify/Page/92591030328', tags: [], title: 'About', type: 'PAGE', url: '/pages/about', items: [] },
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
