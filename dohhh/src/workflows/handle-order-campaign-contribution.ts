import {
  createWorkflow,
  WorkflowData,
  transform,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FUNDRAISING_MODULE } from "../modules/fundraising"

type WorkflowInput = {
  order_id: string
  campaign_id?: string
  metadata?: Record<string, any>
  cart_id?: string
  order_total?: number
}

const createContributionStep = createStep(
  "create-contribution",
  async (
    { order_id, campaign_id, metadata, cart_id, order_total }: WorkflowInput,
    { container }
  ) => {
    const orderModule = container.resolve(Modules.ORDER)
    const fundraisingModule = container.resolve(FUNDRAISING_MODULE) as any
    
    // Get the order details - try with minimal relations first
    let order = await orderModule.retrieveOrder(order_id)
    
    if (!order) {
      throw new Error(`Order ${order_id} not found`)
    }
    
    // If no campaign_id provided, get the active campaign
    let campaignId = campaign_id
    if (!campaignId) {
      const activeCampaign = await fundraisingModule.getActiveCampaign()
      if (activeCampaign) {
        campaignId = activeCampaign.id
      }
    }
    
    if (!campaignId) {
      // No active campaign, skip contribution creation
      return new StepResponse(null)
    }
    
    // Since the order.placed event fires before totals are calculated,
    // we need to use different strategies to get the actual total
    let orderTotal = "0"
    let cookieCount = 1 // Default to 1
    
    // Strategy 1: Use the order_total passed from the event if available
    if (order_total && order_total > 0) {
      orderTotal = Math.round(order_total * 100).toString()
      console.log(`[CAMPAIGN] Using order total from event: $${order_total}`)
    }
    
    // Strategy 2: Try to get the cart if cart_id is provided
    if (orderTotal === "0" && cart_id) {
      try {
        const cartModule = container.resolve(Modules.CART)
        const cart = await cartModule.retrieveCart(cart_id, {
          relations: ["items", "shipping_methods"]
        })
        
        if ((cart as any).total) {
          const total = (cart as any).total
          if (typeof total === 'object' && total.amount !== undefined) {
            orderTotal = total.amount.toString()
          } else if (typeof total === 'number') {
            orderTotal = Math.round(total * 100).toString()
          }
          console.log(`[CAMPAIGN] Got total from cart: ${orderTotal} cents`)
        }
        
        // Get cookie count from cart items accounting for pack sizes
        if (cart.items && cart.items.length > 0) {
          cookieCount = 0
          for (const item of cart.items) {
            const qty = item.quantity || 1
            
            // Extract pack size from variant title
            let packSize = 1
            const variantTitle = (item as any).variant?.title || (item as any).title || ""
            const titleMatch = variantTitle.match(/(\d+)\s*Pack/i)
            if (titleMatch) {
              packSize = parseInt(titleMatch[1])
            }
            
            cookieCount += Math.round(Number(qty)) * packSize
          }
        }
      } catch (e) {
        console.log(`[CAMPAIGN] Could not get cart ${cart_id}:`, e.message)
      }
    }
    
    // Strategy 3: Try to get items from the order
    if (orderTotal === "0") {
      try {
        const orderWithItems = await orderModule.retrieveOrder(order_id, {
          relations: ["items", "shipping_methods"]
        })
        
        if (orderWithItems.items && orderWithItems.items.length > 0) {
          cookieCount = 0
          let calculatedTotal = 0
          
          for (const item of orderWithItems.items) {
            const quantity = (item as any).quantity || 1
            const unitPrice = (item as any).unit_price || 0
            
            // Try to extract numeric values from various formats
            let qty = 1
            let price = 0
            
            if (typeof quantity === 'object' && quantity.raw_?.value) {
              qty = parseFloat(quantity.raw_.value)
            } else if (typeof quantity === 'number') {
              qty = quantity
            }
            
            if (typeof unitPrice === 'object' && unitPrice.raw_?.value) {
              price = parseFloat(unitPrice.raw_.value)
            } else if (typeof unitPrice === 'number') {
              price = unitPrice
            }
            
            // Extract pack size from variant title (e.g., "4 Pack", "6 Pack", "8 Pack")
            let packSize = 1 // Default to 1 cookie if we can't determine
            const variantTitle = (item as any).variant_title || ""
            const titleMatch = variantTitle.match(/(\d+)\s*Pack/i)
            if (titleMatch) {
              packSize = parseInt(titleMatch[1])
            }
            
            // Calculate total individual cookies for this line item
            const individualCookies = Math.round(qty) * packSize
            cookieCount += individualCookies
            calculatedTotal += price * qty
            
            console.log(`[CAMPAIGN] Item: ${variantTitle}, Qty: ${qty}, Pack Size: ${packSize}, Total Cookies: ${individualCookies}`)
          }
          
          // Add shipping
          if ((orderWithItems as any).shipping_methods) {
            for (const method of (orderWithItems as any).shipping_methods) {
              const amount = (method as any).amount || 0
              if (typeof amount === 'object' && amount.raw_?.value) {
                calculatedTotal += parseFloat(amount.raw_.value)
              } else if (typeof amount === 'number') {
                calculatedTotal += amount
              }
            }
          }
          
          if (calculatedTotal > 0) {
            // The calculated total might be in dollars or cents, we need to detect
            if (calculatedTotal < 1000) {
              // Likely in dollars
              orderTotal = Math.round(calculatedTotal * 100).toString()
            } else {
              // Likely already in cents
              orderTotal = Math.round(calculatedTotal).toString()
            }
            console.log(`[CAMPAIGN] Calculated total from items: ${orderTotal} cents, Total cookies: ${cookieCount}`)
          }
        }
      } catch (e) {
        console.log(`[CAMPAIGN] Could not calculate from order items:`, e.message)
      }
    }
    
    // Last resort: use a default value
    if (orderTotal === "0") {
      orderTotal = "5199" // Default to $51.99
      console.log(`[CAMPAIGN] Warning: Using default total for order ${order_id}: $51.99`)
    }
    
    // Try to derive contributor name from shipping/billing address
    let contributorName: string | null = null
    try {
      const orderForName = await orderModule.retrieveOrder(order_id, {
        relations: ["shipping_address", "billing_address"],
      })
      const ship = (orderForName as any).shipping_address
      const bill = (orderForName as any).billing_address
      const nameFromShip = ship ? [ship.first_name, ship.last_name].filter(Boolean).join(" ") : ""
      const nameFromBill = bill ? [bill.first_name, bill.last_name].filter(Boolean).join(" ") : ""
      contributorName = (nameFromShip || nameFromBill || null)
    } catch (e) {
      // ignore
    }

    const contributionData = {
      campaign_id: campaignId,
      order_id: order.id,
      customer_id: order.customer_id,
      amount: orderTotal,
      cookies_purchased: cookieCount,
      contributor_name: contributorName,
      contributor_email: order.email,
      is_anonymous: metadata?.is_anonymous || false,
      message: metadata?.contribution_message || null,
      // Mark as completed on order.placed so it shows in storefront immediately
      status: "completed" as const,
    }
    
    console.log(`[CAMPAIGN] Creating contribution for order ${order.id}:`, {
      amount: orderTotal,
      cookies: cookieCount,
      campaign: campaignId
    })
    
    const contribution = await fundraisingModule.createFundraisingContributions(contributionData)
    
    return new StepResponse(contribution, contribution.id)
  },
  async (contributionId, { container }) => {
    if (!contributionId) return
    
    const fundraisingModule = container.resolve(FUNDRAISING_MODULE) as any
    await fundraisingModule.deleteFundraisingContributions(contributionId)
  }
)

const updateCampaignStatsStep = createStep(
  "update-campaign-stats",
  async (
    { contribution }: { contribution: any },
    { container }
  ) => {
    if (!contribution) {
      return new StepResponse(null)
    }
    
    const fundraisingModule = container.resolve(FUNDRAISING_MODULE) as any
    
    // Get the campaign with its current stats
    const campaign = await fundraisingModule.retrieveFundraisingCampaign(
      contribution.campaign_id,
      { relations: ["stats"] }
    )
    
    if (!campaign.stats) {
      // Create stats if they don't exist
      const stats = await fundraisingModule.createFundraisingStats({
        campaign_id: campaign.id,
        total_raised: contribution.amount,
        total_cookies_sold: contribution.cookies_purchased,
        total_backers: 1,
        average_contribution: contribution.amount,
        last_updated: new Date(),
      })
      
      return new StepResponse({ stats, isNew: true })
    }
    
    // Calculate new stats - ensure we're working with numbers
    const contributionAmount = parseInt(contribution.amount)
    const currentTotalRaised = parseInt(campaign.stats.total_raised.toString())
    const currentTotalCookiesSold = parseInt(campaign.stats.total_cookies_sold.toString())
    const currentTotalBackers = parseInt(campaign.stats.total_backers.toString())
    
    const newTotalRaised = currentTotalRaised + contributionAmount
    const newTotalCookiesSold = currentTotalCookiesSold + contribution.cookies_purchased
    const newTotalBackers = currentTotalBackers + 1
    const newAverageContribution = Math.round(newTotalRaised / newTotalBackers)
    
    console.log(`[CAMPAIGN] Updating stats for campaign ${campaign.id}:`, {
      contribution: { amount: contributionAmount, cookies: contribution.cookies_purchased },
      current: { raised: currentTotalRaised, cookies: currentTotalCookiesSold, backers: currentTotalBackers },
      new: { raised: newTotalRaised, cookies: newTotalCookiesSold, backers: newTotalBackers }
    })
    
    // Update existing stats
    const [updatedStats] = await fundraisingModule.updateFundraisingStats([{
      id: campaign.stats.id,
      total_raised: newTotalRaised,
      total_cookies_sold: newTotalCookiesSold,
      total_backers: newTotalBackers,
      average_contribution: newAverageContribution,
      last_updated: new Date(),
    }])
    
    return new StepResponse({ stats: updatedStats, isNew: false })
  },
  async (data, { container }) => {
    if (!data || !data.stats) return
    
    const fundraisingModule = container.resolve(FUNDRAISING_MODULE) as any
    
    if (data.isNew) {
      // Delete the newly created stats
      await fundraisingModule.deleteFundraisingStats(data.stats.id)
    } else {
      // Revert the stats update (this is simplified - in production you'd want to store the old values)
      // For now, we'll just note that a proper rollback would require storing the previous state
      console.warn("Stats rollback not fully implemented - manual intervention may be required")
    }
  }
)

export const handleOrderCampaignContributionWorkflow = createWorkflow(
  "handle-order-campaign-contribution",
  (input: WorkflowData<WorkflowInput>) => {
    const contribution = createContributionStep(input)
    
    const statsUpdate = updateCampaignStatsStep({
      contribution,
    })
    
    // Return void since these are side effects
    return
  }
)