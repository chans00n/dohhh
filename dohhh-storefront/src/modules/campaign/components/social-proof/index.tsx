"use client"

import React from "react"
import { cn } from "@lib/utils"

interface Backer {
  id: string
  name: string
  amount: number
  cookies_purchased: number
  created_at: string
  anonymous: boolean
}

interface Testimonial {
  id: string
  name: string
  content: string
  rating: number
  created_at: string
}

interface SocialProofProps {
  campaign: any
  recentBackers?: Backer[]
  testimonials?: Testimonial[]
  className?: string
}

const SocialProof: React.FC<SocialProofProps> = ({ 
  campaign, 
  recentBackers = [], 
  testimonials = [],
  className 
}) => {
  if (!campaign) return null

  return (
    <section className={cn("py-16 md:py-24 bg-light-bg-base dark:bg-dark-bg-base", className)}>
      <div className="content-container">
        {/* Recent Backers */}
        {recentBackers.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-light-text-base dark:text-dark-text-base mb-8 text-center">
              Recent Supporters
            </h2>
            
            <div className="bg-light-bg-card dark:bg-dark-bg-card rounded-lg border border-light-border dark:border-dark-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBackers.slice(0, 6).map((backer) => (
                  <div
                    key={backer.id}
                    className="flex items-center gap-4 p-4 bg-light-bg-hover dark:bg-dark-bg-hover rounded-lg transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src="/d-light.png"
                        alt="Supporter avatar"
                        className="block dark:hidden w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <img
                        src="/d-dark.png"
                        alt="Supporter avatar"
                        className="hidden dark:block w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-light-text-base dark:text-dark-text-base">
                        {backer.anonymous ? "Anonymous" : backer.name}
                      </p>
                      <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
                        {backer.cookies_purchased} {backer.cookies_purchased === 1 ? 'cookie' : 'cookies'} • ${(backer.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        {getTimeAgo(new Date(backer.created_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {recentBackers.length > 6 && (
                <div className="mt-4 text-center">
                  <button className="text-primary hover:underline text-sm font-medium">
                    View all {campaign.stats?.total_backers || recentBackers.length} supporters →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-light-text-base dark:text-dark-text-base mb-8 text-center">
              What People Are Saying
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-light-bg-card dark:bg-dark-bg-card rounded-lg border border-light-border dark:border-dark-border p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-3" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          "w-5 h-5",
                          i < testimonial.rating
                            ? "text-yellow-400 fill-current"
                            : "text-light-text-muted dark:text-dark-text-muted"
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-light-text-base dark:text-dark-text-base mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-light-text-base dark:text-dark-text-base">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        {new Date(testimonial.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Stats */}
        <div className="mt-16 bg-primary/10 rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-light-text-base dark:text-dark-text-base mb-8">
              Join Our Growing Community
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {campaign.stats?.total_backers || 0}
                </div>
                <p className="text-light-text-muted dark:text-dark-text-muted">
                  Cookie Lovers Supporting
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {campaign.stats?.total_cookies_sold || 0}
                </div>
                <p className="text-light-text-muted dark:text-dark-text-muted">
                  Cookies Delivered
                </p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  ${((campaign.stats?.total_raised || 0) / 100).toLocaleString()}
                </div>
                <p className="text-light-text-muted dark:text-dark-text-muted">
                  Raised for {campaign.cause_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Helper function to get relative time
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  
  return date.toLocaleDateString()
}

export default SocialProof