# n8n Workflow Examples

This directory contains ready-to-import n8n workflows that demonstrate integration with the FFmpeg Video API.

## Workflows

### 1. TikTok Complete Pipeline (`tiktok-complete-pipeline.json`)

**Description:** Complete automated TikTok video creation pipeline

**Flow:**
1. Webhook Trigger - Receives request
2. Generate Script - Creates animal fact script
3. VEO Video Generation - Generates 2 video clips (parallel)
4. ElevenLabs Voiceover - Generates voiceover audio
5. FFmpeg API Render - Combines everything into final video
6. Wait for Render - Waits 30 seconds
7. Check Status - Gets final video URL
8. Respond to Webhook - Returns result

**Required Credentials:**
- Google VEO API
- ElevenLabs API
- FFmpeg Video API (HTTP Header Auth with X-API-Key)

**Configuration:**
1. Import workflow into n8n
2. Configure API credentials
3. Update FFmpeg API URL (replace `http://your-ffmpeg-api:3000`)
4. Test with webhook

**Webhook URL:**
```
http://your-n8n-instance:5678/webhook/tiktok-webhook
```

**Test Request:**
```bash
curl -X POST http://your-n8n-instance:5678/webhook/tiktok-webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## How to Import Workflows

### In n8n:

1. Go to **Workflows** in n8n
2. Click **Add Workflow** → **Import from File**
3. Select the `.json` file
4. Click **Import**

### Via CLI:

```bash
# Copy workflow to n8n workflows directory
cp tiktok-complete-pipeline.json ~/.n8n/workflows/

# Restart n8n
systemctl restart n8n
```

---

## Setting Up Credentials

### FFmpeg Video API Authentication

1. In n8n, go to **Credentials** → **New**
2. Select **Header Auth**
3. Add header:
   - **Name:** `X-API-Key`
   - **Value:** Your API key from `.env` file
4. Save as "FFmpeg Video API"

### Google VEO API

1. Create credentials in Google Cloud Console
2. Add to n8n as "Google VEO API"

### ElevenLabs API

1. Get API key from ElevenLabs dashboard
2. Add to n8n as "ElevenLabs API"

---

## Customization

### Change Template

Replace the template name in FFmpeg Render node:

```json
{
  "template": "your_custom_template",
  "variables": { ... }
}
```

### Add More Steps

Common additions:
- **Upload to TikTok:** Add TikTok API node after render
- **Store in Database:** Add database node to track videos
- **Send Notification:** Add Slack/Discord notification
- **Analytics:** Track rendering statistics

### Error Handling

Add error workflow:
1. Click on any node → **On Error** → **Continue**
2. Add error notification node
3. Log errors to database

---

## Advanced Examples

### Batch Processing

Process multiple videos in parallel:

```json
{
  "name": "Batch TikTok Videos",
  "nodes": [
    { "type": "spreadsheet", "name": "Load Topics" },
    { "type": "splitInBatches", "name": "Batch 5" },
    { "type": "httpRequest", "name": "Render Each" }
  ]
}
```

### Scheduled Generation

Create videos on schedule:

```json
{
  "nodes": [
    { "type": "cron", "name": "Daily at 9 AM" },
    { "type": "code", "name": "Generate Topic" },
    { "type": "httpRequest", "name": "Render Video" }
  ]
}
```

---

## Troubleshooting

### Common Issues

**1. API Key Error**
```
Error: Unauthorized - X-API-Key header is required
```
Solution: Check FFmpeg API credentials in n8n

**2. Timeout Issues**
```
Error: Request timeout
```
Solution: Increase timeout in HTTP Request node settings (Options → Timeout: 120000)

**3. Video URLs Invalid**
```
Error: Failed to download file
```
Solution: Ensure VEO/ElevenLabs return public URLs, not temporary ones

### Debug Mode

Enable debug logging in n8n:
```bash
export N8N_LOG_LEVEL=debug
n8n start
```

---

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [FFmpeg API Docs](../docs/API.md)
- [Workflow Templates](https://n8n.io/workflows/)

---

## Support

For issues with:
- **Workflows:** Check n8n logs
- **FFmpeg API:** Check API logs in `logs/app-*.log`
- **Integrations:** Verify API credentials and quotas
