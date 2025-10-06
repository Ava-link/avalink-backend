# Avalink Backend

A basic Express backend with PostgreSQL database support hosted on AWS.

## Features

- Express.js server
- PostgreSQL database connection (AWS RDS)
- Health check endpoint
- TypeScript support
- Environment variable validation with Zod
- Centralized configuration management
- CORS enabled
- Layered architecture (Routes → Controllers → Services)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (AWS RDS)
- Yarn or npm

## Installation

```bash
# Install dependencies
yarn install
# or
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your AWS RDS PostgreSQL credentials:
```env
PORT=3001
NODE_ENV=development

DB_HOST=your-rds-instance.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=avalink
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true
```

## Running the Server

### Development Mode
```bash
yarn dev
# or
npm run dev
```

### Production Build
```bash
# Build
yarn build
# or
npm run build

# Start
yarn start
# or
npm start
```

## API Endpoints

### Health Check
- **Endpoint:** `GET /health`
- **Description:** Returns server health status and database connectivity
- **Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T...",
  "uptime": 123.45,
  "database": {
    "status": "healthy",
    "timestamp": "2025-10-06T..."
  },
  "environment": "development"
}
```

## Project Structure

```
avalink-backend/
├── src/
│   ├── config/
│   │   ├── env.ts                # Environment validation with Zod
│   │   └── database.ts           # Database configuration
│   ├── controllers/
│   │   └── health.controller.ts  # Health check controller
│   ├── services/
│   │   └── health.service.ts     # Health check business logic
│   ├── routes/
│   │   └── health.ts             # Health check routes
│   └── index.ts                  # Main application entry
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

The project follows a layered architecture:

- **Routes Layer** (`/routes`): Defines API endpoints and maps them to controllers
- **Controllers Layer** (`/controllers`): Handles HTTP requests/responses and calls services
- **Services Layer** (`/services`): Contains business logic and data operations
- **Config Layer** (`/config`): Application configuration with validated environment variables

### Environment Variable Management

All environment variables are centrally managed in `src/config/env.ts` and validated using Zod:

- ✅ **Type-safe**: Full TypeScript support with inferred types
- ✅ **Validated**: All required variables are checked at startup
- ✅ **Centralized**: Single source of truth for all configuration
- ✅ **Developer-friendly**: Clear error messages if validation fails

All other files import configuration from `env.ts`, ensuring consistency throughout the application.

**Example Usage:**

```typescript
// Instead of this:
const port = process.env.PORT || 3001;
const dbHost = process.env.DB_HOST;

// Do this:
import { env } from './config/env';
const port = env.PORT;        // Type: number (validated)
const dbHost = env.DB_HOST;   // Type: string (validated)
```

If any required environment variable is missing or invalid, the application will fail to start with a clear error message:

```
✗ Environment validation failed:
  - DB_HOST: String must contain at least 1 character(s)
  - DB_PASSWORD: String must contain at least 1 character(s)

Please check your .env file and ensure all required variables are set.
```

## License

ISC

