# Video Templates

This directory contains pre-built video templates for common use cases.

## Available Templates

### 1. TikTok Animal Facts (`tiktok_animal_facts.json`)

**Format:** Vertical (1080x1920)
**Duration:** ~10 seconds
**Use Case:** TikTok educational content with animal facts

**Required Variables:**
- `animal` - Animal name (e.g., "Shark", "Dolphin")
- `fact` - Interesting fact about the animal
- `video1` - URL to first video clip (5s)
- `video2` - URL to second video clip (5s)
- `voiceover` - URL to voiceover audio
- `background_music` - URL to background music

**Features:**
- Smooth transitions between clips
- Text overlays with facts
- Voiceover with background music
- Call-to-action text

---

### 2. LoFi YouTube Stream (`lofi_youtube_stream.json`)

**Format:** Horizontal (1920x1080)
**Duration:** 3 minutes (can be extended)
**Use Case:** YouTube LoFi music streams

**Required Variables:**
- `background_video` - URL to looping background video
- `album_art` - URL to album art image
- `music_track` - URL to music audio file
- `track_title` - Song title
- `artist_name` - Artist name

**Features:**
- Looping background video
- Album art overlay
- Track information display
- Fade out at end

---

### 3. Product Ad 15s (`product_ad_15s.json`)

**Format:** Square (1080x1080)
**Duration:** 15 seconds
**Use Case:** Instagram product advertisements

**Required Variables:**
- `product_video` - URL to product showcase video
- `product_name` - Product name
- `price` - Product price (e.g., "$99")
- `cta_text` - Call-to-action text (e.g., "Shop Now!")
- `background_music` - URL to background music

**Features:**
- Product name display
- Price highlight
- Strong call-to-action
- Background music

---

## Creating Custom Templates

Templates are JSON files with the following structure:

```json
{
  "template_name": "unique_template_name",
  "category": "tiktok|youtube|instagram|custom",
  "description": "Template description",
  "variables": ["var1", "var2", "..."],
  "structure": {
    "output": {
      "resolution": "1920x1080",
      "fps": 30,
      "format": "mp4"
    },
    "clips": [...],
    "voiceover": {...},
    "audio": {...},
    "text_overlays": [...]
  }
}
```

### Variable Substitution

Use `{{variable_name}}` syntax in template values to substitute variables at render time.

Example:
```json
{
  "text": "Hello {{username}}!"
}
```

### Supported Resolutions

- **Vertical (TikTok, Reels):** 1080x1920
- **Horizontal (YouTube):** 1920x1080
- **Square (Instagram):** 1080x1080

### Text Overlay Positions

- `top` - Top center
- `center` - Center
- `bottom` - Bottom center
- `left` - Left center
- `right` - Right center

### Transition Effects

- `fade` - Fade in/out
- `wipeleft` - Wipe left
- `wiperight` - Wipe right
- `slideup` - Slide up
- `slidedown` - Slide down

---

## Using Templates

### Via API

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "template": "tiktok_animal_facts",
    "variables": {
      "animal": "Shark",
      "fact": "Sharks can see in the dark!",
      "video1": "https://example.com/shark1.mp4",
      "video2": "https://example.com/shark2.mp4",
      "voiceover": "https://example.com/voice.mp3",
      "background_music": "https://example.com/music.mp3"
    }
  }'
```

### Via n8n

See `examples/n8n-workflows/` for complete workflow examples.

---

## Template Best Practices

1. **Keep It Simple:** Start with basic templates and add complexity gradually
2. **Test Locally:** Test with sample assets before deploying
3. **Document Variables:** Clearly document all required variables
4. **Optimize Assets:** Use compressed video/audio files for faster processing
5. **Set Realistic Durations:** Match clip durations to your content needs

---

## Need Help?

- Check the full documentation: `/docs/TEMPLATES.md`
- See examples: `/examples/api-requests/`
- Report issues: GitHub Issues
