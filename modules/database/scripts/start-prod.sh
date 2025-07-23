#!/bin/bash

# KD Family Production Environment Startup Script
# Builds and starts the production environment with Docker

set -e

echo "🚀 Starting KD Family Production Environment"
echo "============================================="

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

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "Created .env file from template"
        log_warning "Please update .env file with production configuration"
        log_warning "Make sure to set secure passwords and proper domain settings"
        exit 1
    else
        log_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Validate required environment variables
log_info "Validating environment configuration..."

required_vars=("DOMAIN" "CADDY_EMAIL" "JWT_SECRET" "DB_PASSWORD" "MYSQL_ROOT_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    log_error "Please update your .env file with the required values"
    exit 1
fi

# Build the application
log_info "Building Next.js application..."
npm run build
log_success "Application built successfully"

# Stop any existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build Docker images
log_info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start the production environment
log_info "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Check service health
log_info "Checking service health..."

# Check if MySQL is ready
if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent; then
    log_success "MySQL is ready"
else
    log_error "MySQL is not ready"
fi

# Check if Redis is ready
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
    log_success "Redis is ready"
else
    log_error "Redis is not ready"
fi

# Check if application is ready
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log_success "Application is ready"
else
    log_warning "Application may still be starting up"
fi

log_success "Production environment is running!"
echo ""
echo "🌐 Application URLs:"
echo "   Main Application: https://${DOMAIN:-localhost}"
echo "   HTTP Redirect:    http://${DOMAIN:-localhost}"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose.prod.yml down"
echo "   Restart:          docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "📊 Optional Services:"
echo "   Start monitoring: docker-compose -f docker-compose.prod.yml --profile monitoring up -d"
echo "   Start backup:     docker-compose -f docker-compose.prod.yml --profile backup up -d"
echo ""

# Show running containers
log_info "Running containers:"
docker-compose -f docker-compose.prod.yml ps
