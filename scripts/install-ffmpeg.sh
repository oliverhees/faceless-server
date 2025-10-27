#!/bin/bash

###############################################################################
# FFmpeg Installation Script
# Installs FFmpeg on Ubuntu/Debian systems
###############################################################################

set -e

echo "======================================"
echo "FFmpeg Installation Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  This script requires root privileges."
  echo "Please run with: sudo bash $0"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VERSION=$VERSION_ID
else
  echo "❌ Cannot detect OS. Unsupported system."
  exit 1
fi

echo "📋 Detected OS: $OS $VERSION"
echo ""

# Install FFmpeg based on OS
case $OS in
  ubuntu|debian)
    echo "🔄 Updating package list..."
    apt-get update

    echo "📦 Installing FFmpeg..."
    apt-get install -y ffmpeg

    echo "📦 Installing additional codecs..."
    apt-get install -y \
      libavcodec-extra \
      libavformat-dev \
      libavutil-dev \
      libswscale-dev
    ;;

  centos|rhel|fedora)
    echo "🔄 Installing EPEL repository..."
    yum install -y epel-release

    echo "📦 Installing FFmpeg..."
    yum install -y ffmpeg ffmpeg-devel
    ;;

  alpine)
    echo "📦 Installing FFmpeg on Alpine..."
    apk add --no-cache ffmpeg
    ;;

  *)
    echo "❌ Unsupported OS: $OS"
    echo "Please install FFmpeg manually:"
    echo "  https://ffmpeg.org/download.html"
    exit 1
    ;;
esac

# Verify installation
echo ""
echo "✅ Verifying FFmpeg installation..."
if command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG_VERSION=$(ffmpeg -version | head -n1)
  echo "✅ FFmpeg installed successfully!"
  echo "   $FFMPEG_VERSION"
else
  echo "❌ FFmpeg installation failed"
  exit 1
fi

echo ""
echo "======================================"
echo "✨ Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Run: bash scripts/setup.sh"
echo "  2. Configure .env file"
echo "  3. Start the service: npm start"
echo ""
