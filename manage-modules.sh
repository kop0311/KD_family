#!/bin/bash

# KD Family Modular Workspace Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    echo "KD Family Modular Workspace Management"
    echo ""
    echo "Usage: $0 <command> [module] [options]"
    echo ""
    echo "Commands:"
    echo "  setup              - Initial project setup"
    echo "  start              - Start all development services"
    echo "  stop               - Stop all services"
    echo "  build              - Build all modules"
    echo "  test               - Run tests for all modules"
    echo "  clean              - Clean build artifacts"
    echo "  status             - Show status of all modules"
    echo ""
    echo "Module-specific commands:"
    echo "  dev <module>       - Start development for specific module"
    echo "  build <module>     - Build specific module"
    echo "  test <module>      - Test specific module"
    echo ""
    echo "Available modules: frontend, backend, database, testing, shared"
    echo ""
    echo "Examples:"
    echo "  $0 setup           # Initial setup"
    echo "  $0 start           # Start all services"
    echo "  $0 dev frontend    # Start frontend development"
    echo "  $0 test backend    # Test backend module"
}

# Setup project
setup_project() {
    log_info "Setting up KD Family modular workspace..."
    
    # Install main dependencies
    log_info "Installing main project dependencies..."
    npm install
    
    # Start database
    log_info "Starting PostgreSQL database..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Initialize database
    log_info "Initializing database schema..."
    cd modules/database
    docker exec -i kdfamily_postgres psql -U kdfamily_user -d kdfamily < schema/postgresql_init.sql || true
    docker exec -i kdfamily_postgres psql -U kdfamily_user -d kdfamily < schema/postgresql_indexes.sql || true
    cd ../..
    
    # Setup frontend
    log_info "Setting up frontend module..."
    cd modules/frontend
    npm install || true
    cd ../..
    
    # Setup backend
    log_info "Setting up backend module..."
    cd modules/backend
    npm install || true
    if command -v cargo &> /dev/null; then
        cargo build || true
    fi
    cd ../..
    
    log_success "Project setup completed!"
}

# Start all services
start_services() {
    log_info "Starting all development services..."
    
    # Start infrastructure
    docker-compose up -d
    
    # Start backend in background
    log_info "Starting backend services..."
    cd modules/backend
    npm run dev &
    BACKEND_PID=$!
    cd ../..
    
    # Start frontend
    log_info "Starting frontend development server..."
    cd modules/frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ../..
    
    log_success "All services started!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend API: http://localhost:3001"
    log_info "Database: localhost:5433"
    log_info "pgAdmin: http://localhost:5050"
    
    # Save PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."
    
    # Stop background processes
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # Stop Docker services
    docker-compose down
    
    log_success "All services stopped!"
}

# Build all modules
build_all() {
    log_info "Building all modules..."
    
    # Build frontend
    log_info "Building frontend..."
    cd modules/frontend
    npm run build
    cd ../..
    
    # Build backend
    log_info "Building backend..."
    cd modules/backend
    npm run build || true
    if command -v cargo &> /dev/null; then
        cargo build --release || true
    fi
    cd ../..
    
    log_success "All modules built successfully!"
}

# Test all modules
test_all() {
    log_info "Running tests for all modules..."
    
    # Test frontend
    log_info "Testing frontend..."
    cd modules/frontend
    npm test || true
    cd ../..
    
    # Test backend
    log_info "Testing backend..."
    cd modules/backend
    npm test || true
    cd ../..
    
    # Test database
    log_info "Testing database..."
    cd modules/database
    node scripts/performance-test.js || true
    cd ../..
    
    # Run E2E tests
    log_info "Running E2E tests..."
    cd modules/testing
    npm run test:e2e || true
    cd ../..
    
    log_success "All tests completed!"
}

# Module-specific operations
module_operation() {
    local operation=$1
    local module=$2
    
    if [ ! -d "modules/$module" ]; then
        log_error "Module '$module' not found!"
        exit 1
    fi
    
    log_info "Running $operation for module: $module"
    cd "modules/$module"
    
    case $operation in
        "dev")
            npm run dev
            ;;
        "build")
            npm run build
            ;;
        "test")
            npm test
            ;;
        *)
            log_error "Unknown operation: $operation"
            exit 1
            ;;
    esac
    
    cd ../..
}

# Show status
show_status() {
    log_info "KD Family Modular Workspace Status"
    echo "=================================="
    
    # Check Docker services
    echo ""
    echo "Docker Services:"
    docker-compose ps 2>/dev/null || echo "Docker Compose not running"
    
    # Check modules
    echo ""
    echo "Modules:"
    for module in frontend backend database testing shared; do
        if [ -d "modules/$module" ]; then
            echo "  ✅ $module - Available"
        else
            echo "  ❌ $module - Missing"
        fi
    done
    
    # Check processes
    echo ""
    echo "Development Processes:"
    if [ -f .backend.pid ] && kill -0 $(cat .backend.pid) 2>/dev/null; then
        echo "  ✅ Backend - Running (PID: $(cat .backend.pid))"
    else
        echo "  ❌ Backend - Not running"
    fi
    
    if [ -f .frontend.pid ] && kill -0 $(cat .frontend.pid) 2>/dev/null; then
        echo "  ✅ Frontend - Running (PID: $(cat .frontend.pid))"
    else
        echo "  ❌ Frontend - Not running"
    fi
}

# Clean build artifacts
clean_all() {
    log_info "Cleaning build artifacts..."
    
    # Clean frontend
    cd modules/frontend
    rm -rf .next node_modules/.cache || true
    cd ../..
    
    # Clean backend
    cd modules/backend
    rm -rf target node_modules/.cache || true
    cd ../..
    
    log_success "Cleanup completed!"
}

# Main script logic
case "${1:-help}" in
    "setup")
        setup_project
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "build")
        if [ -n "$2" ]; then
            module_operation "build" "$2"
        else
            build_all
        fi
        ;;
    "test")
        if [ -n "$2" ]; then
            module_operation "test" "$2"
        else
            test_all
        fi
        ;;
    "dev")
        if [ -n "$2" ]; then
            module_operation "dev" "$2"
        else
            log_error "Please specify a module for dev command"
            exit 1
        fi
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "help"|*)
        show_help
        ;;
esac
