# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy Commands
- Build locally: `npm run build`
- Dev server: `npm run dev`
- Deploy with Docker: `docker-compose up -d --build`
- Update server: `git pull && docker-compose down && docker-compose up -d --build`

## Server Configuration
- Ubuntu droplet (1vcpu-1gb-nyc1-01) running Nginx as reverse proxy
- DigitalOcean hosting in NYC1 region with 1 CPU, 1GB RAM
- Main container runs on port 3003, mapped from Docker container port 3000
- Server address: `https://search.getcrazywisdom.com`
- Nginx configuration in `/etc/nginx/sites-enabled/search.getcrazywisdom.com`
- Let's Encrypt SSL certificates for HTTPS
- Server also hosts other sites: getcrazywisdom.com (port 3000) and aiwhisperers.org (port 3001)
- Application running on Node.js in containerized environment
- Docker is managed from host, not available inside container

## Environment Variables
- `NEXT_PUBLIC_SITE_URL`: Must be set to `https://search.getcrazywisdom.com`
- Authentication: Requires Supabase credentials in `.env` file
- Embedding: Requires OpenAI or BGE API credentials for vector embeddings

## Code Guidelines
- Next.js 14+ App Router structure with TypeScript
- Authentication via middleware and Supabase
- Always use `getBaseUrl()` utility for redirect URLs 
- Keep components small and focused
- For debugging, access `/api/debug/*` endpoints

## Debug Tools
- `/api/debug/server` - Shows OS and server info
- `/api/debug/nginx` - Shows Nginx configuration
- `/api/debug/auth` - Tests authentication redirects
- Note: Docker debug information is not available from within the container

## Known Issues & Solutions
- The debug endpoints show `0.0.0.0:3000` in URLs when accessed directly
  - Solution: Use `getBaseUrl()` utility for URL generation with request context
- Docker Compose may fail with "ContainerConfig" error on deployment
  - Solution: Use simplified docker-compose.yml or deploy directly with docker run
- System has limited resources (1GB RAM) - monitor for performance issues
  - `NODE_OPTIONS="--max-old-space-size=512"` limits memory usage
- Authentication 404 errors at paths like `/auth/verify-email`
  - Solution: Added specific route handler for verify-email and catch-all auth handler
- Authentication verification links may display as literal templates (`{{ .ConfirmationURL }}`)
  - Supabase free tier templating issues are handled via flexible route matching
- Multiple sites on same server - be careful with port assignments
  - Port 3000: Main site, Port 3001: AIWhisperers, Port 3003: Podcast Search