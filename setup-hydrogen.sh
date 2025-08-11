#!/bin/bash

# Shopify Hydrogen Project Setup Script
# Run this to set up your new Hydrogen project

echo "🚀 Setting up Shopify Hydrogen Project for DOHHH Cookie Fundraising"
echo "===================================================================="
echo ""

# Create project using Hydrogen CLI
echo "📦 Creating new Hydrogen project..."
npx create-hydrogen@latest dohhh-hydrogen \
  --template demo-store \
  --language ts \
  --styling tailwind \
  --install-deps

cd dohhh-hydrogen

echo ""
echo "📝 Creating .env file template..."
cat > .env << 'EOF'
# Shopify Store Configuration
SESSION_SECRET="your-session-secret-here"
PUBLIC_STORE_DOMAIN="your-store.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="your-storefront-api-token"
PUBLIC_STOREFRONT_ID="gid://shopify/Storefront/YOUR_ID"

# Optional: Customer Account API (for user accounts)
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=""
PUBLIC_CUSTOMER_ACCOUNT_API_URL=""
EOF

echo ""
echo "✅ Project created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Get your Shopify credentials from your admin panel"
echo "2. Update the .env file with your actual values"
echo "3. Run 'cd dohhh-hydrogen && npm run dev' to start development"
echo ""
echo "🔗 Useful Links:"
echo "- Shopify Admin: https://admin.shopify.com"
echo "- Hydrogen Docs: https://hydrogen.shopify.dev"
echo "- Get API Token: Settings → Apps → Develop apps → Create app"
echo ""
echo "Happy coding! 🎉"