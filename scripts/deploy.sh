#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Error function
error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Warning function
warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root"
fi

# Check required commands
for cmd in node npm pm2 nginx certbot; do
    if ! command -v $cmd &> /dev/null; then
        error "$cmd is required but not installed"
    fi
done

# Backup function
backup() {
    log "Creating backup..."
    BACKUP_DIR="/var/backups/cartechstore"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $BACKUP_DIR
    pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log "Backup created successfully: $BACKUP_FILE"
    else
        error "Backup failed"
    fi
}

# Update system
update_system() {
    log "Updating system..."
    apt update && apt upgrade -y
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci --production
}

# Build application
build_app() {
    log "Building application..."
    npm run build
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    cat > /etc/nginx/sites-available/cartechstore << EOL
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: https://*.stripe.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://js.stripe.com https://www.google.com; connect-src 'self' https://api.stripe.com https://*.sentry.io;" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        
        # Cache control
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";
}
EOL

    ln -sf /etc/nginx/sites-available/cartechstore /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
}

# Configure SSL
configure_ssl() {
    log "Configuring SSL..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL
}

# Start application
start_app() {
    log "Starting application..."
    pm2 start dist/backend/server.js --name cartechstore --max-memory-restart 1G
    pm2 save
}

# Monitor application
monitor_app() {
    log "Setting up monitoring..."
    
    # Configure PM2 monitoring
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    
    # Configure system monitoring
    cat > /etc/logrotate.d/cartechstore << EOL
/var/log/cartechstore/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \`cat /var/run/nginx.pid\`
    endscript
}
EOL
}

# Main deployment process
main() {
    log "Starting deployment..."
    
    # Create backup
    backup
    
    # Update system
    update_system
    
    # Install dependencies
    install_dependencies
    
    # Build application
    build_app
    
    # Configure Nginx
    configure_nginx
    
    # Configure SSL
    configure_ssl
    
    # Start application
    start_app
    
    # Setup monitoring
    monitor_app
    
    log "Deployment completed successfully!"
}

# Run main function
main 