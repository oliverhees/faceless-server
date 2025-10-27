#!/bin/bash

###############################################################################
# FFmpeg Video API - Render Video Example
# This script demonstrates how to render a video using the API
###############################################################################

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-your-api-key}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "======================================"
echo "FFmpeg Video API - Render Video"
echo "======================================"
echo ""

# Check if jq is installed (for JSON parsing)
if ! command -v jq >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  jq is not installed. Install it for better output formatting.${NC}"
  echo "   Ubuntu/Debian: sudo apt-get install jq"
  echo "   macOS: brew install jq"
  echo ""
fi

# Example 1: TikTok Animal Facts
echo -e "${GREEN}📹 Example 1: TikTok Animal Facts${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/render" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "template": "tiktok_animal_facts",
    "variables": {
      "animal": "Shark",
      "fact": "Sharks can see in the dark! 🦈",
      "video1": "https://storage.example.com/videos/shark1.mp4",
      "video2": "https://storage.example.com/videos/shark2.mp4",
      "voiceover": "https://storage.example.com/audio/shark_voice.mp3",
      "background_music": "https://storage.example.com/music/upbeat.mp3"
    },
    "async": true
  }')

echo "Response:"
if command -v jq >/dev/null 2>&1; then
  echo "$RESPONSE" | jq '.'
else
  echo "$RESPONSE"
fi

# Extract job ID
if command -v jq >/dev/null 2>&1; then
  JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id')
  STATUS_URL=$(echo "$RESPONSE" | jq -r '.status_url')

  if [ "$JOB_ID" != "null" ]; then
    echo ""
    echo -e "${GREEN}✅ Video rendering started!${NC}"
    echo "   Job ID: $JOB_ID"
    echo "   Status URL: $API_URL$STATUS_URL"
    echo ""
    echo "Check status with:"
    echo "   bash examples/api-requests/check-status.sh $JOB_ID"
  else
    echo -e "${RED}❌ Request failed${NC}"
  fi
fi

echo ""
echo "======================================"
echo ""

# Example 2: LoFi YouTube Stream
echo -e "${GREEN}📹 Example 2: LoFi YouTube Stream${NC}"
echo ""

RESPONSE2=$(curl -s -X POST "$API_URL/render" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "template": "lofi_youtube_stream",
    "variables": {
      "background_video": "https://storage.example.com/videos/lofi_bg.mp4",
      "album_art": "https://storage.example.com/images/album_art.png",
      "music_track": "https://storage.example.com/music/lofi_track.mp3",
      "track_title": "Chill Vibes",
      "artist_name": "LoFi Producer"
    },
    "async": true
  }')

echo "Response:"
if command -v jq >/dev/null 2>&1; then
  echo "$RESPONSE2" | jq '.'
else
  echo "$RESPONSE2"
fi

echo ""
echo "======================================"
echo ""

# Example 3: Product Ad
echo -e "${GREEN}📹 Example 3: Product Advertisement${NC}"
echo ""

RESPONSE3=$(curl -s -X POST "$API_URL/render" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "template": "product_ad_15s",
    "variables": {
      "product_video": "https://storage.example.com/videos/product_showcase.mp4",
      "product_name": "Amazing Product",
      "price": "$99.99",
      "cta_text": "Buy Now!",
      "background_music": "https://storage.example.com/music/energetic.mp3"
    },
    "async": true
  }')

echo "Response:"
if command -v jq >/dev/null 2>&1; then
  echo "$RESPONSE3" | jq '.'
else
  echo "$RESPONSE3"
fi

echo ""
echo "======================================"
echo "✨ Done! Check job status to get video URLs"
echo "======================================"
echo ""
