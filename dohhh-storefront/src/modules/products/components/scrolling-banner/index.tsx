"use client"

import React from "react"

const ScrollingBanner = () => {
  const text = "FREE SHIPPING ON ORDERS OVER $50 • "
  
  return (
    <div className="w-full overflow-hidden bg-primary text-white py-3">
      <div className="flex animate-scroll">
        {/* Repeat the text multiple times to create seamless scrolling */}
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-sm uppercase tracking-wider whitespace-nowrap px-4">
            {text}
          </span>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default ScrollingBanner