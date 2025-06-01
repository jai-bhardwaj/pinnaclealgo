# PM2 Production Deployment Guide

## 🚀 Overview

This guide provides complete instructions for deploying your Trading Frontend application using PM2 ecosystem with support for multiple environments (production, staging, development).

## 📋 Prerequisites

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Install Application Dependencies
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

## 🔧 Configuration Files

### 1. PM2 Ecosystem Configuration (`ecosystem.config.js`)

The ecosystem file is already created with three environments:

- **Production**: `trading-frontend-prod` (Port 3000, Cluster mode, Max instances)
- **Staging**: `trading-frontend-staging` (Port 3001, Cluster mode, 2 instances)
- **Development**: `trading-frontend-dev` (Port 3002, Fork mode, File watching)

### 2. Environment Variables

Create environment-specific files:

#### Production (`.env.production`)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/trading_prod"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-secret-key-for-production"
API_BASE_URL="https://api.your-domain.com"
NEXT_TELEMETRY_DISABLED=1
```

#### Staging (`.env.staging`)
```env
NODE_ENV=staging
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/trading_staging"
NEXTAUTH_URL="https://staging.your-domain.com"
NEXTAUTH_SECRET="your-staging-secret-key"
API_BASE_URL="https://staging-api.your-domain.com"
NEXT_TELEMETRY_DISABLED=1
```

#### Development (`.env.local`)
```env
NODE_ENV=development
PORT=3002
DATABASE_URL="postgresql://user:password@localhost:5432/trading_dev"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-dev-secret-key"
API_BASE_URL="http://localhost:8000"
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 Quick Start

### Using the PM2 Deployment Script

The `pm2-deploy.sh` script provides easy management:

```bash
# Make the script executable
chmod +x pm2-deploy.sh

# Setup and start production
./pm2-deploy.sh production setup

# Start specific environment
./pm2-deploy.sh production start
./pm2-deploy.sh staging start
./pm2-deploy.sh development start

# Check status
./pm2-deploy.sh production status

# View logs
./pm2-deploy.sh production logs

# Graceful reload (zero-downtime)
./pm2-deploy.sh production reload

# Stop application
./pm2-deploy.sh production stop
```

### Manual PM2 Commands

#### Start Applications
```bash
# Production
pm2 start ecosystem.config.js --only trading-frontend-prod --env production

# Staging  
pm2 start ecosystem.config.js --only trading-frontend-staging --env staging

# Development
pm2 start ecosystem.config.js --only trading-frontend-dev --env development
```

#### Manage Applications
```bash
# Check status
pm2 status

# View logs
pm2 logs trading-frontend-prod
pm2 logs trading-frontend-staging

# Restart application
pm2 restart trading-frontend-prod

# Graceful reload (zero-downtime)
pm2 reload trading-frontend-prod

# Stop application
pm2 stop trading-frontend-prod

# Delete application
pm2 delete trading-frontend-prod
```

## 📊 Monitoring

### PM2 Monitoring Dashboard
```bash
# Open PM2 monitoring interface
pm2 monit

# Or using the script
./pm2-deploy.sh production monit
```

### Log Management
```bash
# View real-time logs
pm2 logs trading-frontend-prod --lines 100

# View specific log files
pm2 logs trading-frontend-prod --out
pm2 logs trading-frontend-prod --err

# Clear logs
pm2 flush
```

### Process Information
```bash
# Detailed process info
pm2 describe trading-frontend-prod

# Process list with memory/CPU usage
pm2 list
```

## 🔄 Deployment Workflows

### Production Deployment Workflow

1. **Prepare Environment**
   ```bash
   # Ensure production environment file exists
   cp .env.production.example .env.production
   # Edit .env.production with actual values
   ```

2. **Build and Deploy**
   ```bash
   # Complete setup and deployment
   ./pm2-deploy.sh production setup
   ```

3. **Verify Deployment**
   ```bash
   # Check application status
   ./pm2-deploy.sh production status
   
   # Test application
   curl http://localhost:3000/api/health
   ```

### Zero-Downtime Updates

1. **Build New Version**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Install dependencies and build
   npm install
   npm run build
   ```

2. **Graceful Reload**
   ```bash
   # Reload without downtime
   ./pm2-deploy.sh production reload
   ```

### Auto-Restart Setup

Make PM2 start automatically on system boot:

```bash
# Generate startup script
pm2 startup

# Save current PM2 process list
pm2 save
```

## 🔧 Advanced Configuration

### Memory Management
```bash
# Set memory limit
pm2 start ecosystem.config.js --max-memory-restart 1G

# Monitor memory usage
pm2 monit
```

### Load Balancing
The production configuration uses cluster mode with `max` instances, automatically utilizing all CPU cores.

### Log Rotation
```bash
# Install PM2 log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Application Won't Start**
   ```bash
   # Check logs for errors
   pm2 logs trading-frontend-prod --lines 50
   
   # Verify environment variables
   pm2 env 0
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory
   pm2 monit
   
   # Restart if needed
   pm2 restart trading-frontend-prod
   ```

### Health Checks

Create a health check endpoint in your Next.js app:

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

Test with:
```bash
curl http://localhost:3000/api/health
```

## 📈 Performance Optimization

### Cluster Mode Benefits
- Utilizes all CPU cores
- Automatic load balancing
- Zero-downtime reloads
- Process failure recovery

### Memory Optimization
```bash
# Set appropriate memory limits
pm2 start ecosystem.config.js --max-memory-restart 1G
```

### CPU Optimization
```bash
# Adjust instance count
pm2 scale trading-frontend-prod 4
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env.production` to version control
2. **File Permissions**: Restrict access to config files
3. **Process User**: Run PM2 with appropriate user permissions
4. **Firewall**: Configure firewall rules for application ports

## 📚 Useful Commands Reference

```bash
# Environment Management
./pm2-deploy.sh production setup    # Initial setup
./pm2-deploy.sh production start    # Start application
./pm2-deploy.sh production reload   # Zero-downtime reload
./pm2-deploy.sh production status   # Check status
./pm2-deploy.sh production logs     # View logs
./pm2-deploy.sh production stop     # Stop application

# Direct PM2 Commands
pm2 list                           # List all processes
pm2 monit                          # Monitoring dashboard
pm2 restart all                    # Restart all processes
pm2 stop all                       # Stop all processes
pm2 delete all                     # Delete all processes
pm2 save                           # Save current processes
pm2 resurrect                      # Restore saved processes
```

## 🎯 Next Steps

1. Set up your environment files
2. Configure your domain and SSL certificates
3. Set up reverse proxy (Nginx) if needed
4. Configure monitoring and alerting
5. Set up automated backups
6. Configure CI/CD pipeline for automated deployments

Your trading frontend is now ready for production deployment with PM2! 🚀 