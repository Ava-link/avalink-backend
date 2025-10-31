#!/bin/bash

# Test script to demonstrate Ray-ID functionality
# This script makes requests to the API and shows the Ray-ID in responses

echo "=========================================="
echo "Ray-ID Test Script"
echo "=========================================="
echo ""

API_URL="http://localhost:3000"

echo "1. Testing Health Check Endpoint..."
echo "   GET $API_URL/health"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "Ray-ID from response:"
echo "$BODY" | jq -r '.rayId' 2>/dev/null || echo "Could not extract Ray-ID"
echo ""
echo "=========================================="
echo ""

echo "2. Testing Wallet Info Endpoint..."
echo "   GET $API_URL/deploy/wallet-info"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/deploy/wallet-info")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "Ray-ID from response:"
echo "$BODY" | jq -r '.rayId' 2>/dev/null || echo "Could not extract Ray-ID"
echo ""
echo "=========================================="
echo ""

echo "3. Testing with verbose output to see headers..."
echo "   GET $API_URL/health (verbose)"
echo ""
curl -v "$API_URL/health" 2>&1 | grep -i "x-ray-id" || echo "No X-Ray-ID header found"
echo ""
echo "=========================================="
echo ""

echo "✅ Test Complete!"
echo ""
echo "💡 Tips:"
echo "   - Check the server console for logs with Ray-IDs"
echo "   - Check logs/combined.log for JSON-formatted logs"
echo "   - Each response includes a 'rayId' field"
echo "   - Each response includes an 'X-Ray-ID' header"
echo ""

