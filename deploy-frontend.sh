#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="trading-frontend"
APP_DIR="/var/www/${APP_NAME}"
NODE_VERSION="18.x"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"
ENV_FILE=".env"
BACKUP_DIR="/var/backups/${APP_NAME}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log "Deployment failed. Rolling back..."
        if [ -d "${BACKUP_DIR}/latest" ]; then
            rm -rf "${APP_DIR}"
            cp -r "${BACKUP_DIR}/latest" "${APP_DIR}"
            log "Rolled back to previous version"
        fi
    fi
}

# Set up trap for cleanup
trap cleanup EXIT

# Create log file
touch "$LOG_FILE"
log "Starting deployment of ${APP_NAME}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    handle_error "Please run as root"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
log "Created backup directory"

# Backup current version if exists
if [ -d "$APP_DIR" ]; then
    log "Backing up current version"
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp -r "$APP_DIR" "${BACKUP_DIR}/${BACKUP_TIMESTAMP}"
    rm -rf "${BACKUP_DIR}/latest"
    cp -r "$APP_DIR" "${BACKUP_DIR}/latest"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    log "Installing Node.js ${NODE_VERSION}"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}" | bash - || handle_error "Failed to setup Node.js repository"
    apt-get update
    apt-get install -y nodejs || handle_error "Failed to install Node.js"
fi

# Install build dependencies
log "Installing build dependencies"
apt-get update
apt-get install -y build-essential || handle_error "Failed to install build dependencies"

# Create application directory
log "Setting up application directory"
mkdir -p "$APP_DIR"
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR"

# Install dependencies and build
log "Installing dependencies and building application"
npm install || handle_error "Failed to install dependencies"
npm run build || handle_error "Failed to build application"

# Copy built files
log "Copying built files to production directory"
cp -r .next package.json package-lock.json public "$APP_DIR/" || handle_error "Failed to copy built files"

# Create environment file
log "Creating environment file"
cat > "$APP_DIR/.env" << EOF
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NODE_ENV=production
EOF

# Create server.js file
log "Creating server.js file"
cat > "$APP_DIR/server.js" << EOF
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(\`> Ready on http://\${hostname}:\${port}\`)
  })
})
EOF

# Install production dependencies
log "Installing production dependencies"
cd "$APP_DIR"
npm install --omit=dev || handle_error "Failed to install production dependencies"

# Create systemd service file
log "Creating systemd service"
cat > "/etc/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=${APP_NAME} Service
After=network.target

[Service]
User=root
WorkingDirectory=${APP_DIR}
Environment="NODE_ENV=production"
Environment="NEXTAUTH_URL=http://localhost:3000"
Environment="NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/${APP_NAME}.log
StandardError=append:/var/log/${APP_NAME}.error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
log "Starting service"
systemctl daemon-reload
systemctl enable "${APP_NAME}"
systemctl restart "${APP_NAME}" || handle_error "Failed to start service"

# Verify service is running
sleep 5
if ! systemctl is-active --quiet "${APP_NAME}"; then
    handle_error "Service failed to start"
fi

# Check if application is responding
if ! curl -s -f "http://localhost:3000" > /dev/null; then
    handle_error "Application is not responding"
fi

log "Deployment completed successfully"
log "Application is running at http://localhost:3000"

# Print service status
systemctl status "${APP_NAME}" | cat 