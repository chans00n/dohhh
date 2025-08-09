#!/bin/bash

# Medusa Admin Login Script
# This script logs you into the admin panel using curl

echo "🔐 Medusa Admin Login Script"
echo "===================================="
echo ""

# Default values
EMAIL="admin@dohhh.shop"
PASSWORD="Admin123!"
API_URL="https://admin.dohhh.shop"

# Ask for credentials
read -p "Enter admin email [$EMAIL]: " input_email
EMAIL=${input_email:-$EMAIL}

read -s -p "Enter password [$PASSWORD]: " input_password
echo ""
PASSWORD=${input_password:-$PASSWORD}

echo ""
echo "Logging in as: $EMAIL"
echo ""

# Login request
response=$(curl -s -X POST "$API_URL/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c cookies.txt \
  -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS/d')

if [ "$http_status" = "200" ]; then
    echo "✅ Login successful!"
    echo ""
    echo "Response:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    echo "Session cookie saved to: cookies.txt"
    echo ""
    echo "📝 Next steps:"
    echo "1. Your session is now active"
    echo "2. You can access the admin panel at: $API_URL/admin"
    echo "3. Or use curl with the cookie file for API requests:"
    echo "   curl -b cookies.txt $API_URL/admin/test-auth"
else
    echo "❌ Login failed (HTTP $http_status)"
    echo ""
    echo "Response:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    echo "Please check your credentials and try again"
fi