# Backend Module

## Overview
Backend API services with Node.js/Express and Rust components, using PostgreSQL database.

## Structure
- `server/` - Node.js Express API server
  - `models/` - Database models (PostgreSQL)
  - `routes/` - API route handlers
- `src/` - Rust backend components
- `config/` - Database and server configuration

## Key Features
- RESTful API with Express.js
- PostgreSQL database with advanced features
- JWT authentication
- Rust components for performance-critical operations
- CORS and security middleware

## Development
```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies
cargo build

# Start development server
npm run dev:server

# Run Rust components
cargo run
```

## Database
- PostgreSQL 15 with advanced features
- JSONB support for flexible data
- Full-text search capabilities
- Optimized indexes for performance

## API Endpoints
- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/tasks` - Task management
- `/api/points` - Points and rewards system
