# KD Family Chore System

A modern family chore scoring system web application with full-stack TypeScript support and Caddy web server.

## 🏗️ Modular Architecture

The project uses a modular architecture with different functionalities organized into independent modules:

```
KD_Family/
├── modules/
│   ├── frontend/          # Next.js frontend application
│   ├── backend/           # Node.js/Rust backend services
│   ├── database/          # PostgreSQL database management
│   ├── testing/           # Testing framework and test suites
│   └── shared/            # Shared infrastructure and documentation
├── package.json           # Main project dependencies
├── docker-compose.yml     # Docker service orchestration
└── README.md             # Project documentation
```

### Module Overview

- **Frontend** (`modules/frontend/`): Next.js 15 application with React 18, TypeScript, and modern UI components
- **Backend** (`modules/backend/`): Node.js Express API with Rust components and PostgreSQL integration
- **Database** (`modules/database/`): PostgreSQL schema, migration scripts, and database management tools
- **Testing** (`modules/testing/`): Comprehensive testing framework with unit, integration, and E2E tests
- **Shared** (`modules/shared/`): Docker configurations, Kubernetes manifests, and project documentation

## 🚀 Technology Stack

### Frontend (Modern React App)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **UI Framework**: Tailwind CSS + Headless UI
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios + TanStack Query
- **Animation**: Framer Motion
- **Testing**: Vitest + Testing Library + Playwright

### Backend (Node.js API)
- **Runtime**: Node.js + TypeScript + Express
- **Database**: PostgreSQL 15 + pg driver
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate Limiting
- **Caching**: Redis
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Web Server & Proxy
- **Server**: Caddy 2.x
- **Features**: Auto HTTPS, HTTP/3, Reverse Proxy
- **SSL**: Automatic Let's Encrypt certificates
- **Caching**: Smart static file caching
- **Security**: Built-in security headers
- **Monitoring**: Structured logging + metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd KD_Family
```

2. **Install dependencies**
```bash
npm install
# This will automatically install both backend and frontend dependencies
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and domain settings
```

4. **Start with Caddy (Recommended)**
```bash
# Development environment
npm run caddy:dev
# Access: http://localhost:8080

# Production environment
export DOMAIN=your-domain.com
npm run caddy:prod
# Access: https://your-domain.com
```

### Alternative: Traditional Development
```bash
# Start backend and frontend separately
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Using Docker
```bash
# Modern stack with Caddy
docker-compose -f docker-compose.modern.yml up -d

# Development environment
docker-compose -f docker-compose.dev.yml up -d
```

## 📱 Application Access

### With Caddy (Recommended)
- **Frontend (React App)**: http://localhost:8080
- **API Documentation**: http://localhost:3000/api-docs
- **Admin Tools**: http://localhost:8081

### Direct Access
- **Frontend (Vite Dev)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
- **Adminer**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Database**: localhost:3307

## 🏗️ Project Structure

```
├── config/              # Database configuration
├── public/              # Frontend static files
├── schema/              # Database schema
├── server/              # Backend application
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   └── services/        # Background services
├── test/                # Test files
├── uploads/             # File uploads (avatars)
└── docker-compose.yml   # Docker configuration
```

## 🧪 Testing

```bash
npm test
```

## 🔧 Development

```bash
# Development with auto-reload
npm run dev

# Run linting (if configured)
npm run lint

# Run type checking (if configured)
npm run typecheck
```

## 📦 Dependencies

### Production
- **express**: Web framework
- **pg**: PostgreSQL client
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **joi**: Input validation
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling

### Development
- **jest**: Testing framework
- **supertest**: HTTP testing
- **nodemon**: Development auto-reload

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi

## 🐳 Docker Services

- **postgres**: PostgreSQL 15 database
- **pgadmin**: Web-based PostgreSQL administration
- **app**: Main Node.js application

## 📝 License

MIT