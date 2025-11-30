# ZAP Web Scanner - OWASP Vulnerability Scanner

A professional web vulnerability scanning application for detecting security issues including XSS, SQL injection, CSRF, insecure headers, and SSL/TLS problems.

## Quick Start

### With Docker Desktop (Recommended)

```bash
# Production
docker-compose up --build

# Development with hot-reload
docker-compose -f docker-compose.dev.yml up --build
```

Access the app at `http://localhost:5000`

### Local Development (without Docker)

```bash
npm install
npm run dev
```

Access the app at `http://localhost:5000`

## Features

- **Real-time Vulnerability Scanning**
  - Security header validation (CSP, HSTS, X-Frame-Options)
  - HTTPS/SSL enforcement checks
  - XSS vulnerability detection
  - CSRF protection analysis
  - Information disclosure detection

- **Dashboard & Analytics**
  - Scan history and status tracking
  - Vulnerability severity breakdown
  - Weekly activity charts

- **Report Generation**
  - Export reports as JSON or HTML
  - Detailed vulnerability findings
  - Remediation guidance

- **Scheduled Scans**
  - Set up recurring automated scans
  - Configure scan frequency and timing

- **API Access**
  - REST API for programmatic access
  - API key management
  - Scan automation support

## Project Structure

```
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # UI components
│       └── lib/           # Utilities
├── server/                # Node.js backend
│   ├── index.ts           # Express app
│   ├── routes.ts          # API endpoints
│   ├── scanner.ts         # Vulnerability engine
│   └── storage.ts         # Data storage
├── shared/                # Shared types
│   └── schema.ts          # Data models
├── script/                # Build scripts
└── Dockerfile             # Docker configuration
```

## Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Wouter for routing
- TanStack Query for state
- Tailwind CSS + shadcn/ui
- Recharts for visualization

**Backend:**
- Express.js with TypeScript
- Axios + Cheerio for web scraping
- In-memory storage (easily swappable)
- Drizzle ORM ready

## Environment Variables

See `.env.example` for all available options:

```bash
NODE_ENV=production      # or development
PORT=5000               # Server port
DATABASE_URL=           # Optional PostgreSQL
SESSION_SECRET=         # Optional session secret
```

## Docker Deployment

### Production Build

```bash
docker-compose up --build
```

### Development with Hot Reload

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### View Logs

```bash
docker-compose logs -f
```

### Stop Container

```bash
docker-compose down
```

For detailed Docker instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

## API Endpoints

### Scanning
- `GET /api/stats` - Dashboard statistics
- `GET /api/scans` - List all scans
- `POST /api/scans` - Start new scan
- `GET /api/scans/:id` - Get scan details
- `DELETE /api/scans/:id` - Delete scan

### Reports
- `GET /api/reports/export/:scanId?format=json|html` - Export report

### Scheduling
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PATCH /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings
- `POST /api/settings/regenerate-key` - Regenerate API key

## Building for Production

```bash
npm run build
npm start
```

Or with Docker:

```bash
docker-compose up --build
```

## License

Designed for security research and vulnerability assessment.
