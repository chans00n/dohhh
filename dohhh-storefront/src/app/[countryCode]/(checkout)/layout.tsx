import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-light-bg-base dark:bg-dark-bg-base relative small:min-h-screen">
      <div className="h-16 bg-light-bg-base dark:bg-dark-bg-base border-b border-light-border dark:border-dark-border">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-light-text-base dark:text-dark-text-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-light-text-muted dark:text-dark-text-muted hover:text-primary">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-light-text-muted dark:text-dark-text-muted hover:text-primary">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-light-text-muted dark:text-dark-text-muted hover:text-primary uppercase"
            data-testid="store-link"
          >
            <img src="/dohhh-light.png" alt="Dohhh! Logo" className="h-8 w-auto dark:hidden"/>
            <img src="/dohhh-dark.png" alt="Dohhh! Logo" className="h-8 w-auto hidden dark:block"/>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}
