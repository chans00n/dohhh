import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "eur",
            is_default: true,
          },
          {
            currency_code: "usd",
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Europe",
          currency_code: "eur",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system"
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "European Warehouse",
          address: {
            city: "Copenhagen",
            country_code: "DK",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default"
  })
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
    await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Default Shipping Profile",
            type: "default",
          },
        ],
      },
    });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "European Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Europe",
        geo_zones: [
          {
            country_code: "gb",
            type: "country",
          },
          {
            country_code: "de",
            type: "country",
          },
          {
            country_code: "dk",
            type: "country",
          },
          {
            country_code: "se",
            type: "country",
          },
          {
            country_code: "fr",
            type: "country",
          },
          {
            country_code: "es",
            type: "country",
          },
          {
            country_code: "it",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Webshop",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Cookies",
          is_active: true,
        },
        {
          name: "Special Offers",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Classic Chocolate Chip Cookie",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Cookies")!.id,
          ],
          description:
            "Our signature chocolate chip cookie made with premium Belgian chocolate chunks and pure vanilla extract. Each purchase supports a great cause!",
          handle: "classic-chocolate-chip",
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            cookie_count: "1",
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80",
            },
          ],
          options: [],
          variants: [
            {
              title: "Single Cookie",
              sku: "COOKIE-CHOC-1",
              prices: [
                {
                  amount: 500, // $5.00
                  currency_code: "eur",
                },
                {
                  amount: 500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Half Dozen Cookie Box",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Cookies")!.id,
          ],
          description:
            "A delightful box of 6 assorted cookies including chocolate chip, oatmeal raisin, and sugar cookies. Perfect for sharing or treating yourself!",
          handle: "half-dozen-box",
          weight: 300,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            cookie_count: "6",
            special_perk: "Free thank you card included",
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
            },
          ],
          options: [],
          variants: [
            {
              title: "6 Cookie Box",
              sku: "COOKIE-BOX-6",
              prices: [
                {
                  amount: 2500, // $25.00
                  currency_code: "eur",
                },
                {
                  amount: 2500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Dozen Cookie Box Deluxe",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Cookies")!.id,
          ],
          description:
            "Our premium selection of 12 handcrafted cookies featuring our full range of flavors. Includes special seasonal varieties and premium packaging.",
          handle: "dozen-box-deluxe",
          weight: 600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            cookie_count: "12",
            special_perk: "Premium gift box and personalized thank you note",
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1486893732792-ab0085cb2d43?w=800&q=80",
            },
          ],
          options: [],
          variants: [
            {
              title: "12 Cookie Deluxe Box",
              sku: "COOKIE-BOX-12",
              prices: [
                {
                  amount: 5000, // $50.00
                  currency_code: "eur",
                },
                {
                  amount: 5000,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Corporate Cookie Catering (50 pack)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Special Offers")!.id,
          ],
          description:
            "Perfect for corporate events, meetings, or large gatherings. 50 freshly baked cookies with custom packaging options. Make a big impact on your cause!",
          handle: "corporate-catering-50",
          weight: 2500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            cookie_count: "50",
            special_perk: "Custom branding available and recognition on our donor wall",
          },
          images: [
            {
              url: "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&q=80",
            },
          ],
          options: [],
          variants: [
            {
              title: "50 Cookie Catering Pack",
              sku: "COOKIE-CORP-50",
              prices: [
                {
                  amount: 15000, // $150.00
                  currency_code: "eur",
                },
                {
                  amount: 15000,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");

  // Seed campaign data - temporarily disabled until module is properly loaded
  // logger.info("Seeding campaign data...");
  // await seedCampaign({ container });
  // logger.info("Finished seeding campaign data.");
}
