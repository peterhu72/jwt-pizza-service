#!/bin/bash

#host="https://pizza-service.maxiparis.com"
host="http://localhost:3000"

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

# Function to cleanly exit
cleanup() {
  echo -e "${RED}✔️ Terminating background processes...${NC}"
  kill $pid1 $pid2 $pid3 $pid4
  exit 0
}

# Trap SIGINT (Ctrl+C) to execute the cleanup function
trap cleanup SIGINT

# Simulate a user requesting the menu every 3 seconds
while true; do
  echo -e "${CYAN}🔄 Requesting menu...${NC}"
  curl "$host/api/order/menu"
  sleep 3
done &
pid1=$!

# Simulate a user with an invalid email and password every 25 seconds
while true; do
  echo -e "${RED}✖️ Logging in with invalid credentials...${NC}"
  curl -X PUT "$host/api/auth" -d '{"email":"unknown@jwt.com", "password":"bad"}' -H 'Content-Type: application/json'
  sleep 25
done &
pid2=$!

# Simulate a franchisee logging in every two minutes
while true; do
  echo -e "${GREEN}✔️ Login franchisee...${NC}"
  response=$(curl -s -X PUT $host/api/auth -d '{"email":"f@jwt.com", "password":"franchisee"}' -H 'Content-Type: application/json')
  echo -e "${BLUE}Response: $response${NC}"
  token=$(echo $response | jq -r '.token')
  sleep 110
  echo -e "${GREEN}✔️ Logging out franchisee...${NC}"
  curl -X DELETE $host/api/auth -H "Authorization: Bearer $token"
  sleep 10
done &
pid3=$!

# Simulate a diner ordering a pizza every 20 seconds
while true; do
  echo -e "${YELLOW}✔️ Login diner...${NC}"
  response=$(curl -s -X PUT $host/api/auth -d '{"email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json')
  echo -e "${BLUE}Response: $response${NC}"
  token=$(echo $response | jq -r '.token')
  curl -X POST $host/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H "Authorization: Bearer $token"
  echo -e "${GREEN}🔥 Bought a pizza...${NC}"
  sleep 20
  echo -e "${YELLOW}✔️ Logging out diner...${NC}"
  curl -X DELETE $host/api/auth -H "Authorization: Bearer $token"
  sleep 30
done &
pid4=$!

# Wait for the background processes to complete
wait $pid1 $pid2 $pid3 $pid4