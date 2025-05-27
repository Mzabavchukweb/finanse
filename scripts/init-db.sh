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
    exit 1
}

# Create database and user
create_db() {
    log "Creating database and user..."
    
    # Create user if not exists
    psql -U postgres -c "DO
    \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
            CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        END IF;
    END
    \$\$;"
    
    # Create database if not exists
    psql -U postgres -c "SELECT 'CREATE DATABASE $DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec"
    
    # Grant privileges
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
}

# Run migrations
run_migrations() {
    log "Running migrations..."
    npx sequelize-cli db:migrate
}

# Seed database
seed_database() {
    log "Seeding database..."
    npx sequelize-cli db:seed:all
}

# Create indexes
create_indexes() {
    log "Creating indexes..."
    
    # Users table indexes
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);"
    
    # Products table indexes
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);"
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);"
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);"
    
    # Orders table indexes
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);"
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);"
    psql -U $DB_USER -d $DB_NAME -c "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);"
}

# Configure database settings
configure_db() {
    log "Configuring database settings..."
    
    # Set connection limits
    psql -U postgres -c "ALTER SYSTEM SET max_connections = '200';"
    psql -U postgres -c "ALTER SYSTEM SET shared_buffers = '1GB';"
    psql -U postgres -c "ALTER SYSTEM SET effective_cache_size = '3GB';"
    psql -U postgres -c "ALTER SYSTEM SET maintenance_work_mem = '256MB';"
    psql -U postgres -c "ALTER SYSTEM SET checkpoint_completion_target = '0.9';"
    psql -U postgres -c "ALTER SYSTEM SET wal_buffers = '16MB';"
    psql -U postgres -c "ALTER SYSTEM SET default_statistics_target = '100';"
    psql -U postgres -c "ALTER SYSTEM SET random_page_cost = '1.1';"
    psql -U postgres -c "ALTER SYSTEM SET effective_io_concurrency = '200';"
    psql -U postgres -c "ALTER SYSTEM SET work_mem = '16MB';"
    psql -U postgres -c "ALTER SYSTEM SET min_wal_size = '1GB';"
    psql -U postgres -c "ALTER SYSTEM SET max_wal_size = '4GB';"
    
    # Reload configuration
    psql -U postgres -c "SELECT pg_reload_conf();"
}

# Main initialization process
main() {
    log "Starting database initialization..."
    
    # Create database and user
    create_db
    
    # Run migrations
    run_migrations
    
    # Seed database
    seed_database
    
    # Create indexes
    create_indexes
    
    # Configure database settings
    configure_db
    
    log "Database initialization completed successfully!"
}

# Run main function
main 