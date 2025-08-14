export const CAMPAIGN_METAFIELDS_FRAGMENT = `#graphql
  fragment CampaignMetafields on Product {
    id
    handle
    title
    tags
    featuredImage { id url altText width height }
    images(first: 10) {
      nodes { id url altText width height }
    }
    variants(first: 10) {
      nodes { 
        id 
        title 
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
    # Aliased single metafields for robust parsing
    campaignName: metafield(namespace: "campaign", key: "name") { value }
    campaignSlug: metafield(namespace: "campaign", key: "slug") { value }
    campaignDescription: metafield(namespace: "campaign", key: "description") { value }
    campaignDescriptionRich: metafield(namespace: "campaign", key: "description_rich") { value }
    campaignStory: metafield(namespace: "campaign", key: "story_html") { value }
    campaignGoalQuantity: metafield(namespace: "campaign", key: "goal_quantity") { value }
    campaignDeadline: metafield(namespace: "campaign", key: "deadline") { value }
    campaignStatus: metafield(namespace: "campaign", key: "status") { value }
    campaignDeliveryMethods: metafield(namespace: "campaign", key: "delivery_methods") { value }
    campaignCurrentQuantity: metafield(namespace: "campaign", key: "current_quantity") { value }
    campaignBackerCount: metafield(namespace: "campaign", key: "backer_count") { value }
    campaignTotalRaised: metafield(namespace: "campaign", key: "total_raised") { value }
    campaignVideo: metafield(namespace: "campaign", key: "video") { value }
    # Alternative namespace commonly seen as a custom namespace
    campaignNameCustom: metafield(namespace: "custom.campaign", key: "name") { value }
    campaignSlugCustom: metafield(namespace: "custom.campaign", key: "slug") { value }
    # Namespace: custom with prefixed keys
    campaignNameCustomNs: metafield(namespace: "custom", key: "campaign_name") { value }
    campaignSlugCustomNs: metafield(namespace: "custom", key: "campaign_slug") { value }
    campaignDescriptionCustomNs: metafield(namespace: "custom", key: "campaign_description") { value }
    campaignStoryHtmlCustomNs: metafield(namespace: "custom", key: "campaign_story_html") { value }
    campaignGoalQuantityCustomNs: metafield(namespace: "custom", key: "campaign_goal_quantity") { value }
    campaignDeadlineCustomNs: metafield(namespace: "custom", key: "campaign_deadline") { value }
    campaignStatusCustomNs: metafield(namespace: "custom", key: "campaign_status") { value }
    campaignDeliveryMethodsJsonCustomNs: metafield(namespace: "custom", key: "campaign_delivery_methods_json") { value }
    campaignCurrentQuantityCustomNs: metafield(namespace: "custom", key: "campaign_current_quantity") { value }
    campaignBackerCountCustomNs: metafield(namespace: "custom", key: "campaign_backer_count") { value }
    campaignTotalRaisedCustomNs: metafield(namespace: "custom", key: "campaign_total_raised") { value }
    campaignBackersJsonCustomNs: metafield(namespace: "custom", key: "campaign_backers_json") { value }
    campaignBackers: metafield(namespace: "custom", key: "campaign_backers") { value }
    campaignDescriptionCustom: metafield(namespace: "custom.campaign", key: "description") { value }
    campaignStoryCustom: metafield(namespace: "custom.campaign", key: "story_html") { value }
    campaignGoalQuantityCustom: metafield(namespace: "custom.campaign", key: "goal_quantity") { value }
    campaignDeadlineCustom: metafield(namespace: "custom.campaign", key: "deadline") { value }
    campaignStatusCustom: metafield(namespace: "custom.campaign", key: "status") { value }
    campaignDeliveryMethodsCustom: metafield(namespace: "custom.campaign", key: "delivery_methods") { value }
    campaignCurrentQuantityCustom: metafield(namespace: "custom.campaign", key: "current_quantity") { value }
    campaignBackerCountCustom: metafield(namespace: "custom.campaign", key: "backer_count") { value }
    campaignTotalRaisedCustom: metafield(namespace: "custom.campaign", key: "total_raised") { value }
    campaignVideoCustom: metafield(namespace: "custom.campaign", key: "video") { value }
    campaignVideoCustomNs: metafield(namespace: "custom", key: "campaign_video") { value }
    metafields(identifiers: [
      {namespace: "campaign", key: "name"},
      {namespace: "campaign", key: "slug"},
      {namespace: "campaign", key: "description"},
      {namespace: "campaign", key: "description_rich"},
      {namespace: "campaign", key: "story_html"},
      {namespace: "campaign", key: "goal_quantity"},
      {namespace: "campaign", key: "deadline"},
      {namespace: "campaign", key: "status"},
      {namespace: "campaign", key: "delivery_methods"},
      {namespace: "campaign", key: "current_quantity"},
      {namespace: "campaign", key: "backer_count"},
      {namespace: "campaign", key: "total_raised"},
      {namespace: "campaign", key: "video"},
      {namespace: "custom.campaign", key: "name"},
      {namespace: "custom.campaign", key: "slug"},
      {namespace: "custom.campaign", key: "description"},
      {namespace: "custom.campaign", key: "story_html"},
      {namespace: "custom.campaign", key: "goal_quantity"},
      {namespace: "custom.campaign", key: "deadline"},
      {namespace: "custom.campaign", key: "status"},
      {namespace: "custom.campaign", key: "delivery_methods"},
      {namespace: "custom.campaign", key: "current_quantity"},
      {namespace: "custom.campaign", key: "backer_count"},
      {namespace: "custom.campaign", key: "total_raised"},
      {namespace: "custom.campaign", key: "video"},
      {namespace: "custom", key: "campaign_name"},
      {namespace: "custom", key: "campaign_slug"},
      {namespace: "custom", key: "campaign_description"},
      {namespace: "custom", key: "campaign_description_rich"},
      {namespace: "custom", key: "campaign_story_html"},
      {namespace: "custom", key: "campaign_goal_quantity"},
      {namespace: "custom", key: "campaign_deadline"},
      {namespace: "custom", key: "campaign_status"},
      {namespace: "custom", key: "campaign_delivery_methods_json"},
      {namespace: "custom", key: "campaign_current_quantity"},
      {namespace: "custom", key: "campaign_backer_count"},
      {namespace: "custom", key: "campaign_total_raised"},
      {namespace: "custom", key: "campaign_video"}
    ]) {
      key
      namespace
      type
      value
      reference { __typename }
    }
  }
` as const;

export const CAMPAIGN_LIST_QUERY = `#graphql
  ${CAMPAIGN_METAFIELDS_FRAGMENT}
  query CampaignProducts($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 50, query: "tag:campaign") {
      nodes { ...CampaignMetafields }
    }
  }
` as const;

export const CAMPAIGN_BY_HANDLE_QUERY = `#graphql
  ${CAMPAIGN_METAFIELDS_FRAGMENT}
  query CampaignByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    product(handle: $handle) { ...CampaignMetafields }
  }
` as const;

export const CAMPAIGN_RECENT_QUERY = `#graphql
  ${CAMPAIGN_METAFIELDS_FRAGMENT}
  query CampaignRecent($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products(first: 50, sortKey: UPDATED_AT, reverse: true) {
      nodes { ...CampaignMetafields }
    }
  }
` as const;
