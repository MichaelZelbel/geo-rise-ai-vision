#!/bin/bash
# ============================================
# GEORISE Database Deployment Script
# Automated deployment of schema and data to Supabase
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    print_error "psql is not installed. Please install PostgreSQL client."
    echo "Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "macOS: brew install postgresql"
    exit 1
fi

# Default connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-supabase-db-vokkcgog8ckogkkgc8o8sswg}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Interactive mode if password not set
if [ -z "$DB_PASSWORD" ]; then
    print_info "Please enter your Supabase database password:"
    read -s DB_PASSWORD
    echo ""
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Test connection
print_header "Testing Database Connection"
print_info "Host: $DB_HOST"
print_info "Port: $DB_PORT"
print_info "Database: $DB_NAME"
print_info "User: $DB_USER"

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection successful!"
else
    print_error "Failed to connect to database. Please check your credentials."
    print_info "You can set connection parameters via environment variables:"
    echo "  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

# Check if schema file exists
if [ ! -f "database-schema-enhanced.sql" ]; then
    print_error "database-schema-enhanced.sql not found!"
    print_info "Please run this script from the repository root directory."
    exit 1
fi

# Ask for confirmation
print_header "Deployment Plan"
echo "This script will:"
echo "  1. Deploy enhanced database schema (database-schema-enhanced.sql)"
echo "  2. Import sample data (database-dump.sql) - optional"
echo "  3. Run verification queries"
echo ""
print_warning "This may overwrite existing tables if they already exist!"
echo ""
read -p "Do you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Deploy schema
print_header "Step 1: Deploying Enhanced Schema"
print_info "Executing database-schema-enhanced.sql..."

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database-schema-enhanced.sql > /tmp/georise-schema-deploy.log 2>&1; then
    print_success "Schema deployed successfully!"

    # Show summary
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    print_info "Tables created: $TABLE_COUNT"
else
    print_error "Schema deployment failed!"
    print_info "Check log file: /tmp/georise-schema-deploy.log"
    cat /tmp/georise-schema-deploy.log
    exit 1
fi

# Ask about sample data
echo ""
read -p "Do you want to import sample data? (yes/no): " -r
if [[ $REPLY =~ ^[Yy]es$ ]]; then
    if [ ! -f "database-dump.sql" ]; then
        print_warning "database-dump.sql not found. Skipping data import."
    else
        print_header "Step 2: Importing Sample Data"
        print_info "Executing database-dump.sql..."

        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database-dump.sql > /tmp/georise-data-import.log 2>&1; then
            print_success "Sample data imported successfully!"
        else
            print_warning "Data import had some errors (this is normal if data already exists)"
            print_info "Check log file: /tmp/georise-data-import.log"
        fi
    fi
else
    print_info "Skipping sample data import."
fi

# Run verification
print_header "Step 3: Verification"
print_info "Running verification queries..."

echo ""
echo "Table Counts:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'analyses', COUNT(*) FROM analyses
UNION ALL
SELECT 'analysis_runs', COUNT(*) FROM analysis_runs
ORDER BY table_name;
"

echo ""
echo "Functions:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'has_role',
    'handle_new_user',
    'get_user_plan',
    'can_add_brand',
    'get_analysis_progress'
  )
ORDER BY routine_name;
"

echo ""
echo "Views:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
"

# Completion
print_header "Deployment Complete!"
print_success "Database schema and data have been deployed successfully!"
echo ""
print_info "Next Steps:"
echo "  1. Create auth.users records (see DEPLOYMENT_STEPS.md Step 6)"
echo "  2. Deploy N8N workflows (see n8n/README.md)"
echo "  3. Update environment variables (see INTEGRATION_GUIDE.md)"
echo "  4. Test integration"
echo ""
print_info "For detailed verification, run:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f verify-deployment.sql"
echo ""

# Cleanup
unset PGPASSWORD
