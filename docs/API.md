# API Documentation

Complete API reference for FFmpeg Video API.

## Base URL

```
http://your-server:3000
```

## Authentication

All endpoints (except `/health`) require API key authentication via HTTP header:

```
X-API-Key: your-api-key
```

**Example:**
```bash
curl -H "X-API-Key: abc123..." http://localhost:3000/templates
```

---

## Endpoints

### POST /render

Render a video from template and variables.

**Request Body:**
```json
{
  "template": "tiktok_animal_facts",
  "variables": {
    "animal": "Shark",
    "fact": "Amazing fact!",
    "video1": "https://...",
    "video2": "https://...",
    "voiceover": "https://...",
    "background_music": "https://..."
  },
  "async": true,
  "custom_config": {}
}
```

**Parameters:**
- `template` (string, required) - Template name
- `variables` (object, required) - Template variables
- `async` (boolean, optional) - Async processing (default: true)
- `custom_config` (object, optional) - Override template settings

**Response (202 Accepted):**
```json
{
  "success": true,
  "job_id": "job_1234567890_abc123",
  "status": "processing",
  "status_url": "/status/job_1234567890_abc123",
  "message": "Video rendering started"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request",
  "details": ["Missing required variable: video1"]
}
```

---

### GET /status/:job_id

Get rendering job status.

**Response (200 OK):**
```json
{
  "success": true,
  "job_id": "job_1234567890_abc123",
  "status": "completed",
  "video_url": "https://storage.example.com/videos/output.mp4",
  "created_at": 1234567890000,
  "updated_at": 1234567900000,
  "duration": 10,
  "template": "tiktok_animal_facts"
}
```

**Status Values:**
- `queued` - Waiting to start
- `processing` - Currently rendering
- `completed` - Finished successfully
- `failed` - Rendering failed

**Response (404):**
```json
{
  "success": false,
  "error": "Job not found",
  "job_id": "invalid_id"
}
```

---

### GET /status

Get overall statistics.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total": 150,
    "queued": 2,
    "processing": 3,
    "completed": 140,
    "failed": 5,
    "active": 3
  }
}
```

---

### GET /templates

List all available templates.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "templates": [
    "tiktok_animal_facts",
    "lofi_youtube_stream",
    "product_ad_15s"
  ]
}
```

---

### GET /templates/:name

Get template information.

**Response:**
```json
{
  "success": true,
  "template": {
    "template_name": "tiktok_animal_facts",
    "category": "tiktok",
    "variables": ["animal", "fact", "video1", "video2", "voiceover", "background_music"],
    "output": {
      "resolution": "1080x1920",
      "fps": 30,
      "format": "mp4"
    }
  }
}
```

---

### GET /health

Health check endpoint (no authentication required).

**Response (200 OK):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy",
  "services": {
    "ffmpeg": {
      "status": "ok"
    },
    "storage": {
      "status": "ok",
      "type": "r2",
      "bucket": "videos"
    },
    "job_manager": {
      "status": "ok",
      "type": "redis"
    },
    "video_processor": {
      "status": "ok",
      "active_jobs": 2,
      "total_jobs": 150
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "degraded",
  "services": {
    "ffmpeg": {
      "status": "unavailable"
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 202 | Accepted (async processing) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing API key) |
| 403 | Forbidden (invalid API key) |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

Default limits:
- 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`

---

## Examples

### cURL Examples

**Render Video:**
```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d @request.json
```

**Check Status:**
```bash
curl http://localhost:3000/status/job_123 \
  -H "X-API-Key: your-key"
```

**List Templates:**
```bash
curl http://localhost:3000/templates \
  -H "X-API-Key: your-key"
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const API_KEY = 'your-api-key';

// Render video
const response = await axios.post(`${API_URL}/render`, {
  template: 'tiktok_animal_facts',
  variables: { /* ... */ }
}, {
  headers: { 'X-API-Key': API_KEY }
});

const jobId = response.data.job_id;

// Check status
const status = await axios.get(`${API_URL}/status/${jobId}`, {
  headers: { 'X-API-Key': API_KEY }
});

console.log(status.data);
```

### Python

```python
import requests

API_URL = 'http://localhost:3000'
API_KEY = 'your-api-key'

headers = {'X-API-Key': API_KEY}

# Render video
response = requests.post(f'{API_URL}/render', json={
    'template': 'tiktok_animal_facts',
    'variables': { }
}, headers=headers)

job_id = response.json()['job_id']

# Check status
status = requests.get(f'{API_URL}/status/{job_id}', headers=headers)
print(status.json())
```

---

## Webhooks (Optional)

Configure webhook URL in render request to receive completion notification:

```json
{
  "template": "...",
  "variables": {},
  "webhook_url": "https://your-server.com/webhook"
}
```

Webhook payload (POST):
```json
{
  "job_id": "job_123",
  "status": "completed",
  "video_url": "https://...",
  "template": "tiktok_animal_facts"
}
```
