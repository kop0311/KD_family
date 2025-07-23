# Shared Module

## Overview
Shared infrastructure, documentation, and common utilities used across all modules.

## Structure
- `docker/` - Docker configurations and scripts
- `k8s/` - Kubernetes deployment manifests
- `docs/` - Project documentation
- `data/` - Shared data files and fixtures
- `debug/` - Debugging tools and utilities
- `uploads/` - File upload storage

## Key Features
- Docker containerization
- Kubernetes orchestration
- Comprehensive documentation
- Shared utilities and configurations
- Development tools

## Docker Services
- PostgreSQL database
- pgAdmin for database management
- Redis for caching
- Caddy for reverse proxy

## Kubernetes Deployment
- Production-ready manifests
- Service mesh configuration
- Monitoring and logging setup
- Auto-scaling configurations

## Documentation
- API documentation
- Deployment guides
- Development setup
- Troubleshooting guides

## Usage
```bash
# Start Docker services
docker-compose up -d

# Deploy to Kubernetes
kubectl apply -f k8s/

# View documentation
open docs/index.html
```
