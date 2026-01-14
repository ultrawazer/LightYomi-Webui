# LightYomi WebUI

React-based web interface for the LightYomi light novel reader.

## Features

- Modern Material-UI design (Suwayomi-inspired)
- Full library management with categories
- Advanced reader with customizable settings
- Download queue management
- Source browsing with global search
- Dark/light theme support
- Responsive design

## Requirements

- Node.js 18+
- npm or pnpm

## Setup

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

Dev server runs on `http://localhost:5173` by default.

## Build

```bash
npm run build
```

Output is in `dist/` folder.

## Configuration

The WebUI expects the backend server at `/api/*`. Configure your proxy or use the Docker setup for production.

## License

MIT
