import { cn } from "@lib/utils"
import React from "react"

interface TestimonialProps {
  quote: string
  author: string
  role?: string
  rating?: number
  className?: string
}

const Testimonial: React.FC<TestimonialProps> = ({
  quote,
  author,
  role,
  rating = 5,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-lg border border-light-border dark:border-dark-border bg-light-bg-card dark:bg-dark-bg-card p-6",
      className
    )}>
      {/* Star Rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating
                ? "fill-primary text-primary"
                : "fill-light-border dark:fill-dark-border text-light-border dark:text-dark-border"
            )}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="flex-1 text-light-text-base dark:text-dark-text-base">
        "{quote}"
      </blockquote>

      {/* Author */}
      <div>
        <p className="font-semibold text-light-text-base dark:text-dark-text-base">
          {author}
        </p>
        {role && (
          <p className="text-sm text-light-text-muted dark:text-dark-text-muted">
            {role}
          </p>
        )}
      </div>
    </div>
  )
}

interface TestimonialsProps {
  testimonials: Array<{
    quote: string
    author: string
    role?: string
    rating?: number
  }>
  className?: string
}

export const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials,
  className
}) => {
  return (
    <section className={cn("w-full py-16 bg-light-bg-base dark:bg-dark-bg-base", className)}>
      <div className="content-container">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-light-text-base dark:text-dark-text-base mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-light-text-muted dark:text-dark-text-muted max-w-2xl mx-auto">
              Don't just take our word for it. Here's what people are saying about our delicious cookies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Testimonial
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials