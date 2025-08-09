"use client"

import React, { useState } from "react"
import { Button } from "@medusajs/ui"

const NewsletterSignup = () => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    
    // Simulate API call - replace with actual newsletter signup logic
    setTimeout(() => {
      setStatus("success")
      setEmail("")
      setTimeout(() => setStatus("idle"), 3000)
    }, 1000)
  }

  return (
    <section className="w-full py-16 bg-light-bg-card dark:bg-dark-bg-card">
      <div className="content-container max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-medium mb-8">
          Subscribe to join the DOHHH family.
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 px-4 py-3 border border-light-border dark:border-dark-border bg-light-bg-base dark:bg-dark-bg-base text-light-text-base dark:text-dark-text-base rounded-lg focus:outline-none focus:border-primary"
            required
            disabled={status === "loading"}
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="px-8 py-3 w-full !bg-primary hover:!bg-primary-hover !text-white !border-primary"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-primary">Thank you for subscribing!</p>
        )}
        
        {status === "error" && (
          <p className="mt-4 text-red-600">Something went wrong. Please try again.</p>
        )}

        <p className="mt-6 text-sm text-light-text-muted dark:text-dark-text-muted">
          By signing up to receive emails from us, you agree to our{" "}
          <a href="/privacy-policy" className="underline hover:text-primary">
            privacy policy
          </a>
          . We treat your info responsibly.
        </p>
      </div>
    </section>
  )
}

export default NewsletterSignup