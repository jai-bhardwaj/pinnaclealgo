#!/bin/bash

# Configuration
APP_URL="http://localhost:3000"
TEST_USERNAME="testuser"
TEST_PASSWORD="testpass"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Quick Login Test"
echo "-----------------"

# Test 1: Quick health check
echo -n "Testing application health... "
if curl -s -f "$APP_URL" > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Application is not responding. Please check if it's running."
    exit 1
fi

# Test 2: Login test
echo -n "Testing login... "
RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}")

if [[ $RESPONSE == *"error"* ]]; then
    echo -e "${RED}✗${NC}"
    echo "Login failed. Response: $RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓${NC}"
fi

echo -e "\n${GREEN}All tests completed!${NC}" 