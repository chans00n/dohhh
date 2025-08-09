import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="mt-4">
      <Text
        className="text-base text-light-text-muted dark:text-dark-text-muted whitespace-pre-line"
        data-testid="product-subtitle"
      >
        {product.subtitle || product.description}
      </Text>
    </div>
  )
}

export default ProductInfo
