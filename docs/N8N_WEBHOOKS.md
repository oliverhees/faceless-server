# n8n Webhook Integration - JSON Schemas

This document defines the JSON request/response formats for the n8n webhooks that integrate with NocoDB.

## Overview

The FFmpeg Video API integrates with your existing NocoDB database via n8n webhooks for:
1. Credit checking before render
2. Template metadata storage
3. Credit deduction after successful render

---

## 1. Check Credits Webhook

**Purpose:** Check if user has enough credits before rendering

**Endpoint:** Configure in `.env` as `N8N_WEBHOOK_CHECK_CREDITS`

### Request (from FFmpeg API to n8n):

```json
{
  "api_key": "user-api-key-here"
}
```

### Response (from n8n back to FFmpeg API):

**Success - User has credits:**
```json
{
  "success": true,
  "user_id": 123,
  "credits": 150,
  "user_name": "John Doe"
}
```

**Error - User not found or no credits:**
```json
{
  "success": false,
  "error": "User not found"
}
```
OR
```json
{
  "success": false,
  "error": "Insufficient credits",
  "credits": 0
}
```

### n8n Workflow Logic:

```
1. Receive webhook with api_key
2. Query NocoDB: SELECT id, name, credits FROM users WHERE api_key = {{api_key}}
3. IF user found AND credits > 0:
     Return success with user data
   ELSE:
     Return error
```

---

## 2. Save Template Metadata Webhook

**Purpose:** Save template metadata to NocoDB after user creates a template

**Endpoint:** Configure in `.env` as `N8N_WEBHOOK_SAVE_TEMPLATE`

### Request (from FFmpeg API to n8n):

```json
{
  "template_id": "tmpl_1730035200_a1b2c3",
  "user_id": 123,
  "name": "My TikTok Animal Facts",
  "description": "Template for creating animal fact videos",
  "category": "tiktok"
}
```

### Response (from n8n back to FFmpeg API):

**Success:**
```json
{
  "success": true,
  "template_id": "tmpl_1730035200_a1b2c3"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Failed to save template metadata"
}
```

### n8n Workflow Logic:

```
1. Receive webhook with template data
2. INSERT INTO templates (NocoDB):
   - id: {{template_id}}
   - user_id: {{user_id}}
   - name: {{name}}
   - description: {{description}}
   - category: {{category}}
   - renders_count: 0
   - is_public: true
   - created: NOW()
   - updated: NOW()
3. Return success/error
```

---

## 3. Deduct Credits Webhook

**Purpose:** Deduct credits after successful video render and track the render

**Endpoint:** Configure in `.env` as `N8N_WEBHOOK_DEDUCT_CREDITS`

### Request (from FFmpeg API to n8n):

```json
{
  "user_id": 123,
  "template_id": "tmpl_1730035200_a1b2c3",
  "job_id": "job_1730035400_x7y8z9",
  "credits_to_deduct": 10,
  "video_url": "http://srv964214.hstgr.cloud:3000/files/job_123/video.mp4",
  "duration": 10.5
}
```

### Response (from n8n back to FFmpeg API):

**Success:**
```json
{
  "success": true,
  "remaining_credits": 140,
  "total_renders": 5
}
```

**Error:**
```json
{
  "success": false,
  "error": "Failed to deduct credits"
}
```

### n8n Workflow Logic:

```
1. Receive webhook with render data
2. UPDATE users in NocoDB:
   SET credits = credits - {{credits_to_deduct}}
   WHERE id = {{user_id}}
3. UPDATE templates in NocoDB:
   SET renders_count = renders_count + 1, updated = NOW()
   WHERE id = {{template_id}}
4. INSERT INTO renders (NocoDB):
   - user_id: {{user_id}}
   - template_id: {{template_id}}
   - credits_used: {{credits_to_deduct}}
   - status: "completed"
   - video_url: {{video_url}}
   - created: NOW()
5. Query remaining credits
6. Return success with remaining credits
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# n8n Webhook URLs
N8N_WEBHOOK_CHECK_CREDITS=https://your-n8n-instance.com/webhook/check-credits
N8N_WEBHOOK_SAVE_TEMPLATE=https://your-n8n-instance.com/webhook/save-template
N8N_WEBHOOK_DEDUCT_CREDITS=https://your-n8n-instance.com/webhook/deduct-credits

# n8n Webhook Secret (optional, for security)
N8N_WEBHOOK_SECRET=your-secret-token

# Credit Configuration
CREDITS_PER_RENDER=10
```

---

## NocoDB Table Structure

### Table: `users`
```
- id (Number, Auto-increment)
- name (SingleLineText)
- email (Email)
- api_key (SingleLineText, Unique)
- credits (Number, Default: 0)
- created (DateTime)
- updated (DateTime)
```

### Table: `templates`
```
- id (SingleLineText, Primary Key, e.g. "tmpl_1730035200_a1b2c3")
- user_id (LinkToAnotherRecord → users)
- name (SingleLineText)
- description (LongText)
- category (SingleSelect: tiktok, youtube, instagram, custom)
- renders_count (Number, Default: 0)
- is_public (Checkbox, Default: true)
- created (DateTime)
- updated (DateTime)
```

### Table: `renders`
```
- id (Number, Auto-increment)
- user_id (LinkToAnotherRecord → users)
- template_id (SingleLineText)
- credits_used (Number)
- status (SingleSelect: completed, failed)
- video_url (URL)
- created (DateTime)
```

---

## Testing Webhooks

### Test Credit Check:
```bash
curl -X POST https://your-n8n.com/webhook/check-credits \
  -H "Content-Type: application/json" \
  -d '{"api_key": "test-api-key-123"}'
```

Expected response:
```json
{
  "success": true,
  "user_id": 1,
  "credits": 100,
  "user_name": "Test User"
}
```

### Test Save Template:
```bash
curl -X POST https://your-n8n.com/webhook/save-template \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "tmpl_test_123",
    "user_id": 1,
    "name": "Test Template",
    "description": "Test",
    "category": "tiktok"
  }'
```

### Test Deduct Credits:
```bash
curl -X POST https://your-n8n.com/webhook/deduct-credits \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "template_id": "tmpl_test_123",
    "job_id": "job_test_456",
    "credits_to_deduct": 10,
    "video_url": "http://example.com/video.mp4",
    "duration": 10.5
  }'
```

---

## Security

**Optional: Add webhook secret verification**

In n8n workflow, verify the secret:
```javascript
// In n8n Code node
const receivedSecret = $headers['x-webhook-secret'];
const expectedSecret = 'your-secret-token';

if (receivedSecret !== expectedSecret) {
  return { success: false, error: 'Unauthorized' };
}
```

In FFmpeg API, we'll send the secret in headers:
```javascript
headers: {
  'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
}
```

---

## Error Handling

The FFmpeg API will handle webhook failures gracefully:

1. **Credit Check fails** → Render request rejected with 402 Payment Required
2. **Save Template fails** → Template saved locally, user gets warning
3. **Deduct Credits fails** → Logged as error, admin notification

---

## Next Steps

1. Create the 3 n8n workflows
2. Configure webhook URLs in `.env`
3. Test each webhook endpoint
4. Deploy updated FFmpeg API

Need help creating the n8n workflows? Let me know!
