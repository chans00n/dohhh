import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem] text-light-text-base dark:text-dark-text-base">Cart</Heading>
      </div>
      <div className="[&_table]:border-none [&_td]:border-none [&_tr]:border-none [&_table]:bg-transparent [&_tr:hover]:bg-transparent [&_td]:bg-transparent [&_table]:shadow-none">
        <Table>
          <Table.Header className="border-t-0">
          <Table.Row className="text-light-text-muted dark:text-dark-text-muted txt-medium-plus !border-b border-light-border dark:border-dark-border">
            <Table.HeaderCell className="!pl-0 !bg-transparent !border-none text-light-text-muted dark:text-dark-text-muted">Item</Table.HeaderCell>
            <Table.HeaderCell className="!bg-transparent !border-none"></Table.HeaderCell>
            <Table.HeaderCell className="!bg-transparent !border-none text-light-text-muted dark:text-dark-text-muted">Quantity</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell !bg-transparent !border-none text-light-text-muted dark:text-dark-text-muted">
              Price
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right !bg-transparent !border-none text-light-text-muted dark:text-dark-text-muted">
              Total
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
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

export default ItemsTemplate
