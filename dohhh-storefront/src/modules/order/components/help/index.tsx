import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div className="mt-6">
      <Heading className="text-base-semi text-light-text-base dark:text-dark-text-base">Need help?</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contact" className="text-primary hover:text-primary-hover">Contact</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contact" className="text-primary hover:text-primary-hover">
              Returns & Exchanges
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
