import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-light-bg-card dark:bg-dark-bg-card flex flex-col rounded-lg shadow-sm border border-light-border dark:border-dark-border">
        <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] gap-6 py-8 px-4 small:px-8">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-light-border dark:border-dark-border py-8 px-4 small:px-8 gap-8">
          <div>
            <h3 className="text-xl-semi mb-4 text-light-text-base dark:text-dark-text-base">Got questions?</h3>
            <span className="txt-medium text-light-text-muted dark:text-dark-text-muted">
              You can find frequently asked questions and answers on our
              customer service page.
            </span>
          </div>
          <div>
            <UnderlineLink href="/customer-service">
              Customer Service
            </UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
