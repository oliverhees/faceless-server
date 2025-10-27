# Deployment Guide

Production deployment guide for FFmpeg Video API.

## Docker Deployment (Recommended)

### Prerequisites

- Docker & Docker Compose installed
- Domain name (optional, for SSL)
- Cloud storage account (R2 or S3)

### Quick Deploy

```bash
# Clone repository
git clone https://github.com/yourusername/ffmpeg-video-api.git
cd ffmpeg-video-api

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Start services
docker-compose up -d

# View logs
docker-compose logs -f ffmpeg-api

# Check health
curl http://localhost:3000/health
```

### Environment Configuration

Minimum required settings:

```bash
# .env
API_KEY=$(openssl rand -base64 32)
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=videos
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
```

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f ffmpeg-api

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

---

## VPS Deployment (Ubuntu 22.04)

### 1. Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y curl git build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt-get install -y ffmpeg

# Install Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Docker (optional)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

### 2. Application Setup

```bash
# Create user
sudo useradd -m -s /bin/bash ffmpeg-api
sudo su - ffmpeg-api

# Clone repository
git clone https://github.com/yourusername/ffmpeg-video-api.git
cd ffmpeg-video-api

# Install dependencies
npm ci --only=production

# Configure
cp .env.example .env
nano .env

# Create directories
mkdir -p logs storage/temp storage/uploads
```

### 3. Systemd Service

Create `/etc/systemd/system/ffmpeg-api.service`:

```ini
[Unit]
Description=FFmpeg Video API
After=network.target redis.target

[Service]
Type=simple
User=ffmpeg-api
WorkingDirectory=/home/ffmpeg-api/ffmpeg-video-api
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ffmpeg-api

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ffmpeg-api
sudo systemctl start ffmpeg-api
sudo systemctl status ffmpeg-api

# View logs
sudo journalctl -u ffmpeg-api -f
```

### 4. Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/ffmpeg-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ffmpeg-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

Nginx config will be updated to:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... rest of config
}
```

---

## Hostinger VPS Deployment

Hostinger-specific deployment steps:

### 1. Connect to VPS

```bash
ssh root@your-vps-ip
```

### 2. Follow VPS Deployment Steps Above

All VPS deployment steps work on Hostinger.

### 3. Update DNS

In Hostinger control panel:
1. Go to Domains → Manage
2. Add A record:
   - Name: `api`
   - Points to: Your VPS IP
   - TTL: 14400

---

## Environment Variables Reference

### Production Settings

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
API_KEY=your-secure-random-key-min-32-chars

# Storage (Cloudflare R2)
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=videos
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_PUBLIC_URL=https://videos.yourdomain.com
STORAGE_MAKE_PUBLIC=true

# Redis
REDIS_URL=redis://localhost:6379

# FFmpeg
FFMPEG_THREADS=4
MAX_CONCURRENT_JOBS=3
TEMP_DIR=/tmp/ffmpeg-api
FFMPEG_TIMEOUT=600

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## Monitoring & Logging

### Health Check Monitoring

Use a monitoring service (UptimeRobot, Pingdom):

```bash
curl https://api.yourdomain.com/health
```

### Application Logs

**Docker:**
```bash
docker-compose logs -f ffmpeg-api
```

**Systemd:**
```bash
sudo journalctl -u ffmpeg-api -f
```

**Log Files:**
```bash
tail -f logs/app-2024-01-15.log
tail -f logs/error-2024-01-15.log
```

### System Monitoring

```bash
# CPU & Memory
htop

# Disk usage
df -h

# FFmpeg processes
ps aux | grep ffmpeg

# Network
netstat -tulpn | grep 3000
```

---

## Performance Optimization

### 1. Increase Concurrent Jobs

```bash
# .env
MAX_CONCURRENT_JOBS=5  # Increase based on CPU cores
```

### 2. Use More FFmpeg Threads

```bash
# .env
FFMPEG_THREADS=8  # Increase for faster rendering
```

### 3. Enable Redis Caching

```bash
# .env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

### 4. Optimize Nginx

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 2048;

gzip on;
gzip_types text/plain application/json;
```

### 5. Use CDN

Configure Cloudflare in front of your API for:
- DDoS protection
- Caching
- SSL
- Rate limiting

---

## Backup & Recovery

### Database Backup (Redis)

```bash
# Backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb ~/backup/

# Restore
sudo systemctl stop redis
sudo cp ~/backup/dump.rdb /var/lib/redis/
sudo systemctl start redis
```

### Configuration Backup

```bash
# Backup
tar -czf config-backup.tar.gz .env src/templates/

# Restore
tar -xzf config-backup.tar.gz
```

---

## Scaling

### Horizontal Scaling

Deploy multiple instances behind load balancer:

```nginx
upstream ffmpeg_api {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    location / {
        proxy_pass http://ffmpeg_api;
    }
}
```

### Vertical Scaling

Increase server resources:
- More CPU cores → Higher `MAX_CONCURRENT_JOBS`
- More RAM → Handle larger videos
- Faster disk → Faster temp file I/O

---

## Security Checklist

- [ ] Strong API key (32+ characters)
- [ ] HTTPS enabled (Let's Encrypt)
- [ ] Firewall configured (allow 80, 443, 22 only)
- [ ] API key in environment, not in code
- [ ] Rate limiting enabled
- [ ] CORS configured for specific domains
- [ ] Regular security updates (`apt-get update`)
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Non-root Docker user

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u ffmpeg-api -n 50

# Check ports
sudo netstat -tulpn | grep 3000

# Check FFmpeg
ffmpeg -version
```

### High CPU Usage

```bash
# Check active jobs
curl http://localhost:3000/status -H "X-API-Key: key"

# Reduce concurrent jobs
# Edit .env: MAX_CONCURRENT_JOBS=2
sudo systemctl restart ffmpeg-api
```

### Out of Disk Space

```bash
# Check usage
df -h

# Clean temp files
cd /tmp/ffmpeg-api
find . -type f -mtime +1 -delete

# Clean old logs
find logs/ -name "*.log" -mtime +14 -delete
```

### Redis Connection Failed

```bash
# Check Redis
sudo systemctl status redis

# Test connection
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

---

## Update Procedure

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Restart service
sudo systemctl restart ffmpeg-api

# Check health
curl http://localhost:3000/health
```

---

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check all docs in `/docs`
- Logs: Always include logs when reporting issues
