import {Link} from 'react-router';
import {useAside} from '~/components/Aside';

export function Footer() {
  const {open} = useAside();
  
  return (
    <footer className="w-full bg-black text-white border-t-2 border-black">
      {/* Main Footer Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-white">
        {/* Brand Section */}
        <div className="p-8 lg:p-12">
          <Link to="/" className="block mb-6">
            <img 
              src="/dohhh-dark.png" 
              alt="DOHHH" 
              className="h-8 lg:h-8 w-auto"
            />
          </Link>
          <p className="text-lg uppercase mb-2">WE MAKE PERFECTLY IMPERFECT COOKIES FOR PERFECTLY IMPORTANT CAUSES. BECAUSE THE BEST STORIES - AND COOKIES - ARE BEAUTIFULLY HUMAN.</p>
        </div>
        
        {/* Shop Links */}
        <div className="p-8 lg:p-12">
          <h4 className="text-2xl font-bold uppercase mb-6">SHOP</h4>
          <div className="space-y-3">
            <Link to="/campaigns" className="block text-lg uppercase text-white hover:underline">
              CAMPAIGNS
            </Link>
            <Link to="/collections/cookies" className="block text-lg uppercase text-white hover:underline">
              COOKIES
            </Link>
            <Link to="/collections/goods" className="block text-lg uppercase text-white hover:underline">
              GOODS
            </Link>
            <button 
              onClick={() => open('cart')}
              className="block text-lg uppercase text-white hover:underline text-left w-full"
            >
              CART
            </button>
            <Link to="/account" className="block text-lg uppercase text-white hover:underline">
              ACCOUNT
            </Link>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="p-8 lg:p-12">
          <h4 className="text-2xl font-bold uppercase mb-6">SOCIAL</h4>
          <div className="space-y-3">
            <Link to="https://www.instagram.com/dohhh_dohhh/" className="block text-lg uppercase text-white hover:underline">
              INSTAGRAM
            </Link>
            <Link to="https://www.facebook.com/dohhh_dohhh/" className="block text-lg uppercase text-white hover:underline">
              FACEBOOK
            </Link>
            <Link to="https://x.com/dohhh_dohhh" className="block text-lg uppercase text-white hover:underline">
              X
            </Link>
            <Link to="https://www.tiktok.com/@dohhh_dohhh" className="block text-lg uppercase text-white hover:underline">
              TIKTOK
            </Link>
          </div>
        </div>
        
        {/* Connect Section */}
        <div className="p-8 lg:p-12">
          <h4 className="text-2xl font-bold uppercase mb-6">CONNECT</h4>
          <p className="text-lg mb-6">
            JOIN OUR COOKIE COMMUNITY FOR EXCLUSIVE CAMPAIGNS AND EARLY ACCESS
          </p>
          <form className="space-y-4">
            <input
              type="email"
              placeholder="YOUR EMAIL"
              className="w-full px-4 py-3 bg-white border-2 border-white text-white placeholder-gray-400 uppercase focus:outline-none focus:bg-white focus:text-black transition-colors"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 border-2 border-white bg-white text-black hover:bg-black hover:text-white transition-colors text-lg font-bold uppercase"
            >
              SUBSCRIBE →
            </button>
          </form>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t-2 border-white">
        <div className="px-8 py-6 flex flex-col lg:flex-row justify-between items-center">
          <p className="text-sm uppercase mb-4 lg:mb-0">
            © 2025 DOHHH. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <Link to="/policies/privacy-policy" className="text-sm uppercase text-white hover:underline">
              PRIVACY
            </Link>
            <Link to="/policies/terms-of-service" className="text-sm uppercase text-white hover:underline">
              TERMS
            </Link>
            <Link to="/policies/refund-policy" className="text-sm uppercase text-white hover:underline">
              REFUNDS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}