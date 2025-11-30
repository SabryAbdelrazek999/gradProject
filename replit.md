# ZAP OWASP Scanner - Web Vulnerability Security Tool

## Overview

ZAP OWASP Scanner is a professional-grade web vulnerability scanning application that helps security researchers and developers identify and fix security issues in web applications. The tool detects common vulnerabilities including XSS, SQL Injection, CSRF, security misconfigurations, and other issues from the OWASP Top 10.

The application provides a comprehensive dashboard for monitoring security scans, scheduling automated scans, generating reports, and managing security settings. It features a clean, developer-tool-inspired interface designed for clarity and efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18+ with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** Radix UI primitives with shadcn/ui component system
- **Styling:** Tailwind CSS with CSS variables for theming
- **Build Tool:** Vite

**Design System:**
- Follows a "Design System with Developer Tool Patterns" approach
- Typography uses Inter for UI elements and JetBrains Mono for technical data
- Implements consistent spacing primitives (2, 4, 6, 8, 12, 16 Tailwind units)
- Fixed sidebar layout (256px) with flexible main content area
- Dark mode enabled by default with light mode support

**Component Structure:**
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom application components in `client/src/components/`
- Page components in `client/src/pages/`
- Centralized utilities in `client/src/lib/`

**Key Pages:**
- Home - Overview dashboard with recent activity
- Dashboard - Comprehensive analytics with charts and statistics
- Scan Now - Interface for initiating new scans
- Scheduling - Automated scan configuration
- Reports - Scan history and vulnerability reports
- Settings - Application configuration and API key management
- About/FAQ - Documentation and help pages

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM
- **Database:** PostgreSQL (via Neon serverless)
- **Session Management:** express-session with connect-pg-simple or memorystore
- **Build:** esbuild for server bundling

**API Design:**
- RESTful API structure under `/api/*` routes
- JSON request/response format
- Error handling with appropriate HTTP status codes
- Request logging middleware for debugging

**Key API Endpoints:**
- `/api/stats` - Dashboard statistics
- `/api/dashboard` - Comprehensive dashboard data
- `/api/scans` - Scan CRUD operations
- `/api/vulnerabilities` - Vulnerability data by scan
- `/api/schedules` - Scheduled scan management
- `/api/settings` - User settings and API keys

### Data Architecture

**Database Schema (Drizzle ORM with PostgreSQL):**

1. **users table:**
   - Authentication and user management
   - API key storage for programmatic access

2. **scans table:**
   - Scan metadata (URL, type, status, timestamps)
   - Vulnerability counts by severity (critical, high, medium, low)
   - Status tracking (pending, running, completed)

3. **vulnerabilities table:**
   - Detailed vulnerability information
   - Foreign key relationship to scans
   - Severity classification and remediation guidance

4. **scheduledScans table:**
   - Automated scan configuration
   - Frequency and timing settings
   - Active/inactive status

5. **settings table:**
   - User preferences
   - Scan depth configuration
   - Notification settings

**Storage Strategy:**
- In-memory storage implementation (MemStorage class) for development
- Database storage designed for PostgreSQL production deployment
- IStorage interface allows for storage backend flexibility

### Security Scanning Engine

**Scanner Implementation (server/scanner.ts):**
- HTTP-based vulnerability detection
- Security header validation
- HTTPS enforcement checks
- Extensible vulnerability check system

**Scan Types:**
- Quick scan - Fast basic security checks
- Deep scan - Comprehensive vulnerability analysis

**Vulnerability Detection:**
- Missing security headers (CSP, X-Frame-Options, HSTS, etc.)
- Protocol security (HTTPS enforcement)
- Cheerio-based HTML parsing for advanced checks
- Axios for HTTP request handling with timeout controls

**Results Processing:**
- Severity classification (Critical, High, Medium, Low)
- Vulnerability counting and aggregation
- Status tracking throughout scan lifecycle
- Real-time scan progress updates via polling

### Development Workflow

**Build Process:**
- Client build via Vite (outputs to `dist/public`)
- Server build via esbuild (outputs to `dist`)
- Dependency bundling optimization for cold start performance
- TypeScript compilation with strict mode

**Development Mode:**
- Vite dev server with HMR
- Express server with live reload
- Replit-specific plugins for development tooling
- Source map support for debugging

**Production Mode:**
- Optimized client bundle
- Server bundle with selective dependency inclusion
- Static file serving from `dist/public`
- Environment-based configuration

## External Dependencies

### Core Dependencies

**Frontend:**
- @tanstack/react-query - Server state management and caching
- wouter - Lightweight routing solution
- @radix-ui/* - Headless UI component primitives
- tailwindcss - Utility-first CSS framework
- recharts - Data visualization and charting
- axios - HTTP client for API requests
- class-variance-authority - Component variant styling
- date-fns - Date manipulation utilities

**Backend:**
- express - Web application framework
- drizzle-orm - TypeScript ORM for database operations
- @neondatabase/serverless - Neon PostgreSQL serverless driver
- cheerio - Server-side HTML parsing for vulnerability detection
- express-session - Session middleware
- connect-pg-simple - PostgreSQL session store
- zod - Runtime type validation
- nanoid/uuid - Unique ID generation

**Development Tools:**
- vite - Frontend build tool and dev server
- esbuild - Fast JavaScript bundler for server
- tsx - TypeScript execution for development
- drizzle-kit - Database migration tool
- @replit/* plugins - Replit development environment integration

### Database

**Provider:** Neon Serverless PostgreSQL
- Connection via `@neondatabase/serverless` driver
- Connection string from `DATABASE_URL` environment variable
- Schema migrations managed by Drizzle Kit (output to `./migrations`)

### Styling System

**Theming:**
- CSS custom properties for color system
- Dark mode as default with light mode support
- Consistent border radius and spacing scales
- Shadow and elevation system

**Fonts:**
- Google Fonts: Inter (UI), JetBrains Mono (code/technical)
- Font loading via preconnect for performance

### Build & Deployment

**Build Script (script/build.ts):**
- Selective dependency bundling for server (allowlist approach)
- External dependencies for faster cold starts
- Coordinated client and server builds
- Clean dist output directory

**Environment Configuration:**
- `NODE_ENV` for environment detection
- `DATABASE_URL` for database connection
- Development vs production mode switching
- Replit-specific environment variables

### Docker Support

**Docker Configuration:**
- Multi-stage Dockerfile for optimized production builds
- Separate development and production compose files
- Production image uses Alpine Linux for minimal size
- Includes dumb-init for proper signal handling
- Node.js 20 LTS runtime

**Docker Compose Files:**
- `docker-compose.yml` - Production deployment with single app container
- `docker-compose.dev.yml` - Development mode with hot-reload and volume mounts
- Automatic rebuilding on compose up

**Running with Docker:**
```bash
# Production
docker-compose up --build

# Development
docker-compose -f docker-compose.dev.yml up --build

# Access on http://localhost:5000
```

**Docker Notes:**
- Application uses in-memory storage by default
- PostgreSQL can be enabled in compose file
- Port 5000 exposed for web access
- See DOCKER_SETUP.md for detailed instructions