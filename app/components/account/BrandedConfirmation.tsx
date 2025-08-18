/**
 * Branded Confirmation Pages for Account Operations
 * Brutalist-styled success and error pages matching DOHHH brand
 */

import {Link} from 'react-router';
import {useState, useEffect} from 'react';

interface SuccessPageProps {
  message: string;
  nextSteps?: string;
  showConfetti?: boolean;
}

export function SuccessPage({ message, nextSteps, showConfetti = true }: SuccessPageProps) {
  const [showCelebration, setShowCelebration] = useState(showConfetti);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl animate-bounce">🍪</div>
          </div>
          <div className="absolute top-1/4 left-1/4 text-6xl animate-ping">✨</div>
          <div className="absolute top-1/3 right-1/4 text-6xl animate-ping animation-delay-200">✨</div>
          <div className="absolute bottom-1/3 left-1/3 text-6xl animate-ping animation-delay-400">✨</div>
          <div className="absolute bottom-1/4 right-1/3 text-6xl animate-ping animation-delay-600">✨</div>
        </div>
      )}

      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="border-4 border-black p-12 bg-white">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase mb-6">
            {message}
          </h1>
          {nextSteps && (
            <p className="text-xl uppercase mb-8">
              {nextSteps}
            </p>
          )}
          
          <div className="border-t-2 border-black pt-8 mt-8">
            <p className="text-lg uppercase mb-8">
              WHAT'S NEXT? CHOOSE YOUR ADVENTURE:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/campaigns" 
                className="px-8 py-4 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors border-2 border-black"
              >
                EXPLORE CAMPAIGNS
              </Link>
              <Link 
                to="/account" 
                className="px-8 py-4 bg-white text-black font-black uppercase hover:bg-gray-100 transition-colors border-2 border-black"
              >
                MANAGE ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorPageProps {
  error: string;
  suggestion?: string;
  showRetry?: boolean;
  retryLink?: string;
}

export function ErrorPage({ error, suggestion, showRetry = true, retryLink }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="border-4 border-black p-12 bg-red-50">
          <div className="text-6xl mb-6">😅</div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase mb-6">
            {error}
          </h1>
          {suggestion && (
            <p className="text-xl uppercase mb-8">
              {suggestion}
            </p>
          )}
          
          <div className="border-t-2 border-black pt-8 mt-8">
            <p className="text-lg uppercase mb-8">
              DON'T WORRY, EVEN PERFECT COOKIES CRUMBLE SOMETIMES
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {showRetry && retryLink && (
                <Link 
                  to={retryLink} 
                  className="px-8 py-4 bg-black text-white font-black uppercase hover:bg-gray-800 transition-colors border-2 border-black"
                >
                  TRY AGAIN
                </Link>
              )}
              <Link 
                to="/" 
                className="px-8 py-4 bg-white text-black font-black uppercase hover:bg-gray-100 transition-colors border-2 border-black"
              >
                GO HOME
              </Link>
              <a 
                href="mailto:support@dohhh.shop" 
                className="px-8 py-4 bg-white text-black font-black uppercase hover:bg-gray-100 transition-colors border-2 border-black"
              >
                GET HELP
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "BAKING YOUR REQUEST..." }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-spin mb-6">🍪</div>
        <h2 className="text-2xl font-black uppercase">
          {message}
        </h2>
        <p className="text-lg uppercase mt-2">
          PERFECTLY IMPERFECT THINGS TAKE TIME
        </p>
      </div>
    </div>
  );
}