#!/bin/bash

echo "🔍 Testing Medusa Admin Authentication"
echo "======================================"
echo ""

# Test 1: Check if backend is running
echo "1. Testing backend health..."
curl -s https://admin.dohhh.shop/health | python3 -m json.tool
echo ""

# Test 2: Check admin info
echo "2. Testing admin configuration..."
curl -s https://admin.dohhh.shop/admin-info | python3 -m json.tool
echo ""

# Test 3: Try to login
echo "3. Testing authentication..."
echo "   Attempting login with admin@dohhh.shop"

response=$(curl -s -X POST https://admin.dohhh.shop/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dohhh.shop","password":"Admin123!"}' \
  -c /tmp/medusa-cookies.txt \
  -w "\nHTTP_CODE:%{http_code}")

http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE/d')

echo "   HTTP Status: $http_code"
echo "   Response:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ Authentication successful!"
  echo ""
  
  # Test 4: Try to access admin with cookie
  echo "4. Testing admin access with session..."
  curl -s -b /tmp/medusa-cookies.txt https://admin.dohhh.shop/admin \
    -H "Accept: text/html" \
    -o /tmp/admin-response.html
  
  if grep -q "<!DOCTYPE html>" /tmp/admin-response.html 2>/dev/null; then
    echo "✅ Admin panel HTML received!"
  else
    echo "❌ Admin panel not returning HTML"
    echo "Response preview:"
    head -n 5 /tmp/admin-response.html
  fi
else
  echo "❌ Authentication failed"
  echo ""
  echo "Possible issues:"
  echo "- Password not updated in auth_identity table"
  echo "- JWT_SECRET or COOKIE_SECRET not matching"
  echo "- Auth module not loaded correctly"
fi

echo ""
echo "======================================"
echo "Test complete!"