"use client"

import { Button, Table } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="w-full">
        {/* Mobile cards */}
        <div className="small:hidden space-y-3">
          {orders.map((o) => {
            const itemCount = o.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0
            const rawStatus = (o as any).fulfillment_status || (o as any).status || (o as any).payment_status || "Processing"
            const statusText = String(rawStatus).replaceAll("_", " ")
            return (
              <div key={o.id} className="rounded-lg border border-light-border/80 dark:border-dark-border/80 bg-light-bg-card dark:bg-dark-bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-light-bg-hover dark:bg-dark-bg-hover">
                      <Thumbnail thumbnail={o.items?.[0]?.thumbnail} size="full" fit="cover" className="!p-0 !shadow-none !bg-transparent" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-light-text-base dark:text-dark-text-base font-semibold">#{o.display_id}</div>
                      <div className="text-[10px] leading-tight mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-light-border dark:border-dark-border text-light-text-muted dark:text-dark-text-muted">
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>
                  <LocalizedClientLink href={`/account/orders/details/${o.id}`}>
                    <Button size="small" variant="secondary" className="!bg-light-bg-base dark:!bg-dark-bg-base !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-light-bg-hover dark:hover:!bg-dark-bg-hover">
                      See details
                    </Button>
                  </LocalizedClientLink>
                </div>
                {/* Thumbnails */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto">
                  {(o.items || []).slice(0, 6).map((it) => (
                    <div key={it.id} className="w-8 h-8 rounded-md overflow-hidden bg-light-bg-hover dark:bg-dark-bg-hover flex-shrink-0">
                      <Thumbnail thumbnail={it.thumbnail} size="full" fit="cover" className="!p-0 !shadow-none !bg-transparent" />
                    </div>
                  ))}
                </div>
                {/* Stacked meta */}
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-light-text-muted dark:text-dark-text-muted">Date</dt>
                    <dd className="text-light-text-base dark:text-dark-text-base">{new Date(o.created_at).toDateString()}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-light-text-muted dark:text-dark-text-muted">Items</dt>
                    <dd className="text-light-text-base dark:text-dark-text-base">{itemCount}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-light-text-muted dark:text-dark-text-muted">Total</dt>
                    <dd className="text-light-text-base dark:text-dark-text-base">{convertToLocale({ amount: o.total, currency_code: o.currency_code })}</dd>
                  </div>
                </dl>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden small:block overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-bg-card dark:bg-dark-bg-card">
          <Table className="min-w-[680px]">
            <Table.Header className="bg-light-bg-hover dark:bg-dark-bg-hover">
              <Table.Row>
                <Table.HeaderCell className="text-left text-xs uppercase tracking-wide text-light-text-muted dark:text-dark-text-muted">Order</Table.HeaderCell>
                <Table.HeaderCell className="text-left text-xs uppercase tracking-wide text-light-text-muted dark:text-dark-text-muted">Date</Table.HeaderCell>
                <Table.HeaderCell className="text-left text-xs uppercase tracking-wide text-light-text-muted dark:text-dark-text-muted">Items</Table.HeaderCell>
                <Table.HeaderCell className="text-left text-xs uppercase tracking-wide text-light-text-muted dark:text-dark-text-muted">Total</Table.HeaderCell>
                <Table.HeaderCell className="text-right text-xs uppercase tracking-wide text-light-text-muted dark:text-dark-text-muted">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map((o) => {
                const itemCount = o.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0
                const rawStatus = (o as any).fulfillment_status || (o as any).status || (o as any).payment_status || "Processing"
                const statusText = String(rawStatus).replaceAll("_", " ")
                return (
                  <Table.Row key={o.id} className="hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover h-16 transition-colors border-b border-light-border/60 dark:border-dark-border/60">
                    <Table.Cell className="text-left align-middle py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-light-bg-hover dark:bg-dark-bg-hover">
                          <Thumbnail thumbnail={o.items?.[0]?.thumbnail} size="full" fit="cover" className="!p-0 !shadow-none !bg-transparent" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-light-text-base dark:text-dark-text-base font-semibold">#{o.display_id}</div>
                          <div className="text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-light-border dark:border-dark-border text-light-text-muted dark:text-dark-text-muted">
                              {statusText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-left align-middle py-4">{new Date(o.created_at).toDateString()}</Table.Cell>
                    <Table.Cell className="text-left align-middle py-4">{itemCount}</Table.Cell>
                    <Table.Cell className="text-left align-middle py-4">{convertToLocale({ amount: o.total, currency_code: o.currency_code })}</Table.Cell>
                    <Table.Cell className="text-right align-middle py-4">
                      <LocalizedClientLink href={`/account/orders/details/${o.id}`}>
                        <Button size="small" variant="secondary" className="!bg-light-bg-base dark:!bg-dark-bg-base !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-light-bg-hover dark:hover:!bg-dark-bg-hover">
                          See details
                        </Button>
                      </LocalizedClientLink>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi text-light-text-base dark:text-dark-text-base">Nothing to see here</h2>
      <p className="text-base-regular text-light-text-muted dark:text-dark-text-muted">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button" className="!bg-primary hover:!bg-primary-hover !text-white !border-primary">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
