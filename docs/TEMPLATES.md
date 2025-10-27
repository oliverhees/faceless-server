# Template Guide

Learn how to create and use video templates.

## Template Structure

Templates are JSON files that define video structure with variable placeholders.

### Basic Template

```json
{
  "template_name": "my_template",
  "category": "tiktok",
  "description": "Template description",
  "variables": ["var1", "var2"],
  "structure": {
    "output": {
      "resolution": "1920x1080",
      "fps": 30,
      "format": "mp4"
    },
    "clips": [...],
    "audio": {...},
    "text_overlays": [...]
  }
}
```

## Sections

### 1. Metadata

```json
{
  "template_name": "unique_name",
  "category": "tiktok|youtube|instagram",
  "description": "What this template does",
  "variables": ["list", "of", "required", "variables"]
}
```

### 2. Output Configuration

```json
{
  "output": {
    "resolution": "1080x1920",
    "fps": 30,
    "format": "mp4"
  }
}
```

**Supported Resolutions:**
- Vertical (TikTok): `1080x1920`
- Horizontal (YouTube): `1920x1080`
- Square (Instagram): `1080x1080`

### 3. Video Clips

```json
{
  "clips": [
    {
      "src": "{{video1}}",
      "duration": 5,
      "transition_out": "fade"
    },
    {
      "src": "{{video2}}",
      "duration": 5,
      "transition_out": "wipeleft"
    }
  ]
}
```

**Transition Effects:**
- `fade` - Fade in/out
- `wipeleft` - Wipe to left
- `wiperight` - Wipe to right

### 4. Audio

**Background Music:**
```json
{
  "audio": {
    "src": "{{background_music}}",
    "volume": 0.3,
    "fade_out": 2
  }
}
```

**Voiceover:**
```json
{
  "voiceover": {
    "src": "{{voiceover}}",
    "volume": 1.0
  }
}
```

### 5. Text Overlays

```json
{
  "text_overlays": [
    {
      "text": "{{dynamic_text}}",
      "start": 1,
      "duration": 4,
      "position": "center",
      "font_size": 70,
      "color": "white",
      "background": "rgba(0,0,0,0.6)"
    }
  ]
}
```

**Text Positions:**
- `top` - Top center
- `center` - Center
- `bottom` - Bottom center
- `left` - Left center
- `right` - Right center

**Colors:**
- Named: `white`, `black`, `red`, `yellow`
- Hex: `#FF0000`
- RGBA: `rgba(255,0,0,0.5)`

## Variable Substitution

Use `{{variable_name}}` syntax:

```json
{
  "text": "Hello {{username}}!",
  "src": "{{video_url}}"
}
```

At render time:
```json
{
  "variables": {
    "username": "John",
    "video_url": "https://..."
  }
}
```

Result: "Hello John!"

## Creating Custom Templates

### Step 1: Create Template File

Create `src/templates/my_template.json`:

```json
{
  "template_name": "my_template",
  "category": "custom",
  "variables": ["title", "video", "music"],
  "structure": {
    "output": {
      "resolution": "1920x1080",
      "fps": 30,
      "format": "mp4"
    },
    "clips": [
      {
        "src": "{{video}}",
        "duration": 10
      }
    ],
    "audio": {
      "src": "{{music}}",
      "volume": 0.5
    },
    "text_overlays": [
      {
        "text": "{{title}}",
        "start": 0,
        "duration": 10,
        "position": "top",
        "font_size": 80,
        "color": "yellow"
      }
    ]
  }
}
```

### Step 2: Test Template

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "template": "my_template",
    "variables": {
      "title": "My Video",
      "video": "https://example.com/video.mp4",
      "music": "https://example.com/music.mp3"
    }
  }'
```

## Advanced Features

### Custom Configuration Override

Override template settings at render time:

```json
{
  "template": "tiktok_animal_facts",
  "variables": {...},
  "custom_config": {
    "output": {
      "fps": 60
    },
    "text_overlays": [
      {
        "font_size": 100
      }
    ]
  }
}
```

### Multiple Text Overlays

```json
{
  "text_overlays": [
    {
      "text": "Title",
      "start": 0,
      "duration": 3,
      "position": "top"
    },
    {
      "text": "Subtitle",
      "start": 1,
      "duration": 5,
      "position": "center"
    },
    {
      "text": "CTA",
      "start": 8,
      "duration": 2,
      "position": "bottom"
    }
  ]
}
```

### Looping Background

```json
{
  "clips": [
    {
      "src": "{{background}}",
      "duration": 180,
      "loop": true
    }
  ]
}
```

## Best Practices

1. **Keep it Simple** - Start with basic templates
2. **Test Thoroughly** - Test with various inputs
3. **Document Variables** - Clear variable names and descriptions
4. **Use Standard Resolutions** - Stick to platform standards
5. **Optimize Assets** - Use compressed files for faster rendering
6. **Set Realistic Durations** - Match clip lengths to content

## Examples

See `src/templates/` for complete examples:
- `tiktok_animal_facts.json` - TikTok vertical video
- `lofi_youtube_stream.json` - YouTube horizontal stream
- `product_ad_15s.json` - Instagram square ad

## Troubleshooting

**Missing Variables:**
```
Error: Missing required variables: video1, audio
```
Solution: Provide all required variables

**Invalid Resolution:**
```
Error: Invalid resolution format
```
Solution: Use format `WIDTHxHEIGHT` (e.g., `1920x1080`)

**URL Download Failed:**
```
Error: Failed to download file from https://...
```
Solution: Ensure URLs are publicly accessible
