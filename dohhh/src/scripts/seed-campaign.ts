import { Modules } from "@medusajs/framework/utils"

export default async function seedCampaign({ container }) {
  const fundraisingModuleService = container.resolve("fundraisingModuleService")
  
  console.log("Seeding campaign data...")

  try {
    // Check if there's already an active campaign
    const existingCampaigns = await fundraisingModuleService.listFundraisingCampaigns(
      { status: "active" }
    )

    if (existingCampaigns.length > 0) {
      console.log("Active campaign already exists, skipping seed")
      return
    }

    // Create a new campaign
    const campaign = await fundraisingModuleService.createFundraisingCampaigns({
      title: "Help Local Food Bank Feed Families",
      description: "Every cookie you buy helps provide meals to families in need through our local food bank partnership.",
      story_content: `
        <p>Our local food bank serves over 10,000 families each month, providing essential nutrition to those who need it most. 
        With rising costs and increasing demand, they need our help more than ever.</p>
        
        <p>That's why we've partnered with them for this special campaign. For every cookie sold, we'll donate a portion 
        of the proceeds directly to the food bank. Your purchase doesn't just satisfy your sweet tooth - it helps feed families in our community.</p>
        
        <p>Our goal is to raise $50,000, which will provide:</p>
        <ul>
          <li>25,000 meals for families in need</li>
          <li>Weekend food packages for 500 children</li>
          <li>Holiday meal boxes for 200 families</li>
          <li>Fresh produce for the community pantry</li>
        </ul>
        
        <p>Join us in making a difference, one delicious cookie at a time!</p>
      `,
      impact_content: `
        <p>Your contribution makes a real difference:</p>
        <ul>
          <li><strong>$10</strong> = 5 meals for a family</li>
          <li><strong>$25</strong> = Weekend food package for a child</li>
          <li><strong>$50</strong> = Fresh produce for 10 families</li>
          <li><strong>$100</strong> = Complete holiday meal box</li>
        </ul>
      `,
      cause_name: "Local Food Bank",
      goal_amount: 5000000, // $50,000 in cents
      goal_cookies: 10000,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "active",
      featured_image_url: "/images/food-bank-hero.jpg",
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual video
      organizer_name: "DOHHH Cookies Team",
      organizer_title: "Campaign Organizer",
      organizer_bio: "We're passionate about using our platform to make a positive impact in our community.",
    })

    console.log("Campaign created:", campaign.id)

    // Create campaign stats
    const stats = await fundraisingModuleService.createFundraisingStats({
      campaign_id: campaign.id,
      total_raised: 1250000, // $12,500
      total_cookies_sold: 2500,
      total_backers: 150,
      average_contribution: 8333, // $83.33
      last_updated: new Date(),
    })

    console.log("Campaign stats created")

    // Create milestones
    const milestones = [
      {
        campaign_id: campaign.id,
        title: "First 1000 Cookies",
        description: "Amazing start! We've sold our first 1000 cookies.",
        target_amount: 500000, // $5,000
        reached_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        order: 1,
      },
      {
        campaign_id: campaign.id,
        title: "25% of Goal",
        description: "Quarter of the way there! Thank you for your support.",
        target_amount: 1250000, // $12,500
        reached_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        order: 2,
      },
      {
        campaign_id: campaign.id,
        title: "50% of Goal",
        description: "Halfway to our goal! Keep the momentum going.",
        target_amount: 2500000, // $25,000
        reached_at: null,
        order: 3,
      },
      {
        campaign_id: campaign.id,
        title: "Goal Reached!",
        description: "We did it! Thank you to all our amazing supporters.",
        target_amount: 5000000, // $50,000
        reached_at: null,
        order: 4,
      },
    ]

    for (const milestone of milestones) {
      await fundraisingModuleService.createFundraisingMilestones(milestone)
    }

    console.log("Milestones created")

    // Create campaign updates
    const updates = [
      {
        campaign_id: campaign.id,
        title: "Campaign Launch!",
        content: "We're excited to announce our partnership with the local food bank. Every cookie counts!",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        campaign_id: campaign.id,
        title: "First Milestone Reached",
        content: "Thanks to your incredible support, we've already sold 1000 cookies and raised $5,000!",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        campaign_id: campaign.id,
        title: "Food Bank Visit",
        content: "We visited the food bank today to see your donations in action. The impact is incredible!",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]

    for (const update of updates) {
      await fundraisingModuleService.createFundraisingUpdates(update)
    }

    console.log("Campaign updates created")
    console.log("Campaign seeding completed successfully!")

  } catch (error) {
    console.error("Error seeding campaign:", error)
    throw error
  }
}