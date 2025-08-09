import { Button } from "@medusajs/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div className="bg-light-bg-card dark:bg-dark-bg-card flex flex-col p-4 rounded-lg hover:shadow-sm transition-shadow" data-testid="order-card">
      <div className="uppercase text-large-semi mb-1 text-light-text-base dark:text-dark-text-base">
        #<span data-testid="order-display-id">{order.display_id}</span>
      </div>
      <div className="flex items-center divide-x divide-light-border dark:divide-dark-border text-small-regular text-light-text-muted dark:text-dark-text-muted">
        <span className="pr-2" data-testid="order-created-at">
          {new Date(order.created_at).toDateString()}
        </span>
        <span className="px-2" data-testid="order-amount">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
        <span className="pl-2">{`${numberOfLines} ${
          numberOfLines > 1 ? "items" : "item"
        }`}</span>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 my-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-2"
              data-testid="order-item"
            >
              <Thumbnail
                thumbnail={i.thumbnail}
                images={[]}
                size="square"
                fit="cover"
                className="!p-0 !bg-transparent !shadow-none !rounded-md w-full"
              />
              <div className="flex items-center justify-center text-small-regular text-light-text-muted dark:text-dark-text-muted">
                <span className="text-light-text-base dark:text-dark-text-base font-semibold" data-testid="item-title">
                  {i.title}
                </span>
                <span className="ml-2">x</span>
                <span data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-small-regular text-light-text-muted dark:text-dark-text-muted">
              + {numberOfLines - 4}
            </span>
            <span className="text-small-regular text-light-text-muted dark:text-dark-text-muted">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary" className="!bg-light-bg-base dark:!bg-dark-bg-base !text-light-text-base dark:!text-dark-text-base !border-light-border dark:!border-dark-border hover:!bg-light-bg-hover dark:hover:!bg-dark-bg-hover transition-transform duration-150 hover:-translate-y-0.5">
            See details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
