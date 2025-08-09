import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="flex flex-col">
      <Divider className="!mb-0" />
      <div className="[&_table]:border-none [&_td]:border-none [&_tr]:border-none [&_table]:bg-transparent [&_tr:hover]:bg-transparent [&_td]:bg-transparent [&_table]:shadow-none [&>div]:border-none [&>div]:shadow-none">
        <Table>
          <Table.Body data-testid="products-table" className="!border-none divide-none">
          {items?.length
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={order.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default Items
