# Traefik Integration Setup

This guide explains how to integrate FFmpeg Video API with an existing Traefik reverse proxy.

## Prerequisites

- Traefik already running (detected as `ai-toolkit_v2-traefik-1`)
- Docker and Docker Compose installed
- VPS with public IP address

## Quick Setup (Path-based routing)

The default configuration routes the API via path prefix: `http://YOUR-IP/ffmpeg-api/`

### Step 1: Update .env

```bash
cp .env.example .env
nano .env
```

Set:
```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/storage/uploads
LOCAL_STORAGE_BASE_URL=http://YOUR-VPS-IP/ffmpeg-api/files
API_KEY=your-secure-api-key  # Generate: openssl rand -base64 32
```

### Step 2: Deploy

```bash
docker compose up -d
```

### Step 3: Test

```bash
# From server
curl http://localhost:3000/health

# Via Traefik (from anywhere)
curl http://YOUR-VPS-IP/ffmpeg-api/health
```

**Access URLs:**
- API: `http://YOUR-VPS-IP/ffmpeg-api/`
- Health: `http://YOUR-VPS-IP/ffmpeg-api/health`
- Templates: `http://YOUR-VPS-IP/ffmpeg-api/templates`
- Files: `http://YOUR-VPS-IP/ffmpeg-api/files/job_xxx/video.mp4`

---

## Domain Setup (Recommended for Production)

### Step 1: Configure DNS

Add A record:
- **Type:** A
- **Name:** api (or subdomain of your choice)
- **Points to:** Your VPS IP
- **TTL:** 14400

### Step 2: Update docker-compose.yml

Edit `docker-compose.yml` and uncomment the domain configuration:

```yaml
labels:
  - "traefik.enable=true"
  # Uncomment these lines:
  - "traefik.http.routers.ffmpeg-api.rule=Host(`api.yourdomain.com`)"
  - "traefik.http.routers.ffmpeg-api.entrypoints=websecure"
  - "traefik.http.routers.ffmpeg-api.tls.certresolver=myresolver"
  # Comment out the PathPrefix lines:
  # - "traefik.http.routers.ffmpeg-api.rule=PathPrefix(`/ffmpeg-api`)"
  # - "traefik.http.routers.ffmpeg-api.entrypoints=web"
  # - "traefik.http.middlewares.ffmpeg-api-strip.stripprefix.prefixes=/ffmpeg-api"
  # - "traefik.http.routers.ffmpeg-api.middlewares=ffmpeg-api-strip"
```

### Step 3: Update .env

```bash
LOCAL_STORAGE_BASE_URL=https://api.yourdomain.com/files
```

### Step 4: Restart

```bash
docker compose down
docker compose up -d
```

### Step 5: Test

```bash
curl https://api.yourdomain.com/health
```

**Access URLs:**
- API: `https://api.yourdomain.com/`
- Health: `https://api.yourdomain.com/health`
- Files: `https://api.yourdomain.com/files/job_xxx/video.mp4`

---

## Automatic File Cleanup (12 hours)

Set up cron job to delete old files:

```bash
# Create cleanup script
cat > /opt/cleanup-ffmpeg.sh << 'EOF'
#!/bin/bash
find /opt/ffmpeg-video-api/faceless-server/storage/uploads -type f -mmin +720 -delete
find /opt/ffmpeg-video-api/faceless-server/storage/uploads -type d -empty -delete
EOF

chmod +x /opt/cleanup-ffmpeg.sh

# Add to crontab
crontab -e
```

Add:
```cron
0 * * * * /opt/cleanup-ffmpeg.sh >> /var/log/ffmpeg-cleanup.log 2>&1
```

---

## Troubleshooting

### API not accessible via Traefik

Check if container is in Traefik network:
```bash
docker network ls
docker network inspect ai-toolkit_v2_default | grep ffmpeg
```

### SSL not working

Check Traefik cert resolver:
```bash
docker logs ai-toolkit_v2-traefik-1 | grep cert
```

Make sure your Traefik has a cert resolver named `myresolver` or update the label.

### Files not downloading

Check storage volume permissions:
```bash
ls -la /opt/ffmpeg-video-api/faceless-server/storage/uploads/
```

---

## Port 3000 Access (Alternative)

If you don't want to use Traefik, you can access the API directly on port 3000:

```yaml
# In docker-compose.yml, keep the ports section:
ports:
  - "3000:3000"
```

Then:
```bash
LOCAL_STORAGE_BASE_URL=http://YOUR-VPS-IP:3000/files
```

Access: `http://YOUR-VPS-IP:3000/`

---

## Next Steps

1. ✅ API is running
2. Configure n8n workflows
3. Test video rendering with real assets
4. Set up monitoring (UptimeRobot, Grafana, etc.)
5. Configure firewall rules

For full documentation, see `/docs/` directory.
