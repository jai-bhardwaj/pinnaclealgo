#!/bin/bash

# 🚀 PM2 Deployment Script for Trading Frontend
# Usage: ./pm2-deploy.sh [environment] [action]
# Environments: production, staging, development
# Actions: start, stop, restart, reload, status, logs, monit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="trading-frontend"
ECOSYSTEM_FILE="ecosystem.config.js"

# Default values
ENVIRONMENT=${1:-production}
ACTION=${2:-start}

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

show_usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  production   - Production deployment (default)"
    echo "  staging      - Staging deployment"
    echo "  development  - Development deployment"
    echo ""
    echo "Actions:"
    echo "  start        - Start the application (default)"
    echo "  stop         - Stop the application"
    echo "  restart      - Restart the application"
    echo "  reload       - Graceful reload (zero-downtime)"
    echo "  status       - Show application status"
    echo "  logs         - Show application logs"
    echo "  monit        - Show PM2 monitoring dashboard"
    echo "  delete       - Delete the application from PM2"
    echo "  build        - Build the application"
    echo "  setup        - Initial setup and build"
    echo ""
    echo "Examples:"
    echo "  $0 production start"
    echo "  $0 staging reload"
    echo "  $0 development logs"
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Installing PM2..."
        npm install -g pm2
        log_success "PM2 installed successfully"
    fi
}

check_ecosystem_file() {
    if [ ! -f "$ECOSYSTEM_FILE" ]; then
        log_error "Ecosystem file ($ECOSYSTEM_FILE) not found!"
        exit 1
    fi
}

load_env_file() {
    local env_file=""
    
    case $ENVIRONMENT in
        "production")
            env_file=".env.production"
            ;;
        "staging")
            env_file=".env.staging"
            ;;
        "development")
            env_file=".env.local"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            show_usage
            exit 1
            ;;
    esac
    
    if [ -f "$env_file" ]; then
        log_info "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log_warning "Environment file $env_file not found. Using defaults."
    fi
}

ensure_logs_directory() {
    if [ ! -d "logs" ]; then
        log_info "Creating logs directory..."
        mkdir -p logs
        log_success "Logs directory created"
    fi
}

build_application() {
    log_info "Building application for $ENVIRONMENT..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Generate Prisma client
    if [ -f "prisma/schema.prisma" ]; then
        log_info "Generating Prisma client..."
        npx prisma generate
    fi
    
    # Build Next.js application
    log_info "Building Next.js application..."
    npm run build
    
    log_success "Application built successfully"
}

get_app_name() {
    case $ENVIRONMENT in
        "production")
            echo "trading-frontend-prod"
            ;;
        "staging")
            echo "trading-frontend-staging"
            ;;
        "development")
            echo "trading-frontend-dev"
            ;;
    esac
}

perform_action() {
    local app_name=$(get_app_name)
    
    case $ACTION in
        "setup")
            log_info "Setting up $ENVIRONMENT environment..."
            ensure_logs_directory
            build_application
            pm2 start $ECOSYSTEM_FILE --only $app_name --env $ENVIRONMENT
            log_success "Setup completed for $ENVIRONMENT"
            ;;
        "start")
            log_info "Starting $app_name..."
            pm2 start $ECOSYSTEM_FILE --only $app_name --env $ENVIRONMENT
            log_success "$app_name started successfully"
            ;;
        "stop")
            log_info "Stopping $app_name..."
            pm2 stop $app_name
            log_success "$app_name stopped successfully"
            ;;
        "restart")
            log_info "Restarting $app_name..."
            pm2 restart $app_name
            log_success "$app_name restarted successfully"
            ;;
        "reload")
            log_info "Gracefully reloading $app_name..."
            pm2 reload $app_name
            log_success "$app_name reloaded successfully"
            ;;
        "status")
            log_info "Status for $app_name:"
            pm2 status $app_name
            ;;
        "logs")
            log_info "Showing logs for $app_name (Ctrl+C to exit):"
            pm2 logs $app_name --lines 50
            ;;
        "monit")
            log_info "Opening PM2 monitoring dashboard..."
            pm2 monit
            ;;
        "delete")
            log_warning "Deleting $app_name from PM2..."
            pm2 delete $app_name
            log_success "$app_name deleted from PM2"
            ;;
        "build")
            build_application
            ;;
        *)
            log_error "Invalid action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
}

# Main execution
main() {
    log_info "PM2 Deployment Script for Trading Frontend"
    log_info "Environment: $ENVIRONMENT"
    log_info "Action: $ACTION"
    echo ""
    
    # Validate arguments
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi
    
    # Check requirements
    check_pm2
    check_ecosystem_file
    load_env_file
    ensure_logs_directory
    
    # Perform the requested action
    perform_action
    
    echo ""
    log_success "Operation completed successfully!"
    
    # Show quick status
    if [ "$ACTION" != "logs" ] && [ "$ACTION" != "monit" ] && [ "$ACTION" != "delete" ]; then
        echo ""
        log_info "Quick status:"
        pm2 status $(get_app_name) 2>/dev/null || log_warning "App not running"
    fi
}

# Run main function
main "$@" 