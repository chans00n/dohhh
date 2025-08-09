import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { handleOrderCampaignContributionWorkflow } from "../workflows/handle-order-campaign-contribution"

export default async function handleOrderPlaced({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string; cart_id?: string; total?: number }>) {
  const logger = container.resolve("logger")
  
  try {
    logger.info(`[CAMPAIGN] Event ${name} fired for order ${data.id}`)
    
    // Check if there's campaign metadata in the order
    const orderModule = container.resolve("order")
    const order = await orderModule.retrieveOrder(data.id)
    
    const campaignId = order.metadata?.campaign_id as string | undefined
    const contributionMetadata = {
      is_anonymous: order.metadata?.contribution_anonymous || false,
      contribution_message: order.metadata?.contribution_message || null,
    }
    
    // Pass the cart_id and any total from the event data
    const workflowInput: any = {
      order_id: data.id,
      campaign_id: campaignId,
      metadata: contributionMetadata,
    }
    
    // If we have cart_id from the event, pass it along
    if (data.cart_id) {
      workflowInput.cart_id = data.cart_id
    }
    
    // If we have total from the event, pass it along
    if (data.total) {
      workflowInput.order_total = data.total
    }
    
    // Run the workflow to create contribution and update stats
    const { result } = await handleOrderCampaignContributionWorkflow.run({
      input: workflowInput,
      container,
    })
    
    logger.info(`Campaign contribution processed for order ${data.id}: ${JSON.stringify(result)}`)
  } catch (error) {
    logger.error(`Failed to process campaign contribution for order ${data.id}:`, error)
    // Don't throw - we don't want to fail the order placement if campaign tracking fails
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
}