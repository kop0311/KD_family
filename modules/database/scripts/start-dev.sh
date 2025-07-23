#!/bin/bash

# KD Family Development Environment Startup Script
# Starts Next.js 15 with Turbopack and Module Federation

set -e

echo "🚀 Starting KD Family Development Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
node_version=$(node --version)
log_info "Node.js version: $node_version"

if [[ "$node_version" < "v18" ]]; then
    log_error "Node.js 18+ is required. Current version: $node_version"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "Created .env file from template"
        log_warning "Please update .env file with your configuration"
    else
        log_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
fi

# Check if Docker is running (optional)
if command -v docker &> /dev/null; then
    if docker info > /dev/null 2>&1; then
        log_info "Docker is running"
        
        # Ask if user wants to start database services
        read -p "Start database services with Docker? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Starting database services..."
            docker-compose -f docker-compose.dev.yml up -d mysql-dev redis-dev
            log_success "Database services started"
            
            # Wait for database to be ready
            log_info "Waiting for database to be ready..."
            sleep 10
        fi
    else
        log_warning "Docker is installed but not running"
    fi
else
    log_warning "Docker is not installed. Database services will need to be started manually."
fi

# Start the development servers
log_info "Starting development servers..."

# Function to handle cleanup on exit
cleanup() {
    log_info "Shutting down development servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
log_info "Starting backend server on port 3000..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start Next.js frontend with Turbopack
log_info "Starting Next.js frontend with Turbopack on port 3001..."
npm run dev:client &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

log_success "Development environment is ready!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend (Next.js): http://localhost:3001"
echo "   Backend API:        http://localhost:3000"
echo "   Proxy (Caddy):      http://localhost:8080 (if running)"
echo ""
echo "🔧 Development Features:"
echo "   ⚡ Turbopack enabled for faster builds"
echo "   🔄 Hot reload for both frontend and backend"
echo "   🧩 Module Federation ready"
echo "   🎨 Glass-morphism design system"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
