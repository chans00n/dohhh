import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import ThemeToggle from "@modules/layout/components/theme-toggle"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-light-bg-card dark:bg-dark-bg-card border-light-border dark:border-dark-border">
        <nav className="content-container txt-xsmall-plus text-light-text-muted dark:text-dark-text-muted flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center"
              data-testid="nav-store-link"
            >
              <img 
                src="/dohhh-light.png" 
                alt="Dohhh! Logo" 
                className="h-8 w-auto dark:hidden"
              />
              <img 
                src="/dohhh-dark.png" 
                alt="Dohhh! Logo" 
                className="h-8 w-auto hidden dark:block"
              />
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-primary"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <div className="hidden small:block">
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-primary flex gap-2"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Cart (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </header>
    </div>
  )
}
