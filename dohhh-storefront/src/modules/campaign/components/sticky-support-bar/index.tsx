"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"

interface StickySupportBarProps {
  campaign: any
  stats?: any
}

const StickySupportBar: React.FC<StickySupportBarProps> = ({ campaign, stats }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const threshold = 180
      if (!dismissed) {
        setIsVisible(window.scrollY > threshold)
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [dismissed])

  if (!campaign) return null

  const totalRaised = stats?.total_raised || 0
  const goalAmount = campaign.goal_amount || 1
  const percentage = Math.max(0, Math.min(((totalRaised / goalAmount) * 100) || 0, 100))

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 transition-all duration-300 ease-out",
        "px-4",
        isVisible && !dismissed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      style={{ bottom: `calc(env(safe-area-inset-bottom) + 1rem)` }}
    >
      <div className="content-container">
        <div className="mx-auto max-w-3xl bg-light-bg-card/90 dark:bg-dark-bg-card/90 backdrop-blur border border-light-border dark:border-dark-border rounded-lg ps-4 pe-2 py-2 shadow-lg flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-light-text-base dark:text-dark-text-base font-medium truncate">
              Support {campaign.cause_name}
            </div>
            <div className="w-full bg-light-bg-hover dark:bg-dark-bg-hover rounded-full h-2 overflow-hidden mt-2" aria-hidden>
              <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
            </div>
          </div>
          <LocalizedClientLink href="#support">
            <Button size="small" className="!bg-primary hover:!bg-primary-hover !text-white !border-primary">
              Support now
            </Button>
          </LocalizedClientLink>
          <button
            aria-label="Dismiss support bar"
            onClick={() => setDismissed(true)}
            className="ms-1 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover text-light-text-muted dark:text-dark-text-muted"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StickySupportBar

