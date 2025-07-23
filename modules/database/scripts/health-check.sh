#!/bin/bash

# KD Family Health Check Script
# Verifies that all components of the development environment are working

set -e

echo "🏥 KD Family Development Environment Health Check"
echo "================================================"

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

# Track health status
OVERALL_HEALTH=true

# Function to check command availability
check_command() {
    if command -v $1 &> /dev/null; then
        log_success "$1 is installed"
        return 0
    else
        log_error "$1 is not installed"
        OVERALL_HEALTH=false
        return 1
    fi
}

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        log_success "$service_name is healthy"
        return 0
    else
        log_error "$service_name is not responding"
        OVERALL_HEALTH=false
        return 1
    fi
}

echo ""
echo "🔧 System Requirements"
echo "====================="

# Check Node.js
if check_command node; then
    node_version=$(node --version)
    log_info "Node.js version: $node_version"
    
    if [[ "$node_version" < "v18" ]]; then
        log_warning "Node.js 18+ is recommended. Current version: $node_version"
    fi
fi

# Check npm
if check_command npm; then
    npm_version=$(npm --version)
    log_info "npm version: $npm_version"
fi

# Check Docker (optional)
if check_command docker; then
    if docker info > /dev/null 2>&1; then
        log_success "Docker is running"
    else
        log_warning "Docker is installed but not running"
    fi
else
    log_warning "Docker is not installed (optional for development)"
fi

echo ""
echo "📁 Project Structure"
echo "==================="

# Check important files and directories
important_files=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.js"
    "app/layout.tsx"
    "app/page.tsx"
    ".env.example"
)

for file in "${important_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file exists"
    else
        log_error "$file is missing"
        OVERALL_HEALTH=false
    fi
done

important_dirs=(
    "app"
    "components"
    "lib"
    "server"
    "scripts"
)

for dir in "${important_dirs[@]}"; do
    if [ -d "$dir" ]; then
        log_success "$dir/ directory exists"
    else
        log_error "$dir/ directory is missing"
        OVERALL_HEALTH=false
    fi
done

echo ""
echo "📦 Dependencies"
echo "==============="

# Check if node_modules exists
if [ -d "node_modules" ]; then
    log_success "node_modules directory exists"
    
    # Check for key dependencies
    key_deps=("next" "react" "react-dom" "@module-federation/nextjs-mf")
    
    for dep in "${key_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            log_success "$dep is installed"
        else
            log_error "$dep is not installed"
            OVERALL_HEALTH=false
        fi
    done
else
    log_error "node_modules directory is missing. Run 'npm install'"
    OVERALL_HEALTH=false
fi

echo ""
echo "⚙️ Configuration"
echo "================"

# Check environment file
if [ -f ".env" ]; then
    log_success ".env file exists"
else
    if [ -f ".env.example" ]; then
        log_warning ".env file missing. Copy from .env.example"
    else
        log_error "Both .env and .env.example are missing"
        OVERALL_HEALTH=false
    fi
fi

# Check TypeScript configuration
if npm run type-check > /dev/null 2>&1; then
    log_success "TypeScript configuration is valid"
else
    log_warning "TypeScript configuration has issues"
fi

echo ""
echo "🌐 Services Health Check"
echo "========================"

# Check if development servers are running
log_info "Checking if development servers are running..."

# Check backend server
if check_service "Backend API" "http://localhost:3000/api/health" "200"; then
    true
else
    log_info "Backend server is not running. Start with: npm run dev"
fi

# Check frontend server
if check_service "Next.js Frontend" "http://localhost:3001" "200"; then
    true
else
    log_info "Frontend server is not running. Start with: npm run dev:client"
fi

# Check proxy server (if running)
if check_service "Caddy Proxy" "http://localhost:8080" "200"; then
    true
else
    log_info "Caddy proxy is not running (optional)"
fi

echo ""
echo "🧪 Quick Tests"
echo "=============="

# Quick build test
log_info "Testing Next.js build..."
if npm run build > /dev/null 2>&1; then
    log_success "Next.js build works"
else
    log_error "Next.js build failed"
    OVERALL_HEALTH=false
fi

# Quick lint test
log_info "Testing ESLint..."
if npm run lint > /dev/null 2>&1; then
    log_success "ESLint passes"
else
    log_warning "ESLint has issues. Run 'npm run lint' for details"
fi

echo ""
echo "📊 Health Check Summary"
echo "======================="

if [ "$OVERALL_HEALTH" = true ]; then
    log_success "All health checks passed! 🎉"
    echo ""
    echo "🚀 Your development environment is ready!"
    echo ""
    echo "Quick Start Commands:"
    echo "  npm run dev          # Start backend server"
    echo "  npm run dev:client   # Start Next.js frontend"
    echo "  ./scripts/start-dev.sh  # Start both servers"
    echo ""
    exit 0
else
    log_error "Some health checks failed"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "  1. Install missing dependencies: npm install"
    echo "  2. Copy environment file: cp .env.example .env"
    echo "  3. Fix TypeScript errors: npm run type-check"
    echo "  4. Fix linting errors: npm run lint:fix"
    echo ""
    exit 1
fi
