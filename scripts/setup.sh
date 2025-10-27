#!/bin/bash

###############################################################################
# FFmpeg Video API - Setup Script
# Initializes the project for first-time use
###############################################################################

set -e

echo "======================================"
echo "FFmpeg Video API - Setup"
echo "======================================"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed"
  echo "Please install Node.js 18+ from: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js version 18+ is required (current: $(node -v))"
  exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check FFmpeg
echo ""
echo "🔍 Checking FFmpeg..."
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "⚠️  FFmpeg is not installed"
  echo ""
  echo "Install FFmpeg:"
  echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
  echo "  macOS: brew install ffmpeg"
  echo "  Or run: sudo bash scripts/install-ffmpeg.sh"
  echo ""
  read -p "Continue without FFmpeg? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ FFmpeg version: $(ffmpeg -version | head -n1 | cut -d' ' -f3)"
fi

# Create .env file if not exists
echo ""
echo "📝 Setting up environment configuration..."
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env

  # Generate random API key
  API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

  # Update API_KEY in .env
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-secure-api-key-here-change-this-in-production/$API_KEY/" .env
  else
    # Linux
    sed -i "s/your-secure-api-key-here-change-this-in-production/$API_KEY/" .env
  fi

  echo "✅ .env file created with generated API key"
  echo "   API Key: $API_KEY"
  echo ""
  echo "⚠️  IMPORTANT: Update storage configuration in .env before starting!"
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p storage/temp
mkdir -p storage/uploads
mkdir -p logs
mkdir -p /tmp/ffmpeg-api 2>/dev/null || true
echo "✅ Directories created"

# Check Redis (optional)
echo ""
echo "🔍 Checking Redis..."
if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is running"
  else
    echo "⚠️  Redis is installed but not running"
    echo "   Start Redis: redis-server"
  fi
else
  echo "⚠️  Redis is not installed (optional)"
  echo "   The service will use in-memory job storage"
  echo "   Install Redis: sudo apt-get install redis-server"
fi

# Test configuration
echo ""
echo "🧪 Testing configuration..."
node -e "require('./src/config/config');" && echo "✅ Configuration valid" || echo "❌ Configuration error"

# Summary
echo ""
echo "======================================"
echo "✨ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure storage in .env:"
echo "   - For Cloudflare R2: Set R2_* variables"
echo "   - For AWS S3: Set S3_* variables"
echo "   - For local: Set LOCAL_STORAGE_PATH"
echo ""
echo "2. Start the service:"
echo "   Development: npm run dev"
echo "   Production:  npm start"
echo "   Docker:      docker-compose up -d"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:3000/health"
echo ""
echo "4. View documentation:"
echo "   cat README.md"
echo ""
echo "5. Try example requests:"
echo "   bash examples/api-requests/render-video.sh"
echo ""
echo "API Key: $(grep '^API_KEY=' .env | cut -d'=' -f2)"
echo ""
