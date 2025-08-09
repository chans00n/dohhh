"use client"

import React from "react"
import { cn } from "@lib/utils"

interface Milestone {
  id: string
  title: string
  description: string
  target_amount: number
  reached_at: string | null
  order: number
}

interface ProgressTrackerProps {
  campaign: any
  stats: any
  className?: string
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ campaign, stats, className }) => {
  if (!campaign || !stats) return null

  const totalRaised = stats.total_raised || 0
  const goalAmount = campaign.goal_amount || 1
  const rawPercentage = (totalRaised / goalAmount) * 100
  const percentageRaised = Math.max(0, Math.min(Number.isFinite(rawPercentage) ? rawPercentage : 0, 100))
  const milestones = campaign.milestones || []

  // Sort milestones by target amount
  const sortedMilestones = [...milestones].sort((a, b) => a.target_amount - b.target_amount)

  return (
    <div className={cn("w-full", className)}>
      <div className="bg-light-bg-card dark:bg-dark-bg-card p-6 rounded-lg border border-light-border dark:border-dark-border">
        <h3 className="text-xl font-semibold text-light-text-base dark:text-dark-text-base mb-4">
          Campaign Progress
        </h3>

        {/* Main Progress Bar */}
          <div className="relative mb-8">
          <div
            role="progressbar"
            aria-label="Campaign progress"
            aria-valuenow={Number.isFinite(percentageRaised) ? Number(percentageRaised.toFixed(1)) : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-light-bg-hover dark:bg-dark-bg-hover rounded-full h-8 overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-1000 ease-out rounded-full relative will-change-[width]"
              style={{ width: `${percentageRaised}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Milestone Markers */}
          {sortedMilestones.map((milestone, index) => {
            const milestoneRaw = (milestone.target_amount / goalAmount) * 100
            const milestonePercentage = Math.max(0, Math.min(Number.isFinite(milestoneRaw) ? milestoneRaw : 0, 100))
            const isReached = milestone.reached_at !== null

            return (
              <div
                key={milestone.id}
                className="absolute top-0 h-8"
                style={{ left: `${Math.min(milestonePercentage, 100)}%` }}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-1 top-0 w-2 h-8",
                      isReached
                        ? "bg-primary"
                        : "bg-light-border dark:bg-dark-border"
                    )}
                  />
                  {/* Tooltip */}
                  <div className="group">
                    <div
                      className={cn(
                        "absolute -left-2 -top-2 w-4 h-4 rounded-full cursor-pointer",
                        isReached
                          ? "bg-primary"
                          : "bg-light-bg-card dark:bg-dark-bg-card border-2 border-light-border dark:border-dark-border"
                      )}
                    />
                    <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-light-bg-base dark:bg-dark-bg-base border border-light-border dark:border-dark-border rounded shadow-lg z-10">
                      <p className="text-xs font-semibold text-light-text-base dark:text-dark-text-base">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted">
                        ${(milestone.target_amount / 100).toLocaleString()}
                      </p>
                      {isReached && (
                        <p className="text-xs text-primary mt-1">✓ Reached!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-primary">
              ${(totalRaised / 100).toLocaleString()}
            </div>
            <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
              raised
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-light-text-base dark:text-dark-text-base">
              {percentageRaised.toFixed(1)}%
            </div>
            <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
              of goal
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-light-text-base dark:text-dark-text-base">
              {stats.total_cookies_sold}
            </div>
            <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
              cookies sold
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-light-text-base dark:text-dark-text-base">
              {stats.total_backers}
            </div>
            <div className="text-sm text-light-text-muted dark:text-dark-text-muted">
              backers
            </div>
          </div>
        </div>

        {/* Milestones List */}
        {sortedMilestones.length > 0 && (
          <div className="mt-6 pt-6 border-t border-light-border dark:border-dark-border">
            <h4 className="text-sm font-semibold text-light-text-base dark:text-dark-text-base mb-3">
              Milestones
            </h4>
            <div className="space-y-3">
              {sortedMilestones.map((milestone) => {
                const isReached = milestone.reached_at !== null
                return (
                  <div
                    key={milestone.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      isReached
                        ? "bg-primary/10"
                        : "bg-light-bg-hover dark:bg-dark-bg-hover"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        isReached
                          ? "bg-primary text-white"
                          : "bg-light-border dark:bg-dark-border"
                      )}
                    >
                      {isReached && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-light-text-base dark:text-dark-text-base">
                        {milestone.title} - ${(milestone.target_amount / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker