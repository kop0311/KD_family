#!/bin/bash

# Git Pre-deployment Checklist for KD Family Project
# This script verifies the Git repository is ready for Vercel deployment

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

echo "🔍 Git Pre-deployment Checklist for KD Family"
echo "=============================================="

# Check if we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a Git repository!"
    exit 1
fi

log_success "✅ Git repository detected"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    log_warning "⚠️  Not on main/master branch. Vercel typically deploys from main/master."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    log_error "❌ Uncommitted changes detected!"
    echo "Please commit all changes before deployment:"
    git status --porcelain
    exit 1
fi

log_success "✅ No uncommitted changes"

# Check for untracked files that might be important
UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED_FILES" ]; then
    log_warning "⚠️  Untracked files detected:"
    echo "$UNTRACKED_FILES"
    
    # Check for potentially important untracked files
    IMPORTANT_PATTERNS=("*.env*" "*.config.*" "*.json" "*.md" "*.sql" "*.sh")
    IMPORTANT_UNTRACKED=""
    
    for pattern in "${IMPORTANT_PATTERNS[@]}"; do
        MATCHES=$(echo "$UNTRACKED_FILES" | grep -E "$pattern" || true)
        if [ -n "$MATCHES" ]; then
            IMPORTANT_UNTRACKED="$IMPORTANT_UNTRACKED$MATCHES\n"
        fi
    done
    
    if [ -n "$IMPORTANT_UNTRACKED" ]; then
        log_warning "⚠️  Important untracked files found:"
        echo -e "$IMPORTANT_UNTRACKED"
        read -p "Do you want to continue without adding these files? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Check for sensitive files that should be ignored
SENSITIVE_PATTERNS=(".env" ".env.local" ".env.production" "*.key" "*.pem" "*.p12" ".mcp.json")
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git ls-files | grep -q "$pattern"; then
        log_error "❌ Sensitive file '$pattern' is tracked by Git!"
        log_error "Please remove it from Git and add to .gitignore"
        exit 1
    fi
done

log_success "✅ No sensitive files tracked"

# Check if .gitignore exists and has essential entries
if [ ! -f ".gitignore" ]; then
    log_error "❌ .gitignore file missing!"
    exit 1
fi

REQUIRED_GITIGNORE_ENTRIES=("node_modules/" ".env" ".next/" ".vercel")
for entry in "${REQUIRED_GITIGNORE_ENTRIES[@]}"; do
    if ! grep -q "$entry" .gitignore; then
        log_warning "⚠️  .gitignore missing entry: $entry"
    fi
done

log_success "✅ .gitignore file present"

# Check for required deployment files
REQUIRED_FILES=("package.json" "next.config.js" "vercel.json" ".env.example")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "❌ Required file missing: $file"
        exit 1
    fi
done

log_success "✅ All required deployment files present"

# Check remote repository
if git remote -v | grep -q origin; then
    REMOTE_URL=$(git remote get-url origin)
    log_info "Remote origin: $REMOTE_URL"
    
    # Check if local is ahead of remote
    if git status | grep -q "ahead of"; then
        log_warning "⚠️  Local branch is ahead of remote. Consider pushing changes."
        COMMITS_AHEAD=$(git rev-list --count HEAD ^origin/$CURRENT_BRANCH 2>/dev/null || echo "unknown")
        log_info "Commits ahead: $COMMITS_AHEAD"
    fi
    
    # Check if local is behind remote
    if git status | grep -q "behind"; then
        log_warning "⚠️  Local branch is behind remote. Consider pulling changes."
    fi
else
    log_warning "⚠️  No remote 'origin' configured. Vercel needs access to your repository."
fi

# Check recent commits
log_info "Recent commits:"
git log --oneline -5

# Check repository size (warn if too large)
REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1 || echo "unknown")
log_info "Repository size: $REPO_SIZE"

# Final summary
echo ""
echo "📋 Pre-deployment Summary:"
echo "=========================="
echo "✅ Repository: Ready"
echo "✅ Branch: $CURRENT_BRANCH"
echo "✅ Status: Clean working directory"
echo "✅ Files: All required files present"
echo "✅ Security: No sensitive files tracked"

# Check if we have the deployment tag
if git tag | grep -q "v1.0.0-vercel-ready"; then
    log_success "✅ Deployment tag found: v1.0.0-vercel-ready"
else
    log_warning "⚠️  No deployment tag found"
fi

echo ""
log_success "🎉 Git repository is ready for Vercel deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push to remote repository: git push origin $CURRENT_BRANCH"
echo "2. Push tags: git push origin --tags"
echo "3. Connect repository to Vercel"
echo "4. Configure environment variables in Vercel"
echo "5. Deploy!"

echo ""
echo "🔗 Useful commands:"
echo "git push origin $CURRENT_BRANCH --tags  # Push everything"
echo "vercel --prod                           # Deploy to production"
echo "vercel logs                             # View deployment logs"
