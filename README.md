# Podcast Search App

A Next.js application for embedding podcast transcripts and enabling semantic search with configurable embedding providers.

## Features

- **Authentication**: Secure user authentication using Supabase Auth (email/password and Google OAuth).
- **Transcript Management**: Upload podcast transcripts in Markdown format with timestamps.
- **Semantic Search**: Search through your podcast transcripts using natural language queries.
- **Configurable Embedding Providers**: Switch between OpenAI and external BGE model APIs via configuration.
- **Responsive UI**: Modern interface built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, and Tailwind CSS
- **UI Components**: shadcn/ui for consistent design
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with pgvector for storing embeddings
- **Authentication**: Supabase Auth
- **Embedding Providers**:
  - OpenAI API (text-embedding-3-small, 1536 dimensions)
  - External BGE model API (e.g., Hugging Face Inference Endpoints for bge-base-en-v1.5, 768 dimensions)
- **Form Handling**: react-hook-form with zod validation
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)
- OpenAI API key and/or access to a BGE model API endpoint

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/podcast-search-app.git
cd podcast-search-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the `.env.example` file to `.env.local` and fill in your configuration:

```bash
cp .env.example .env.local
```

4. **Set up Supabase**

- Create a new Supabase project
- Enable the pgvector extension in the SQL editor
- Run the schema.sql script from the supabase directory

5. **Run the development server**

```bash
npm run dev
```

## Deployment

### Docker

Build and run using Docker:

```bash
docker build -t podcast-search-app .
docker run -p 3000:3000 --env-file .env.local podcast-search-app
```

Or using Docker Compose:

```bash
docker-compose up -d
```

## Switching Embedding Providers

The application supports switching between OpenAI and BGE model APIs:

1. Update the `EMBEDDING_PROVIDER` environment variable to either `openai` or `bge`
2. Set the `EMBEDDING_DIMENSION` to match your provider (1536 for OpenAI, 768 for BGE)
3. If changing dimensions on an existing database:
   - Update the table schema (see schema.sql for instructions)
   - Re-generate embeddings for existing content

## License

MIT