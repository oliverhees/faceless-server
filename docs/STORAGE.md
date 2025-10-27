# Storage Configuration

Guide to configuring video storage backends.

## Supported Storage Types

1. **Cloudflare R2** (Recommended)
2. **AWS S3**
3. **Local Filesystem**

---

## Cloudflare R2 (Recommended)

### Why R2?

- **No Egress Fees** - Free data transfer
- **S3 Compatible** - Same API as AWS S3
- **Global Performance** - Fast worldwide
- **Low Cost** - $0.015/GB storage

### Setup

#### 1. Create R2 Bucket

1. Log in to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Click "Create Bucket"
4. Name your bucket (e.g., `videos`)
5. Click "Create Bucket"

#### 2. Generate API Tokens

1. Go to R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Set permissions: **Object Read & Write**
4. Click "Create API Token"
5. Copy **Access Key ID** and **Secret Access Key**

#### 3. Configure Public Access (Optional)

1. Go to your bucket settings
2. Click "Settings" → "Public Access"
3. Enable "Allow Public Access"
4. Set custom domain or use R2.dev URL

#### 4. Configure .env

```bash
STORAGE_TYPE=r2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_BUCKET=videos
R2_ACCESS_KEY_ID=abc123...
R2_SECRET_ACCESS_KEY=xyz789...
R2_PUBLIC_URL=https://videos.yourdomain.com
STORAGE_MAKE_PUBLIC=true
```

**Find Account ID:**
- Cloudflare Dashboard → R2 → Overview
- Account ID shown in sidebar

---

## AWS S3

### Setup

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://my-video-bucket --region eu-central-1
```

Or via AWS Console:
1. Go to S3 → Create Bucket
2. Name: `my-video-bucket`
3. Region: Choose nearest
4. Block Public Access: Disable (if making public)
5. Create

#### 2. Configure Bucket Policy (for public access)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-video-bucket/*"
    }
  ]
}
```

#### 3. Create IAM User

1. Go to IAM → Users → Add User
2. Name: `ffmpeg-api`
3. Permissions: `AmazonS3FullAccess`
4. Create Access Key
5. Copy Access Key ID and Secret

#### 4. Configure .env

```bash
STORAGE_TYPE=s3
S3_BUCKET=my-video-bucket
S3_REGION=eu-central-1
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_MAKE_PUBLIC=true
```

---

## Local Filesystem

### Use Cases

- Development
- Self-hosted with local storage
- No cloud dependencies

### Setup

#### 1. Create Storage Directory

```bash
mkdir -p /var/www/videos
chmod 755 /var/www/videos
```

#### 2. Configure .env

```bash
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/var/www/videos
LOCAL_STORAGE_BASE_URL=https://yourdomain.com/videos
STORAGE_MAKE_PUBLIC=true
```

#### 3. Configure Nginx (for serving files)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /videos/ {
        alias /var/www/videos/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Configuration Reference

### Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `STORAGE_TYPE` | string | Storage type: `r2`, `s3`, or `local` |
| `STORAGE_MAKE_PUBLIC` | boolean | Make uploaded files public |

**Cloudflare R2:**
| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_BUCKET` | Yes | Bucket name |
| `R2_ACCESS_KEY_ID` | Yes | API access key |
| `R2_SECRET_ACCESS_KEY` | Yes | API secret key |
| `R2_PUBLIC_URL` | No | Custom public URL |

**AWS S3:**
| Variable | Required | Description |
|----------|----------|-------------|
| `S3_BUCKET` | Yes | Bucket name |
| `S3_REGION` | Yes | AWS region |
| `S3_ACCESS_KEY_ID` | Yes | IAM access key |
| `S3_SECRET_ACCESS_KEY` | Yes | IAM secret key |

**Local:**
| Variable | Required | Description |
|----------|----------|-------------|
| `LOCAL_STORAGE_PATH` | Yes | Local directory path |
| `LOCAL_STORAGE_BASE_URL` | Yes | Base URL for files |

---

## Testing Storage

### Health Check

```bash
curl http://localhost:3000/health \
  -H "X-API-Key: your-key"
```

Check `services.storage.status`:
```json
{
  "services": {
    "storage": {
      "status": "ok",
      "type": "r2",
      "bucket": "videos"
    }
  }
}
```

### Manual Upload Test

**R2/S3:**
```bash
# Using AWS CLI (works for R2 too)
aws s3 cp test.mp4 s3://your-bucket/test.mp4 \
  --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com
```

**Local:**
```bash
# Copy file
cp test.mp4 /var/www/videos/test.mp4

# Test access
curl https://yourdomain.com/videos/test.mp4
```

---

## Cost Comparison

### Cloudflare R2
- Storage: $0.015/GB/month
- Egress: **FREE**
- Requests: $0.36 per million (Class A), $0.09 per million (Class B)

**Example:** 100GB storage, 10TB egress
- R2: $1.50/month
- S3: ~$900/month (with egress)

### AWS S3
- Storage: $0.023/GB/month (Standard)
- Egress: $0.09/GB (first 10TB)
- Requests: $0.005 per 1000 PUT, $0.0004 per 1000 GET

**Example:** 100GB storage, 10TB egress
- S3: $900+/month

### Local Storage
- Storage: Your server disk cost
- Egress: Your bandwidth cost
- Requests: Free (self-hosted)

**Recommendation:** Use R2 for production, local for development.

---

## Security Best Practices

1. **Use IAM Policies** - Restrict access to specific buckets
2. **Enable HTTPS** - Always use HTTPS for uploads/downloads
3. **Rotate Keys** - Rotate API keys regularly
4. **Private by Default** - Only make public what's needed
5. **Set Expiration** - Use lifecycle policies to delete old files

---

## Troubleshooting

**Storage Health Check Fails:**
```json
{
  "storage": {
    "status": "error",
    "error": "Access Denied"
  }
}
```
Solution: Check credentials and bucket permissions

**Upload Succeeds but URL Invalid:**
- R2: Ensure `R2_PUBLIC_URL` is correct
- S3: Check bucket policy allows public read
- Local: Verify Nginx configuration

**Slow Uploads:**
- Check network connection
- Use region closest to your server
- Consider increasing timeout: `DOWNLOAD_TIMEOUT=120`
