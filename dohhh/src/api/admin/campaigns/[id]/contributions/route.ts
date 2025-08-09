import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FUNDRAISING_MODULE } from "../../../../../modules/fundraising"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  
  const fundraisingModule = req.scope.resolve(FUNDRAISING_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    // Get contributions for this campaign with customer and order data
    const contributions = await fundraisingModule.listFundraisingContributions({
      campaign_id: id
    })
    
    // Get customer data for each contribution
    const contributionsWithDetails = await Promise.all(
      contributions.map(async (contribution) => {
        let customer: any = null
        let order: any = null
        
        if (contribution.customer_id) {
          try {
            const { data: customers } = await query.graph({
              entity: "customer",
              filters: { id: contribution.customer_id },
              fields: ["id", "email", "first_name", "last_name"]
            })
            customer = customers[0] || null
          } catch (e) {
            // Customer might not exist
          }
        }
        
        if (contribution.order_id) {
          try {
            const { data: orders } = await query.graph({
              entity: "order",
              filters: { id: contribution.order_id },
              fields: ["id", "display_id", "status", "created_at", "total"]
            })
            order = orders[0] || null
          } catch (e) {
            // Order might not exist
          }
        }
        
        return {
          ...contribution,
          customer,
          order
        }
      })
    )
    
    res.json({ 
      contributions: contributionsWithDetails
    })
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    })
  }
}