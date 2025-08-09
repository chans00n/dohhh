import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"

export default async function testSubscriber({
  event: { name, data },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  logger.info(`[TEST] Event fired: ${name}`)
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.completed", "cart.created"],
}