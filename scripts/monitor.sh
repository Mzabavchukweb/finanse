#!/bin/bash

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
}

# Warning function
warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check disk usage
check_disk() {
    local threshold=85
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -gt $threshold ]; then
        error "Disk usage is above $threshold%: $usage%"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"🚨 Disk usage is above $threshold%: $usage%\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check memory usage
check_memory() {
    local threshold=85
    local usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}' | cut -d. -f1)
    
    if [ $usage -gt $threshold ]; then
        error "Memory usage is above $threshold%: $usage%"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"🚨 Memory usage is above $threshold%: $usage%\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check CPU usage
check_cpu() {
    local threshold=85
    local usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1)
    
    if [ $usage -gt $threshold ]; then
        error "CPU usage is above $threshold%: $usage%"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"🚨 CPU usage is above $threshold%: $usage%\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check application status
check_app() {
    if ! pm2 list | grep -q "cartechstore"; then
        error "Application is not running"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"🚨 Application is not running\"}" \
             $SLACK_WEBHOOK_URL
        # Restart application
        pm2 start dist/backend/server.js --name cartechstore
    fi
}

# Check database connections
check_db() {
    local max_connections=100
    local current_connections=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity;")
    
    if [ $current_connections -gt $max_connections ]; then
        warning "High number of database connections: $current_connections"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"⚠️ High number of database connections: $current_connections\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check SSL certificate
check_ssl() {
    local domain=$DOMAIN
    local expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    local days_left=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))
    
    if [ $days_left -lt 30 ]; then
        warning "SSL certificate expires in $days_left days"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"⚠️ SSL certificate expires in $days_left days\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check error logs
check_logs() {
    local error_count=$(tail -n 1000 /var/log/cartechstore/error.log | grep -c "ERROR")
    
    if [ $error_count -gt 10 ]; then
        warning "High number of errors in logs: $error_count"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"⚠️ High number of errors in logs: $error_count\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Check response time
check_response_time() {
    local threshold=2 # seconds
    local response_time=$(curl -s -w "%{time_total}" -o /dev/null https://$DOMAIN)
    
    if (( $(echo "$response_time > $threshold" | bc -l) )); then
        warning "High response time: ${response_time}s"
        # Send alert
        curl -X POST -H "Content-Type: application/json" \
             -d "{\"text\":\"⚠️ High response time: ${response_time}s\"}" \
             $SLACK_WEBHOOK_URL
    fi
}

# Main monitoring process
main() {
    log "Starting monitoring..."
    
    # Run all checks
    check_disk
    check_memory
    check_cpu
    check_app
    check_db
    check_ssl
    check_logs
    check_response_time
    
    log "Monitoring completed"
}

# Run main function
main 