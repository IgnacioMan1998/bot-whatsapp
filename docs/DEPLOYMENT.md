# Deployment Guide

This guide covers different deployment options for the WhatsApp Personal Assistant.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Docker Deployment](#docker-deployment)
  - [PM2 Deployment](#pm2-deployment)
  - [Systemd Service](#systemd-service)
  - [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 12+ (for production) or SQLite (for development)
- PM2 (optional, for process management)
- Docker & Docker Compose (optional, for containerized deployment)

## Environment Configuration

1. Copy the appropriate environment template:
   ```bash
   # For development
   cp .env.development .env
   
   # For production
   cp .env.production .env
   ```

2. Edit the `.env` file with your specific configuration:
   - Database credentials
   - API keys and secrets
   - WhatsApp session settings
   - Notification webhooks

## Deployment Options

### Docker Deployment

#### Production with PostgreSQL

1. **Configure environment variables in docker-compose.yml**
2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Check logs:**
   ```bash
   docker-compose logs -f whatsapp-assistant
   ```

#### Development with SQLite

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### PM2 Deployment

1. **Install dependencies:**
   ```bash
   npm install
   npm run build
   ```

2. **Start with PM2:**
   ```bash
   npm run pm2:start
   ```

3. **Monitor:**
   ```bash
   npm run pm2:logs
   pm2 monit
   ```

4. **Production deployment:**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

### Systemd Service

1. **Copy service file:**
   ```bash
   sudo cp whatsapp-assistant.service /etc/systemd/system/
   ```

2. **Create application directory:**
   ```bash
   sudo mkdir -p /opt/whatsapp-assistant
   sudo chown whatsapp:whatsapp /opt/whatsapp-assistant
   ```

3. **Deploy application:**
   ```bash
   # Copy built application to /opt/whatsapp-assistant
   sudo cp -r dist/ /opt/whatsapp-assistant/
   sudo cp -r node_modules/ /opt/whatsapp-assistant/
   sudo cp package.json /opt/whatsapp-assistant/
   sudo cp .env.production /opt/whatsapp-assistant/.env
   ```

4. **Enable and start service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable whatsapp-assistant
   sudo systemctl start whatsapp-assistant
   ```

5. **Check status:**
   ```bash
   sudo systemctl status whatsapp-assistant
   sudo journalctl -u whatsapp-assistant -f
   ```

### Manual Deployment

1. **Install dependencies:**
   ```bash
   npm install --production
   ```

2. **Build application:**
   ```bash
   npm run build
   ```

3. **Start application:**
   ```bash
   npm start
   ```

## Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # CentOS/RHEL
   sudo yum install postgresql-server postgresql-contrib
   ```

2. **Create database and user:**
   ```sql
   sudo -u postgres psql
   CREATE DATABASE whatsapp_assistant;
   CREATE USER assistant_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE whatsapp_assistant TO assistant_user;
   \q
   ```

3. **Run initialization script:**
   ```bash
   psql -h localhost -U assistant_user -d whatsapp_assistant -f init.sql
   ```

### SQLite Setup

SQLite databases are created automatically when the application starts.

## SSL/HTTPS Setup

### Using Nginx as Reverse Proxy

1. **Install Nginx:**
   ```bash
   sudo apt install nginx
   ```

2. **Create Nginx configuration:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable configuration:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/whatsapp-assistant /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Monitoring

### Health Checks

The application provides a health check endpoint:
```bash
curl http://localhost:3000/health
```

### PM2 Monitoring

```bash
pm2 monit
pm2 logs whatsapp-assistant
```

### Docker Monitoring

```bash
docker-compose logs -f
docker stats
```

### System Monitoring

```bash
# Check service status
sudo systemctl status whatsapp-assistant

# View logs
sudo journalctl -u whatsapp-assistant -f

# Check resource usage
htop
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Security Considerations

1. **Change default passwords and API keys**
2. **Use HTTPS in production**
3. **Configure firewall rules**
4. **Regular security updates**
5. **Monitor logs for suspicious activity**
6. **Use strong authentication for database access**

## Backup and Recovery

1. **Database backups:**
   ```bash
   # PostgreSQL
   pg_dump -h localhost -U assistant_user whatsapp_assistant > backup.sql
   
   # SQLite
   cp data/whatsapp.db backup/whatsapp_$(date +%Y%m%d).db
   ```

2. **Session data backup:**
   ```bash
   tar -czf sessions_backup.tar.gz sessions/
   ```

3. **Configuration backup:**
   ```bash
   cp .env config_backup.env
   ```