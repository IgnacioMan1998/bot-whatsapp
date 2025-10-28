#!/bin/bash

# WhatsApp Personal Assistant Setup Script
# This script helps with initial setup and configuration

set -e

echo "🚀 WhatsApp Personal Assistant Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) is installed ✓"
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_status "npm $(npm --version) is installed ✓"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    npm install
    print_status "Dependencies installed ✓"
}

# Setup environment configuration
setup_environment() {
    print_step "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        echo "Please select your environment:"
        echo "1) Development (SQLite)"
        echo "2) Production (PostgreSQL)"
        read -p "Enter your choice (1-2): " env_choice
        
        case $env_choice in
            1)
                cp .env.development .env
                print_status "Development environment configured ✓"
                ;;
            2)
                cp .env.production .env
                print_warning "Production environment configured. Please update database credentials in .env"
                ;;
            *)
                print_error "Invalid choice. Using development environment."
                cp .env.development .env
                ;;
        esac
    else
        print_status "Environment file already exists ✓"
    fi
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    mkdir -p data logs sessions
    print_status "Directories created ✓"
}

# Build the application
build_application() {
    print_step "Building the application..."
    npm run build
    print_status "Application built successfully ✓"
}

# Setup database (PostgreSQL)
setup_postgresql() {
    print_step "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Skipping database setup."
        return
    fi
    
    read -p "Do you want to setup PostgreSQL database? (y/n): " setup_db
    if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
        read -p "Enter PostgreSQL username (default: postgres): " pg_user
        pg_user=${pg_user:-postgres}
        
        read -p "Enter database name (default: whatsapp_assistant): " db_name
        db_name=${db_name:-whatsapp_assistant}
        
        read -p "Enter database user (default: assistant_user): " db_user
        db_user=${db_user:-assistant_user}
        
        read -s -p "Enter database password: " db_password
        echo
        
        # Create database and user
        sudo -u $pg_user psql -c "CREATE DATABASE $db_name;" 2>/dev/null || true
        sudo -u $pg_user psql -c "CREATE USER $db_user WITH PASSWORD '$db_password';" 2>/dev/null || true
        sudo -u $pg_user psql -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;" 2>/dev/null || true
        
        # Run initialization script
        PGPASSWORD=$db_password psql -h localhost -U $db_user -d $db_name -f init.sql
        
        print_status "PostgreSQL database setup completed ✓"
        
        # Update .env file
        sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" .env
        sed -i "s/DB_USER=.*/DB_USER=$db_user/" .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
    fi
}

# Generate API key
generate_api_key() {
    print_step "Generating API key..."
    
    if command -v openssl &> /dev/null; then
        API_KEY=$(openssl rand -hex 32)
        JWT_SECRET=$(openssl rand -hex 64)
        
        sed -i "s/API_KEY=.*/API_KEY=$API_KEY/" .env
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        
        print_status "API key and JWT secret generated ✓"
        print_warning "Your API key: $API_KEY"
        print_warning "Please save this key securely!"
    else
        print_warning "OpenSSL not found. Please manually update API_KEY and JWT_SECRET in .env"
    fi
}

# Setup PM2 (optional)
setup_pm2() {
    read -p "Do you want to install PM2 for process management? (y/n): " install_pm2
    if [ "$install_pm2" = "y" ] || [ "$install_pm2" = "Y" ]; then
        print_step "Installing PM2..."
        npm install -g pm2
        print_status "PM2 installed ✓"
    fi
}

# Setup Docker (optional)
setup_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        read -p "Do you want to setup Docker configuration? (y/n): " setup_docker
        if [ "$setup_docker" = "y" ] || [ "$setup_docker" = "Y" ]; then
            print_step "Docker is available. You can use:"
            echo "  - docker-compose up -d (for production)"
            echo "  - docker-compose -f docker-compose.yml -f docker-compose.dev.yml up (for development)"
            print_status "Docker setup information provided ✓"
        fi
    else
        print_warning "Docker not found. Install Docker and Docker Compose for containerized deployment."
    fi
}

# Final instructions
show_final_instructions() {
    echo
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo
    echo "Next steps:"
    echo "1. Review and update .env file with your specific configuration"
    echo "2. Start the application:"
    echo "   - Development: npm run dev"
    echo "   - Production: npm start"
    echo "   - With PM2: npm run pm2:start"
    echo "   - With Docker: docker-compose up -d"
    echo
    echo "3. Scan the QR code with WhatsApp Web to connect"
    echo "4. Access the API at http://localhost:3000/api"
    echo "5. Check health at http://localhost:3000/health"
    echo
    echo "📚 Documentation:"
    echo "   - API: docs/API.md"
    echo "   - Deployment: docs/DEPLOYMENT.md"
    echo "   - Troubleshooting: docs/TROUBLESHOOTING.md"
    echo
    print_status "Happy messaging! 🚀"
}

# Main setup flow
main() {
    check_nodejs
    check_npm
    install_dependencies
    setup_environment
    create_directories
    build_application
    
    # Check environment type for additional setup
    if grep -q "DB_TYPE=postgresql" .env; then
        setup_postgresql
    fi
    
    generate_api_key
    setup_pm2
    setup_docker
    show_final_instructions
}

# Run main function
main "$@"