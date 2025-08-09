"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"

type Testimonial = {
  id: number
  text: string
  author: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "These cookies are a game-changer! Definitely going to be my go-to for all my baking from now on!",
    author: "Sarah"
  },
  {
    id: 2,
    text: "The flavor was spot on—rich and velvety without being overly sweet. They melted beautifully!",
    author: "Michael"
  },
  {
    id: 3,
    text: "These cookies are hands down the best I've ever tried! If you're a fan of chocolate in your baked goods, you need these in your pantry!",
    author: "Emma"
  }
]

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    )
  }

  return (
    <section className="w-full py-16 bg-light-bg-card dark:bg-dark-bg-card">
      <div className="content-container">
        <h2 className="text-3xl font-medium text-center mb-12 text-light-text-base dark:text-dark-text-base">Testimonials</h2>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full border border-light-border dark:border-dark-border hover:border-primary transition-colors text-light-text-base dark:text-dark-text-base"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Testimonials */}
            <div className="flex-1 overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="w-full flex-shrink-0 px-8 text-center"
                  >
                    <blockquote className="text-lg mb-4 text-light-text-base dark:text-dark-text-base">
                      "{testimonial.text}"
                    </blockquote>
                    <cite className="text-light-text-muted dark:text-dark-text-muted not-italic">
                      {testimonial.author}
                    </cite>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-2 rounded-full border border-light-border dark:border-dark-border hover:border-primary transition-colors text-light-text-base dark:text-dark-text-base"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-light-border dark:bg-dark-border"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsCarousel