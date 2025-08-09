"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0)

  if (!images || images.length === 0) {
    return (
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle">
        <div className="flex items-center justify-center h-full text-ui-fg-subtle">
          No image available
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Thumbnails - Left on desktop, bottom on mobile */}
      <div className="flex lg:flex-col gap-2 w-full lg:w-20 order-2 lg:order-1 overflow-x-auto lg:overflow-x-visible">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-square w-20 lg:w-full flex-shrink-0 overflow-hidden bg-ui-bg-subtle rounded-md border-2 transition-all ${
              selectedImage === index
                ? "border-gray-900"
                : "border-transparent hover:border-gray-400"
            }`}
          >
            {image.url && (
              <Image
                src={image.url}
                alt={`Product thumbnail ${index + 1}`}
                fill
                sizes="80px"
                style={{
                  objectFit: "cover",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Image */}
      <Container className="relative aspect-square flex-1 overflow-hidden bg-ui-bg-subtle order-1 lg:order-2">
        {images[selectedImage]?.url && (
          <Image
            src={images[selectedImage].url}
            priority
            className="absolute inset-0 rounded-lg"
            alt={`Product image ${selectedImage + 1}`}
            fill
            sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            style={{
              objectFit: "cover",
            }}
          />
        )}
      </Container>
    </div>
  )
}

export default ImageGallery
