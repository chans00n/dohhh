/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/hydrogen" />

declare global {
  interface Window {
    ENV: {
      STRIPE_PUBLISHABLE_KEY?: string;
    };
  }
}

export {};