#!/bin/bash

###############################################################################
# FFmpeg Video API - Check Job Status
# This script checks the status of a rendering job
###############################################################################

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-your-api-key}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if job ID provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Job ID required${NC}"
  echo ""
  echo "Usage: $0 <job_id>"
  echo ""
  echo "Example:"
  echo "  $0 job_1234567890_abc123"
  exit 1
fi

JOB_ID=$1

echo "======================================"
echo "FFmpeg Video API - Check Status"
echo "======================================"
echo ""
echo "Job ID: $JOB_ID"
echo ""

# Check if jq is installed
HAS_JQ=false
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=true
fi

# Function to get status
get_status() {
  curl -s -X GET "$API_URL/status/$JOB_ID" \
    -H "X-API-Key: $API_KEY"
}

# Function to display status
display_status() {
  RESPONSE=$1

  if [ "$HAS_JQ" = true ]; then
    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    VIDEO_URL=$(echo "$RESPONSE" | jq -r '.video_url // "N/A"')
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "N/A"')
    CREATED=$(echo "$RESPONSE" | jq -r '.created_at // "N/A"')
    UPDATED=$(echo "$RESPONSE" | jq -r '.updated_at // "N/A"')

    echo "Status:"
    case $STATUS in
      "queued")
        echo -e "  ${BLUE}⏳ Queued${NC}"
        ;;
      "processing")
        echo -e "  ${YELLOW}⚙️  Processing${NC}"
        ;;
      "completed")
        echo -e "  ${GREEN}✅ Completed${NC}"
        ;;
      "failed")
        echo -e "  ${RED}❌ Failed${NC}"
        ;;
      *)
        echo "  $STATUS"
        ;;
    esac

    echo ""
    echo "Details:"
    echo "  Created: $(date -d @$((CREATED/1000)) 2>/dev/null || echo $CREATED)"
    echo "  Updated: $(date -d @$((UPDATED/1000)) 2>/dev/null || echo $UPDATED)"

    if [ "$STATUS" = "completed" ] && [ "$VIDEO_URL" != "N/A" ]; then
      echo ""
      echo -e "${GREEN}🎥 Video URL:${NC}"
      echo "  $VIDEO_URL"
    fi

    if [ "$STATUS" = "failed" ] && [ "$ERROR" != "N/A" ]; then
      echo ""
      echo -e "${RED}❌ Error:${NC}"
      echo "  $ERROR"
    fi

    echo ""
    echo "Full Response:"
    echo "$RESPONSE" | jq '.'
  else
    echo "Response:"
    echo "$RESPONSE"
  fi
}

# Get initial status
RESPONSE=$(get_status)
display_status "$RESPONSE"

# Ask if user wants to poll
if [ "$HAS_JQ" = true ]; then
  STATUS=$(echo "$RESPONSE" | jq -r '.status')

  if [ "$STATUS" = "queued" ] || [ "$STATUS" = "processing" ]; then
    echo ""
    echo -e "${YELLOW}Job is still $STATUS...${NC}"
    read -p "Poll for updates every 5 seconds? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo ""
      echo "Polling for updates (Ctrl+C to stop)..."
      echo ""

      while true; do
        sleep 5
        RESPONSE=$(get_status)
        STATUS=$(echo "$RESPONSE" | jq -r '.status')

        echo "$(date '+%H:%M:%S') - Status: $STATUS"

        if [ "$STATUS" = "completed" ]; then
          echo ""
          display_status "$RESPONSE"
          echo ""
          echo -e "${GREEN}✅ Rendering completed!${NC}"
          break
        elif [ "$STATUS" = "failed" ]; then
          echo ""
          display_status "$RESPONSE"
          echo ""
          echo -e "${RED}❌ Rendering failed!${NC}"
          break
        fi
      done
    fi
  fi
fi

echo ""
echo "======================================"
echo ""
