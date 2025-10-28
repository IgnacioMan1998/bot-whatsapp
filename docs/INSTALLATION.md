# Installation Guide

This guide provides step-by-step instructions for installing the WhatsApp Personal Assistant.

## Quick Start

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-personal-assistant

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The setup script will:
- Check system requirements
- Install dependencies
- Configure environment
- Create necessary directories
- Build the application
- Generate API keys
- Setup database (optional)

### Manual Installation

If you prefer manual installation or the automated script doesn't work:

## Prerequisites

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Database**: PostgreSQL 12+ (production) or SQLite (development)
- **Git**: For cloning the repository

### System Requirements

- **Memory**: Minimum 512MB RAM, recommended 1GB+
- **Storage**: 500MB free space
- **OS**: Linux, macOS, or Windows
- **Network**: Internet connection for WhatsApp Web

## Step-by-Step Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd whatsapp-personal-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Choose your environment and copy the appropriate template:

#### Development (SQLite)
```bash
cp .env.development .env
```

#### Production (PostgreSQL)
```bash
cp .env.production .env
```

### 4. Configure Environment Variables

Edit the `.env` file with your settings:

```bash
nano .env
```

**Required variables to update:**
- `API_KEY`: Generate a secure API key
- `JWT_SECRET`: Generate a secure JWT secret
- Database credentials (if using PostgreSQL)

**Generate secure keys:**
```bash
# API Key
openssl rand -hex 32

# JWT Secret
openssl rand -hex 64
```

### 5. Create Directories

```bash
mkdir -p data logs sessions
```

### 6. Database Setup

#### For SQLite (Development)
No additional setup required. Database will be created automatically.

#### For PostgreSQL (Production)

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib

# macOS
brew install postgresql
```

**Create database:**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE whatsapp_assistant;
CREATE USER assistant_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_assistant TO assistant_user;
\q
```

**Initialize database:**
```bash
psql -h localhost -U assistant_user -d whatsapp_assistant -f init.sql
```

### 7. Build Application

```bash
npm run build
```

### 8. Start Application

```bash
# Development
npm run dev

# Production
npm start
```

## Installation Methods

### Method 1: Docker (Easiest)

**Prerequisites:**
- Docker
- Docker Compose

**Steps:**
```bash
# Clone repository
git clone <repository-url>
cd whatsapp-personal-assistant

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d
```

### Method 2: PM2 (Process Management)

**Install PM2:**
```bash
npm install -g pm2
```

**Deploy:**
```bash
# Install and build
npm install
npm run build

# Start with PM2
npm run pm2:start

# Monitor
pm2 monit
```

### Method 3: Systemd Service (Linux)

**Create service user:**
```bash
sudo useradd --system --shell /bin/false whatsapp
```

**Install application:**
```bash
# Create directory
sudo mkdir -p /opt/whatsapp-assistant
sudo chown whatsapp:whatsapp /opt/whatsapp-assistant

# Copy files
sudo cp -r dist/ /opt/whatsapp-assistant/
sudo cp -r node_modules/ /opt/whatsapp-assistant/
sudo cp package.json /opt/whatsapp-assistant/
sudo cp .env /opt/whatsapp-assistant/

# Set permissions
sudo chown -R whatsapp:whatsapp /opt/whatsapp-assistant
```

**Install service:**
```bash
sudo cp whatsapp-assistant.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-assistant
sudo systemctl start whatsapp-assistant
```

## Platform-Specific Instructions

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y build-essential

# Install PostgreSQL (optional)
sudo apt install postgresql postgresql-contrib

# Continue with general installation steps
```

### CentOS/RHEL

```bash
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install build tools
sudo yum groupinstall "Development Tools"

# Install PostgreSQL (optional)
sudo yum install postgresql-server postgresql-contrib

# Continue with general installation steps
```

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install PostgreSQL (optional)
brew install postgresql

# Continue with general installation steps
```

### Windows

1. **Install Node.js:**
   - Download from [nodejs.org](https://nodejs.org/)
   - Run installer and follow instructions

2. **Install Git:**
   - Download from [git-scm.com](https://git-scm.com/)

3. **Install PostgreSQL (optional):**
   - Download from [postgresql.org](https://www.postgresql.org/download/windows/)

4. **Use PowerShell or Command Prompt:**
   ```cmd
   # Clone repository
   git clone <repository-url>
   cd whatsapp-personal-assistant

   # Install dependencies
   npm install

   # Configure environment
   copy .env.example .env
   # Edit .env with notepad

   # Build and start
   npm run build
   npm start
   ```

## Verification

### 1. Check Application Status

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "whatsapp": "disconnected"
}
```

### 2. Check Logs

```bash
# Application logs
tail -f logs/combined.log

# PM2 logs (if using PM2)
pm2 logs whatsapp-assistant

# Docker logs (if using Docker)
docker-compose logs -f

# Systemd logs (if using systemd)
sudo journalctl -u whatsapp-assistant -f
```

### 3. Connect WhatsApp

1. Start the application
2. Look for QR code in console/logs
3. Scan with WhatsApp Web
4. Wait for "WhatsApp connected" message

## Troubleshooting Installation

### Common Issues

**Node.js version error:**
```bash
# Check version
node --version

# Should be 18.0.0 or higher
```

**Permission errors:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod -R 755 data logs sessions
```

**Database connection failed:**
```bash
# Test PostgreSQL connection
psql -h localhost -U assistant_user -d whatsapp_assistant -c "SELECT 1;"

# Check PostgreSQL service
sudo systemctl status postgresql
```

**Port already in use:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process or change PORT in .env
```

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for missing build tools
npm install -g node-gyp
```

### Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review application logs
3. Verify all prerequisites are installed
4. Check environment configuration
5. Create an issue with error details

## Next Steps

After successful installation:

1. **Configure contacts** using CLI or API
2. **Test auto-responses** with a test message
3. **Setup monitoring** and alerts
4. **Configure backups** for important data
5. **Review security settings**

See the [Deployment Guide](DEPLOYMENT.md) for production deployment best practices.