# FFmpeg Video API

> Automated video rendering service for TikTok, YouTube, and social media content creation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

## Overview

FFmpeg Video API is a production-ready REST API service that renders videos from JSON templates using FFmpeg. Perfect for automating social media content creation with n8n workflows.

### Key Features

- **Template-Based Rendering** - Define video structure once, render infinite variations
- **Multiple Storage Backends** - Cloudflare R2, AWS S3, or local filesystem
- **Async Job Processing** - Queue management with status tracking
- **n8n Integration Ready** - Pre-built workflows for automation
- **Docker Deployment** - One-command deployment with docker-compose
- **3 Built-in Templates** - TikTok, YouTube LoFi, Instagram Product Ads

## Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg
- Redis (optional, uses in-memory fallback)
- Docker & Docker Compose (for containerized deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ffmpeg-video-api.git
cd ffmpeg-video-api

# Run setup script
bash scripts/setup.sh

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
npm install

# Start service
npm start
```

### Docker Deployment (Recommended)

```bash
# Configure environment
cp .env.example .env
# Edit .env with your API key and storage credentials

# Start services
docker-compose up -d

# View logs
docker-compose logs -f ffmpeg-api
```

## Usage

### Basic Example

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "template": "tiktok_animal_facts",
    "variables": {
      "animal": "Shark",
      "fact": "Sharks can see in the dark!",
      "video1": "https://storage.example.com/shark1.mp4",
      "video2": "https://storage.example.com/shark2.mp4",
      "voiceover": "https://storage.example.com/voice.mp3",
      "background_music": "https://storage.example.com/music.mp3"
    }
  }'
```

### Response

```json
{
  "success": true,
  "job_id": "job_1234567890_abc123",
  "status": "processing",
  "status_url": "/status/job_1234567890_abc123"
}
```

### Check Status

```bash
curl http://localhost:3000/status/job_1234567890_abc123 \
  -H "X-API-Key: your-api-key"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/render` | Render video from template |
| GET | `/status/:job_id` | Get job status |
| GET | `/templates` | List available templates |
| GET | `/templates/:name` | Get template info |
| GET | `/health` | Health check |

Full API documentation: [docs/API.md](docs/API.md)

## Built-in Templates

### 1. TikTok Animal Facts (`tiktok_animal_facts`)
- **Format:** Vertical (1080x1920)
- **Duration:** ~10 seconds
- **Use Case:** Educational TikTok content

### 2. LoFi YouTube Stream (`lofi_youtube_stream`)
- **Format:** Horizontal (1920x1080)
- **Duration:** 3+ minutes
- **Use Case:** YouTube music streams

### 3. Product Advertisement (`product_ad_15s`)
- **Format:** Square (1080x1080)
- **Duration:** 15 seconds
- **Use Case:** Instagram product ads

See [src/templates/README.md](src/templates/README.md) for details.

## Storage Configuration

### Cloudflare R2 (Recommended)

```bash
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=videos
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_PUBLIC_URL=https://videos.yourdomain.com
```

### AWS S3

```bash
STORAGE_TYPE=s3
S3_BUCKET=my-videos
S3_REGION=eu-central-1
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=your-secret
```

### Local Storage (Development)

```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/storage/uploads
LOCAL_STORAGE_BASE_URL=http://localhost:3000/files
```

Full storage documentation: [docs/STORAGE.md](docs/STORAGE.md)

## n8n Integration

Import pre-built workflows from `examples/n8n-workflows/`:

- **TikTok Complete Pipeline** - VEO + ElevenLabs + FFmpeg API
- Full automation from script to published video

See [examples/n8n-workflows/README.md](examples/n8n-workflows/README.md) for setup instructions.

## Architecture

```
┌─────────────┐
│  Client     │ (n8n, API calls)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│   Express API Server            │
│   - Authentication              │
│   - Request Validation          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Video Processor Service       │
│   - Template Engine             │
│   - Asset Downloader            │
│   - FFmpeg Command Builder      │
└──────┬──────────────────────────┘
       │
       ├──────────┬─────────┬──────────┐
       ▼          ▼         ▼          ▼
   ┌────────┐ ┌─────┐  ┌──────┐  ┌──────┐
   │FFmpeg  │ │Redis│  │Storage│ │ Logs │
   └────────┘ └─────┘  └──────┘  └──────┘
```

## Configuration

All configuration via environment variables. See `.env.example` for all options.

### Key Settings

```bash
# Server
PORT=3000
API_KEY=your-secure-api-key

# Storage
STORAGE_TYPE=r2

# FFmpeg
FFMPEG_THREADS=4
MAX_CONCURRENT_JOBS=3

# Redis
REDIS_URL=redis://localhost:6379
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Build Docker image
docker build -t ffmpeg-video-api .
```

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- VPS deployment (Ubuntu/Debian)
- Nginx reverse proxy configuration
- SSL setup with Let's Encrypt
- Monitoring and logging
- Performance optimization

## Examples

### Render Video Script

```bash
bash examples/api-requests/render-video.sh
```

### Check Status Script

```bash
bash examples/api-requests/check-status.sh job_1234567890_abc123
```

### n8n Workflow

Import `examples/n8n-workflows/tiktok-complete-pipeline.json` into n8n.

## Troubleshooting

### FFmpeg Not Found

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Or use install script
sudo bash scripts/install-ffmpeg.sh
```

### Redis Connection Failed

Service falls back to in-memory storage. Install Redis:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

### Storage Upload Failed

Check credentials and bucket permissions:

```bash
# Test health endpoint
curl http://localhost:3000/health -H "X-API-Key: your-key"
```

## Performance

- **Concurrent Jobs:** Configurable via `MAX_CONCURRENT_JOBS` (default: 3)
- **CPU Usage:** FFmpeg uses `FFMPEG_THREADS` cores per job (default: 4)
- **Memory:** ~1-2GB RAM per active rendering job
- **Disk:** Temp files cleaned automatically after each job

## Security

- ✅ API Key authentication on all endpoints
- ✅ Input validation and sanitization
- ✅ Non-root Docker container
- ✅ Configurable CORS
- ✅ Request timeout protection

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

- [API Documentation](docs/API.md)
- [Template Guide](docs/TEMPLATES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Storage Configuration](docs/STORAGE.md)

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ffmpeg-video-api/issues)
- **Documentation:** [docs/](docs/)
- **Examples:** [examples/](examples/)

## Roadmap

- [ ] Hardware acceleration (GPU encoding)
- [ ] Webhook callbacks on completion
- [ ] Advanced transition library
- [ ] Web UI for template management
- [ ] Batch rendering API
- [ ] Video effects (color grading, filters)

## Credits

Built with:
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [Express.js](https://expressjs.com/) - Web framework
- [Redis](https://redis.io/) - Job queue
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - S3/R2 storage

---

Made with ❤️ for automated content creators
