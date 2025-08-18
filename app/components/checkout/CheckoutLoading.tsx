/**
 * Checkout Loading Component
 * Shows loading states during payment processing with campaign-themed messages
 */

import {useEffect, useState} from 'react';

interface CheckoutLoadingProps {
  stage?: 'payment' | 'order' | 'campaign' | 'complete';
  campaignName?: string;
}

const LOADING_MESSAGES = {
  payment: [
    "BAKING YOUR DREAMS...",
    "MIXING THE PERFECT BATCH...",
    "DOHHH! ALMOST READY...",
    "PERFECTLY IMPERFECT LOADING...",
  ],
  order: [
    "CREATING YOUR DOHHH-LICIOUS ORDER...",
    "RESERVING YOUR COOKIE DREAMS...",
    "PREPARING THE PERFECT BATCH...",
    "GETTING YOUR COOKIES READY...",
  ],
  campaign: [
    "UPDATING COOKIE CAMPAIGN...",
    "ADDING YOU TO THE DOHHH SQUAD...",
    "RECORDING YOUR SWEET SUPPORT...",
    "MAKING COOKIE DREAMS HAPPEN...",
  ],
  complete: [
    "FINALIZING YOUR DOHHH-LIGHT...",
    "JUST ONE MORE COOKIE SECOND...",
    "SWEET SUCCESS INCOMING...",
    "GET READY FOR DOHHH-LICIOUSNESS...",
  ],
};

const COOKIE_FACTS = [
  "DOHHH FACT: WE BAKE PERFECTLY IMPERFECT COOKIES DAILY!",
  "COOKIE TRUTH: OUR CHOCOLATE CHIPS ARE 72% PURE DREAMS",
  "HOT TIP: DOHHH COOKIES TASTE BEST SLIGHTLY WARM",
  "SWEET REALITY: EACH BATCH FUNDS LOCAL COOKIE DREAMS",
  "BAKING SECRET: REAL BUTTER, NO COMPROMISES, EVER",
  "DOHHH PHILOSOPHY: EVERY COOKIE IS PERFECTLY IMPERFECT",
];

export function CheckoutLoading({
  stage = 'payment',
  campaignName,
}: CheckoutLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Rotate loading messages
  useEffect(() => {
    const messages = LOADING_MESSAGES[stage];
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stage]);

  // Rotate cookie facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % COOKIE_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Cookie Animation */}
        <div className="mb-8">
          <div className="inline-block relative">
            <div className="text-8xl animate-spin-slow">🍪</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-pulse">✨</div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <h2 className="text-3xl font-black mb-2">
          {LOADING_MESSAGES[stage][messageIndex]}{dots}
        </h2>

        {/* Campaign-specific message */}
        {campaignName && (
          <p className="text-lg text-gray-600 mb-6">
            Supporting {campaignName}
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full max-w-xs mx-auto mb-8">
          <div className="h-2 bg-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-black animate-progress" />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-4 mb-8">
          <div className={`flex flex-col items-center ${stage === 'payment' ? 'opacity-100' : 'opacity-30'}`}>
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black">
              {stage === 'payment' ? '🔄' : '✓'}
            </div>
            <span className="text-xs mt-1">Payment</span>
          </div>
          <div className={`flex flex-col items-center ${stage === 'order' ? 'opacity-100' : stage === 'payment' ? 'opacity-30' : 'opacity-30'}`}>
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black">
              {['campaign', 'complete'].includes(stage) || stage === 'order' ? '🔄' : stage === 'payment' ? '' : '✓'}
            </div>
            <span className="text-xs mt-1">Order</span>
          </div>
          <div className={`flex flex-col items-center ${stage === 'campaign' ? 'opacity-100' : ['payment', 'order'].includes(stage) ? 'opacity-30' : 'opacity-30'}`}>
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black">
              {stage === 'complete' ? '✓' : stage === 'campaign' ? '🔄' : ''}
            </div>
            <span className="text-xs mt-1">Campaign</span>
          </div>
          <div className={`flex flex-col items-center ${stage === 'complete' ? 'opacity-100' : 'opacity-30'}`}>
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black">
              {stage === 'complete' ? '🔄' : ''}
            </div>
            <span className="text-xs mt-1">Complete</span>
          </div>
        </div>

        {/* Cookie Fact */}
        <div className="p-4 bg-gray-100 border-2 border-gray-300">
          <p className="text-sm italic">{COOKIE_FACTS[factIndex]}</p>
        </div>

        {/* Security Note */}
        <p className="text-xs text-gray-500 mt-8">
          🔒 Your payment is secure and encrypted
        </p>
      </div>
    </div>
  );
}