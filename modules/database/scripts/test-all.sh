#!/bin/bash

# KD Family Comprehensive Testing Script
# Runs all tests including unit, integration, and E2E tests

set -e

echo "🧪 Running KD Family Comprehensive Test Suite"
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

# Track test results
UNIT_TESTS_PASSED=false
E2E_TESTS_PASSED=false
LINT_PASSED=false
TYPE_CHECK_PASSED=false

# Function to cleanup background processes
cleanup() {
    log_info "Cleaning up background processes..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# 1. Type checking
log_info "Running TypeScript type checking..."
if npm run type-check; then
    log_success "TypeScript type checking passed"
    TYPE_CHECK_PASSED=true
else
    log_error "TypeScript type checking failed"
fi

# 2. Linting
log_info "Running ESLint..."
if npm run lint; then
    log_success "ESLint passed"
    LINT_PASSED=true
else
    log_error "ESLint failed"
fi

# 3. Unit and Integration Tests
log_info "Running unit and integration tests..."
if npm test; then
    log_success "Unit and integration tests passed"
    UNIT_TESTS_PASSED=true
else
    log_error "Unit and integration tests failed"
fi

# 4. Start servers for E2E tests
log_info "Starting development servers for E2E tests..."

# Start backend server
npm run dev &
BACKEND_PID=$!
log_info "Backend server started (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 5

# Start frontend server
npm run dev:client &
FRONTEND_PID=$!
log_info "Frontend server started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
sleep 10

# Check if servers are running
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log_success "Backend server is ready"
else
    log_warning "Backend server may not be ready"
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    log_success "Frontend server is ready"
else
    log_warning "Frontend server may not be ready"
fi

# 5. E2E Tests
log_info "Running E2E tests..."
if npm run test:e2e; then
    log_success "E2E tests passed"
    E2E_TESTS_PASSED=true
else
    log_error "E2E tests failed"
fi

# Stop servers
log_info "Stopping development servers..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true

# Wait for servers to stop
sleep 3

# 6. Generate test report
log_info "Generating test report..."

echo ""
echo "📊 Test Results Summary"
echo "======================="

if [ "$TYPE_CHECK_PASSED" = true ]; then
    echo -e "${GREEN}✅ TypeScript Type Checking${NC}"
else
    echo -e "${RED}❌ TypeScript Type Checking${NC}"
fi

if [ "$LINT_PASSED" = true ]; then
    echo -e "${GREEN}✅ ESLint${NC}"
else
    echo -e "${RED}❌ ESLint${NC}"
fi

if [ "$UNIT_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ Unit & Integration Tests${NC}"
else
    echo -e "${RED}❌ Unit & Integration Tests${NC}"
fi

if [ "$E2E_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ E2E Tests${NC}"
else
    echo -e "${RED}❌ E2E Tests${NC}"
fi

echo ""

# Overall result
if [ "$TYPE_CHECK_PASSED" = true ] && [ "$LINT_PASSED" = true ] && [ "$UNIT_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ]; then
    log_success "All tests passed! 🎉"
    echo ""
    echo "📈 Coverage Report:"
    echo "   Unit Test Coverage: Available in ./coverage/index.html"
    echo "   E2E Test Report: Available in ./test-reports/"
    echo ""
    echo "🚀 Your application is ready for deployment!"
    exit 0
else
    log_error "Some tests failed. Please check the output above."
    echo ""
    echo "🔧 Next Steps:"
    if [ "$TYPE_CHECK_PASSED" = false ]; then
        echo "   - Fix TypeScript type errors"
    fi
    if [ "$LINT_PASSED" = false ]; then
        echo "   - Fix ESLint errors with: npm run lint:fix"
    fi
    if [ "$UNIT_TESTS_PASSED" = false ]; then
        echo "   - Fix failing unit tests"
    fi
    if [ "$E2E_TESTS_PASSED" = false ]; then
        echo "   - Fix failing E2E tests"
    fi
    exit 1
fi
