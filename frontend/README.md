# FFmpeg Template Builder Frontend

Interactive web-based UI for creating custom video templates visually.

## Features

- **Visual Template Builder** - Drag & drop interface for building video templates
- **Component Library** - Pre-built components (Video, Audio, Voiceover, Variables)
- **Timeline Editor** - Visual timeline for managing template components
- **Properties Panel** - Edit component properties in real-time
- **JSON Preview** - View and copy the generated JSON template
- **Template Management** - List, create, edit, and delete templates
- **API Integration** - Seamless integration with FFmpeg Video API

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **@dnd-kit** - Drag and drop functionality

## Getting Started

### Prerequisites

- Node.js 18+ installed
- FFmpeg Video API running (backend)

### Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=your-api-key-here
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Docker Deployment

### Build and run with Docker:

```bash
# Build the Docker image
docker build -t ffmpeg-template-builder .

# Run the container
docker run -p 3001:80 ffmpeg-template-builder
```

### Using docker-compose:

From the root directory:
```bash
docker-compose up -d template-builder
```

Access the frontend at:
- Direct: `http://localhost:3001`
- Via Traefik: `http://your-server-ip/template-builder`

## Usage

### Creating a New Template

1. Click "Create New Template" button
2. Enter template name and description
3. Add components from the left sidebar:
   - **Video Clip** - Add video sources
   - **Background Music** - Add audio tracks
   - **Voiceover** - Add voiceover audio
   - **Variable** - Define template variables
4. Configure component properties in the right panel
5. Adjust output settings (resolution, FPS, duration)
6. Click "Save Template" to save to API

### Editing Existing Templates

1. Click on a template card in the list view
2. Modify components or properties
3. Click "Save Template" to update

### Using Variables

Variables allow dynamic content in your templates:

- Use the format `{{variable_name}}` in source URLs
- Define variables in the Variables section
- Example: `{{video_url}}`, `{{audio_url}}`, `{{title}}`

### Output Presets

Quick presets for common platforms:
- **TikTok** - 1080x1920 (9:16)
- **YouTube** - 1920x1080 (16:9)
- **Instagram** - 1080x1080 (1:1)

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── TemplateList.jsx
│   │   ├── TemplateBuilder.jsx
│   │   ├── ComponentLibrary.jsx
│   │   ├── Timeline.jsx
│   │   ├── PropertiesPanel.jsx
│   │   └── JSONPreview.jsx
│   ├── services/          # API integration
│   │   └── api.js
│   ├── App.jsx            # Main app component
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/                # Static assets
├── Dockerfile            # Docker configuration
├── nginx.conf           # Nginx configuration
└── package.json         # Dependencies
```

## API Endpoints Used

The frontend communicates with these API endpoints:

- `GET /community-templates` - List all templates
- `GET /community-templates/:id` - Get specific template
- `POST /community-templates` - Create new template
- `PUT /community-templates/:id` - Update template
- `DELETE /community-templates/:id` - Delete template
- `GET /templates` - Get built-in templates
- `POST /render` - Render video from template

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_API_KEY` | API key for authentication | Required |

### Nginx Configuration

The production build uses Nginx with:
- Client-side routing support
- Gzip compression
- Cache headers for static assets
- Security headers

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use CSS modules for component-specific styles

## Troubleshooting

### Cannot connect to API

1. Check `VITE_API_URL` in `.env`
2. Ensure backend API is running
3. Check CORS settings on backend
4. Verify API key is correct

### Build fails

1. Clear `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check Node.js version (18+ required)

### Docker container not starting

1. Check Docker logs:
   ```bash
   docker logs ffmpeg-template-builder
   ```

2. Verify nginx.conf is valid
3. Ensure port 80 (or 3001) is available

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Same as the main FFmpeg Video API project.

## Support

For issues and questions, please open an issue on the main repository.
