#!/usr/bin/env bash
# -e: exit immediately on any command failure
# -u: treat unset variables as errors
# -o pipefail: a pipeline fails if any command in it fails (not just the last one)
set -euo pipefail

# One-click demo: start services.
# Usage:
#   demo/demo.sh        Start everything
#   demo/demo.sh down   Tear down

# "${1:-}" safely reads the first arg, defaulting to empty string if not provided (avoids -u error)
COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"

if [[ "${1:-}" == "down" ]]; then
  # Stop and remove all containers, networks; --remove-orphans cleans up containers from removed services
  docker compose -f "$COMPOSE_FILE" down --remove-orphans
  echo "All services stopped."
  exit 0
fi

echo "Starting services..."
# -d: detached mode, run containers in background
# --remove-orphans: remove containers for services no longer defined in compose file
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Waiting for services to be healthy..."
# Loop through each service and poll until Docker reports it as "healthy" (based on healthcheck in compose)
for service in spaceship-app super-agent ord-provider-super; do
  # printf with %-20s left-aligns the service name in a 20-char column
  printf "  %-20s" "$service"
  # "until" loops until the condition is true; here we check the container status for "healthy"
  # docker compose ps --format: outputs container status using Go template
  # grep -q healthy: check if "healthy" appears in the status string (exit code only, no output)
  until docker compose -f "$COMPOSE_FILE" ps "$service" --format '{{.Status}}' | grep -q healthy; do
    sleep 1       # wait 1 second between each poll
    printf "."    # print a dot to show progress
  done
  echo " ready"
done

echo ""
echo "Verifying ORD discovery..."
# curl -f: fail on HTTP errors (returns exit code 22 instead of outputting error page)
# Spaceship App ORD — served by itself on port 3001
spaceship_count=$(curl -f http://localhost:3001/ord/v1/documents/document | node -e "let b='';process.stdin.on('data',d=>b+=d);process.stdin.on('end',()=>console.log(JSON.parse(b).agents.length))")
echo "  Spaceship App:    $spaceship_count agent(s) via ORD (port 3001)"
# Super Agent ORD — served by ord-provider-super on port 3004
super_count=$(curl -f http://localhost:3004/ord/v1/documents/document | node -e "let b='';process.stdin.on('data',d=>b+=d);process.stdin.on('end',()=>console.log(JSON.parse(b).agents.length))")
echo "  Super Agent:      $super_count agent(s) via ORD (port 3004)"

echo ""
echo "Demo ready!"
echo ""
echo "  Spaceship App:        http://localhost:3001  (2 agents: Solar + Repair + ORD endpoint)"
echo "  Super Agent:          http://localhost:3002  (My Spaceship commander)"
echo "  ORD Provider (Super): http://localhost:3004  (Super Agent ORD hosted via provider-server)"
echo ""
echo "Try:"
echo "  curl http://localhost:3001/.well-known/open-resource-discovery"
echo "  curl http://localhost:3001/ord/v1/documents/document"
echo "  curl http://localhost:3004/.well-known/open-resource-discovery"
echo "  Or open demo.http in VS Code (REST Client extension)"
