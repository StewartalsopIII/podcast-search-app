# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy Commands
- Build locally: `npm run build`
- Dev server: `npm run dev`
- Deploy with Docker: `docker-compose up -d --build`
- Update server: `git pull && docker-compose down && docker-compose up -d --build`

## Server Configuration
- Ubuntu droplet running Nginx as reverse proxy
- Main container runs on port 3003, mapped from Docker container port 3000
- Docker container name: `podcast-search-app`
- Server address: `https://search.getcrazywisdom.com`
- Nginx configuration in `/etc/nginx/sites-enabled/search.getcrazywisdom.com`
- Let's Encrypt SSL certificates for HTTPS

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
- `/api/debug/docker` - Shows Docker container configuration
- `/api/debug/nginx` - Shows Nginx configuration
- `/api/debug/auth` - Tests authentication redirects