/**
 * Email Capture Component for Campaign Updates
 * Brutalist-styled email signup to build community and re-engagement
 */

import {useState, useEffect} from 'react';
import {useFetcher} from 'react-router';

interface EmailCaptureProps {
  campaignName: string;
  campaignId: string;
  variant?: 'inline' | 'popup' | 'sidebar';
  onSuccess?: () => void;
}

export function EmailCapture({
  campaignName,
  campaignId,
  variant = 'inline',
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fetcher = useFetcher();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('DOHHH! THAT EMAIL LOOKS FUNKY');
      return;
    }

    setStatus('loading');
    
    // Submit to Shopify customer API
    fetcher.submit(
      {
        email,
        campaignId,
        campaignName,
        action: 'subscribe',
      },
      {
        method: 'post',
        action: '/api/email-capture',
      }
    );
  };

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        setStatus('success');
        if (onSuccess) onSuccess();
        
        // Reset after showing success
        setTimeout(() => {
          setStatus('idle');
          setEmail('');
        }, 3000);
      } else if (fetcher.data.error) {
        setStatus('error');
        setErrorMessage(fetcher.data.error);
      }
    }
  }, [fetcher.state, fetcher.data, onSuccess]);

  if (status === 'success') {
    return (
      <div className="border-2 border-black p-6 bg-green-50">
        <div className="text-center">
          <div className="text-4xl mb-2">🍪</div>
          <h3 className="text-xl font-black uppercase mb-2">YOU'RE IN!</h3>
          <p className="text-sm uppercase">WE'LL KEEP YOU POSTED ON {campaignName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`email-capture email-capture-${variant}`}>
      <div className={`border-2 border-black p-6 ${variant === 'popup' ? 'bg-white' : 'bg-yellow-50'}`}>
        <h3 className="text-xl font-black uppercase mb-2 text-black">
          GET DOHHH UPDATES ON THIS CAMPAIGN
        </h3>
        <p className="text-sm uppercase mb-4 text-black">
          BE THE FIRST TO KNOW WHEN COOKIES ARE READY
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setErrorMessage('');
                }
              }}
              placeholder="YOUR@EMAIL.COM"
              className="w-full px-4 py-3 border-2 border-black uppercase font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black bg-white text-black"
              disabled={status === 'loading'}
              required
            />
            {status === 'error' && (
              <p className="text-red-600 text-sm uppercase mt-1 font-bold">
                {errorMessage}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-4 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'SUBSCRIBING...' : 'KEEP ME POSTED'}
          </button>
        </form>
        
        <p className="text-xs uppercase mt-4 text-gray-600">
          WE'LL ONLY EMAIL ABOUT THIS CAMPAIGN - NO SPAM, JUST COOKIES!
        </p>
      </div>
    </div>
  );
}

/**
 * Popup variant that shows after 30 seconds of viewing
 */
export function EmailCapturePopup({
  campaignName,
  campaignId,
  delay = 30000,
}: EmailCaptureProps & {delay?: number}) {
  const [showPopup, setShowPopup] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if already dismissed in this session
    const isDismissed = sessionStorage.getItem(`email-popup-${campaignId}`);
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [campaignId, delay]);

  const handleDismiss = () => {
    setShowPopup(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`email-popup-${campaignId}`, 'true');
    }
  };

  if (!showPopup || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white bg-opacity-50">
      <div className="relative max-w-md w-full">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-10 h-10 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10 text-lg font-bold"
          aria-label="Close"
        >
          ✕
        </button>
        <EmailCapture
          campaignName={campaignName}
          campaignId={campaignId}
          variant="popup"
          onSuccess={handleDismiss}
        />
      </div>
    </div>
  );
}

/**
 * Sidebar variant for campaign pages
 */
export function EmailCaptureSidebar({
  campaignName,
  campaignId,
}: EmailCaptureProps) {
  return (
    <div className="sticky top-4">
      <EmailCapture
        campaignName={campaignName}
        campaignId={campaignId}
        variant="sidebar"
      />
    </div>
  );
}