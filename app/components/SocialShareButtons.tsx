/**
 * Social Share Buttons Component
 * Brutalist-styled sharing for campaigns with native share API support
 */

import {useState, useEffect} from 'react';

interface ShareButtonsProps {
  campaignName: string;
  campaignUrl: string;
  organizerName?: string;
  percentFunded?: number;
  goalAmount?: string;
  variant?: 'inline' | 'stack' | 'minimal';
  showLabels?: boolean;
  onShare?: (platform: string) => void;
}

interface ShareConfig {
  platform: string;
  icon: string;
  label: string;
  color: string;
  getMessage: () => string;
  getUrl: () => string;
}

export function SocialShareButtons({
  campaignName,
  campaignUrl,
  organizerName = 'This baker',
  percentFunded = 0,
  goalAmount = 'their goal',
  variant = 'inline',
  showLabels = false,
  onShare,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Check for native share API support
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Track share event
  const trackShare = (platform: string) => {
    console.log(`Share clicked: ${platform} for ${campaignName}`);
    if (onShare) {
      onShare(platform);
    }
    // Add your analytics tracking here
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'campaign',
        item_id: campaignUrl,
      });
    }
  };

  // Share configurations for each platform
  const shareConfigs: ShareConfig[] = [
    {
      platform: 'sms',
      icon: '💬',
      label: 'TEXT',
      color: 'green',
      getMessage: () => `Check out ${campaignName} on DOHHH! 🍪 They're ${percentFunded}% funded! Join me: ${campaignUrl}`,
      getUrl: () => {
        const message = encodeURIComponent(`Check out ${campaignName} on DOHHH! 🍪 They're ${percentFunded}% funded! Join me: ${campaignUrl}`);
        // iOS uses & for SMS, Android uses ?
        const separator = /iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?';
        return `sms:${separator}body=${message}`;
      },
    },
    {
      platform: 'whatsapp',
      icon: '📱',
      label: 'WHATSAPP',
      color: 'green',
      getMessage: () => `🍪 I'm backing *${campaignName}* on DOHHH!\n\n${organizerName} is ${percentFunded}% funded for ${goalAmount}!\n\nJoin me and help make these cookies happen: ${campaignUrl}`,
      getUrl: () => {
        const message = encodeURIComponent(`🍪 I'm backing *${campaignName}* on DOHHH!\n\n${organizerName} is ${percentFunded}% funded for ${goalAmount}!\n\nJoin me: ${campaignUrl}`);
        return `https://wa.me/?text=${message}`;
      },
    },
    {
      platform: 'twitter',
      icon: '🐦',
      label: 'TWITTER',
      color: 'blue',
      getMessage: () => `I'm backing ${campaignName} on @DOHHH! 🍪 ${organizerName} is ${percentFunded}% funded! Join the cookie revolution:`,
      getUrl: () => {
        const text = encodeURIComponent(`I'm backing ${campaignName} on DOHHH! 🍪 ${organizerName} is ${percentFunded}% funded! Join the cookie revolution:`);
        return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(campaignUrl)}&hashtags=DOHHH,CookieDreams`;
      },
    },
    {
      platform: 'facebook',
      icon: '👤',
      label: 'FACEBOOK',
      color: 'blue',
      getMessage: () => `Support ${campaignName} on DOHHH!`,
      getUrl: () => {
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}&quote=${encodeURIComponent(`I'm backing ${campaignName} on DOHHH! 🍪 Join me!`)}`;
      },
    },
    {
      platform: 'instagram',
      icon: '📸',
      label: 'INSTAGRAM',
      color: 'purple',
      getMessage: () => `Check out ${campaignName} on DOHHH! 🍪 Link in bio!`,
      getUrl: () => {
        // Instagram doesn't have direct URL sharing, so copy to clipboard
        return '';
      },
    },
  ];

  // Handle native share
  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: `${campaignName} on DOHHH`,
        text: `🍪 I'm backing ${campaignName}! ${organizerName} is ${percentFunded}% funded for ${goalAmount}. Join me!`,
        url: campaignUrl,
      });
      trackShare('native');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        setShareError('DOHHH! Sharing failed. Try copying the link instead!');
      }
    }
  };

  // Handle platform-specific share
  const handleShare = (config: ShareConfig) => {
    trackShare(config.platform);

    // Special handling for Instagram (copy to clipboard)
    if (config.platform === 'instagram') {
      handleCopyLink();
      alert('LINK COPIED! Share it on your Instagram story with a screenshot! 📸');
      return;
    }

    // Open share URL in new window
    const url = config.getUrl();
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      trackShare('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = campaignUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render buttons based on variant
  const buttonClass = variant === 'minimal' 
    ? 'p-3 border-2 border-black hover:bg-black hover:text-white transition-colors flex-1 lg:flex-initial'
    : 'px-4 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors font-black uppercase';

  const containerClass = variant === 'stack' 
    ? 'flex flex-col gap-2'
    : variant === 'minimal'
    ? 'grid grid-cols-3 gap-2 lg:flex lg:gap-2 lg:justify-center'
    : 'flex flex-wrap gap-3';

  return (
    <div className="social-share-buttons">
      {/* Section Header - removed for cleaner look */}

      {/* Error Message */}
      {shareError && (
        <div className="mb-4 p-3 bg-yellow-100 border-2 border-black">
          <p className="text-sm font-bold">{shareError}</p>
        </div>
      )}

      {/* Container for native share + platform buttons */}
      <div className={variant === 'minimal' ? 'lg:flex lg:items-center lg:gap-4' : ''}>
        {/* Native Share Button (Mobile Priority) */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className={variant === 'minimal' 
              ? "w-full lg:w-auto mb-4 lg:mb-0 px-10 py-5 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors text-sm"
              : "w-full mb-4 px-6 py-4 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors"
            }
          >
            SHARE THIS CAMPAIGN
          </button>
        )}

        {/* Platform-Specific Buttons */}
        <div className={containerClass}>
        {shareConfigs.map((config) => (
          <button
            key={config.platform}
            onClick={() => handleShare(config)}
            className={buttonClass}
            title={`Share on ${config.label}`}
            aria-label={`Share on ${config.label}`}
          >
            <span className="text-2xl" role="img" aria-label={config.platform}>
              {config.icon}
            </span>
            {showLabels && (
              <span className="ml-2 text-xs">
                {config.label}
              </span>
            )}
          </button>
        ))}

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className={buttonClass}
          title="Copy link to clipboard"
          aria-label="Copy link to clipboard"
        >
          <span className="text-2xl" role="img" aria-label="copy">
            {copied ? '✅' : '🔗'}
          </span>
          {showLabels && (
            <span className="ml-2 text-xs">
              {copied ? 'COPIED!' : 'COPY LINK'}
            </span>
          )}
        </button>
      </div>
      </div>

      {/* Share Stats (Optional) */}
      {variant !== 'minimal' && (
        <div className="mt-6 p-4 bg-gray-100 border-2 border-gray-300">
          <p className="text-xs font-bold uppercase mb-2">WHY SHARE?</p>
          <ul className="text-xs space-y-1">
            <li>🍪 CAMPAIGNS WITH 5+ SHARES FUND 3X FASTER</li>
            <li>🍪 EVERY SHARE REACHES ~300 COOKIE LOVERS</li>
            <li>🍪 SHARING MAKES YOU A COOKIE HERO!</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Minimal share bar for inline use
export function ShareBar({
  campaignName,
  campaignUrl,
  percentFunded,
}: Pick<ShareButtonsProps, 'campaignName' | 'campaignUrl' | 'percentFunded'>) {
  return (
    <div className="share-bar py-4 my-6 w-full">
      <SocialShareButtons
        campaignName={campaignName}
        campaignUrl={campaignUrl}
        percentFunded={percentFunded}
        variant="minimal"
      />
    </div>
  );
}