#!/bin/bash

# 🚀 Trading Platform Frontend Deployment Script
# Supports local development, staging, and production deployments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="trading-frontend"
NODE_VERSION="18"
DEPLOY_ENV=${1:-development}

# Functions
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

# Load environment variables from .env file
load_env_file() {
    local env_file=""
    
    case $DEPLOY_ENV in
        "production")
            env_file=".env.production"
            ;;
        "staging")
            env_file=".env.staging"
            ;;
        "development"|*)
            env_file=".env.local"
            ;;
    esac
    
    # Try to load the specific env file, fallback to .sample.env
    if [ -f "$env_file" ]; then
        log_info "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    elif [ -f ".env" ]; then
        log_info "Loading environment from .env"
        export $(grep -v '^#' ".env" | xargs)
    elif [ -f ".sample.env" ]; then
        log_warning "Using sample environment file. Please create $env_file for $DEPLOY_ENV deployment"
        export $(grep -v '^#' ".sample.env" | xargs)
    else
        log_error "No environment file found. Please create $env_file or .env"
        exit 1
    fi
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
        log_error "Node.js version $NODE_VERSION or higher is required (current: $NODE_CURRENT)"
        exit 1
    fi
    
    # Check for required environment variables
    if [ -z "$NEXTAUTH_SECRET" ]; then
        log_error "NEXTAUTH_SECRET environment variable is required"
        log_info "Generate one with: openssl rand -base64 32"
        exit 1
    fi
    
    if [ -z "$NEXTAUTH_URL" ]; then
        log_error "NEXTAUTH_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    log_success "All requirements met"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean install
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
    fi
    
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    npm install
    
    log_success "Dependencies installed"
}

setup_database() {
    log_info "Setting up database..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Deploy migrations
    if [ "$DEPLOY_ENV" = "production" ]; then
        log_info "Deploying migrations to production database..."
        npx prisma migrate deploy
    else
        log_info "Pushing database schema..."
        npx prisma db push
    fi
    
    log_success "Database setup complete"
}

build_application() {
    log_info "Building application for $DEPLOY_ENV..."
    
    # Set NODE_ENV for build
    export NODE_ENV=$DEPLOY_ENV
    
    # Type checking
    log_info "Running type check..."
    npx tsc --noEmit
    
    # Build Next.js application
    log_info "Building Next.js application..."
    npm run build
    
    log_success "Application built successfully"
}

deploy_local() {
    log_info "Starting local development server..."
    
    # Start development server
    npm run dev
}

deploy_production() {
    log_info "Preparing production deployment..."
    
    # Create production build
    build_application
    
    # Start production server
    log_info "Starting production server..."
    npm run start
}

deploy_docker() {
    log_info "Building Docker image..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        create_dockerfile
    fi
    
    # Build Docker image
    docker build -t $PROJECT_NAME:$DEPLOY_ENV .
    
    # Run Docker container
    docker run -p 3000:3000 --env-file .env.$DEPLOY_ENV $PROJECT_NAME:$DEPLOY_ENV
    
    log_success "Docker deployment complete"
}

create_dockerfile() {
    log_info "Creating Dockerfile..."
    
    cat > Dockerfile << 'EOF'
# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
EOF
    
    log_success "Dockerfile created"
}

create_docker_compose() {
    log_info "Creating docker-compose.yml..."
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=$DEPLOY_ENV
      - NEXTAUTH_URL=$NEXTAUTH_URL
      - NEXTAUTH_SECRET=$NEXTAUTH_SECRET
      - DATABASE_URL=$DATABASE_URL
      - API_BASE_URL=$API_BASE_URL
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=trading
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF
    
    log_success "docker-compose.yml created"
}

show_deployment_summary() {
    log_success "🎉 Deployment completed successfully!"
    echo
    log_info "📋 Deployment Summary:"
    echo "  Environment: $DEPLOY_ENV"
    echo "  Node.js: $(node -v)"
    echo "  Project: $PROJECT_NAME"
    echo "  URL: $NEXTAUTH_URL"
    echo
    log_info "🔗 Useful Commands:"
    echo "  - View logs: docker logs $PROJECT_NAME"
    echo "  - Stop: docker stop $PROJECT_NAME"
    echo "  - Restart: docker restart $PROJECT_NAME"
    echo
    log_info "📁 Files Created:"
    if [ -f "Dockerfile" ]; then
        echo "  - Dockerfile"
    fi
    if [ -f "docker-compose.yml" ]; then
        echo "  - docker-compose.yml"
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting $PROJECT_NAME deployment for $DEPLOY_ENV environment"
    echo
    
    # Load environment variables
    load_env_file
    
    # Check requirements
    check_requirements
    
    # Install dependencies
    install_dependencies
    
    # Setup database
    setup_database
    
    # Deploy based on environment
    case $DEPLOY_ENV in
        "development")
            deploy_local
            ;;
        "production")
            deploy_production
            ;;
        "docker")
            deploy_docker
            ;;
        "docker-compose")
            create_docker_compose
            docker-compose up -d
            ;;
        *)
            log_error "Unknown deployment environment: $DEPLOY_ENV"
            log_info "Available options: development, production, docker, docker-compose"
            exit 1
            ;;
    esac
    
    show_deployment_summary
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment]"
    echo
    echo "Available environments:"
    echo "  development    - Start local development server"
    echo "  production     - Build and start production server"
    echo "  docker         - Build and run Docker container"
    echo "  docker-compose - Create and run with docker-compose"
    echo
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production"
    echo "  $0 docker"
    exit 1
fi

# Run main function
main "$@" 