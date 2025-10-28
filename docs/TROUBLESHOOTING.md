# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the WhatsApp Personal Assistant.

## Table of Contents

- [Common Issues](#common-issues)
- [WhatsApp Connection Issues](#whatsapp-connection-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Docker Issues](#docker-issues)
- [API Issues](#api-issues)
- [Logging and Debugging](#logging-and-debugging)

## Common Issues

### Application Won't Start

**Symptoms:**
- Application exits immediately
- "Failed to start application" error

**Solutions:**

1. **Check environment variables:**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   ```

2. **Check database connection:**
   ```bash
   # For PostgreSQL
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"
   
   # For SQLite, check if directory exists
   ls -la data/
   ```

3. **Check port availability:**
   ```bash
   netstat -tulpn | grep :3000
   lsof -i :3000
   ```

4. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

### Permission Denied Errors

**Symptoms:**
- Cannot write to data/logs/sessions directories
- EACCES errors

**Solutions:**

1. **Fix directory permissions:**
   ```bash
   mkdir -p data logs sessions
   chmod 755 data logs sessions
   chown -R $USER:$USER data logs sessions
   ```

2. **For systemd deployment:**
   ```bash
   sudo chown -R whatsapp:whatsapp /opt/whatsapp-assistant
   sudo chmod -R 755 /opt/whatsapp-assistant
   ```

## WhatsApp Connection Issues

### QR Code Not Displaying

**Symptoms:**
- No QR code shown in console
- WhatsApp Web connection fails

**Solutions:**

1. **Check headless mode:**
   ```bash
   # In .env file
   WHATSAPP_HEADLESS=false
   ```

2. **Clear session data:**
   ```bash
   rm -rf sessions/*
   ```

3. **Check Puppeteer dependencies:**
   ```bash
   # Install missing dependencies (Ubuntu/Debian)
   sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   ```

### WhatsApp Session Expired

**Symptoms:**
- "Session expired" messages
- Frequent re-authentication requests

**Solutions:**

1. **Clear and recreate session:**
   ```bash
   rm -rf sessions/*
   # Restart application and scan QR code again
   ```

2. **Check session persistence:**
   ```bash
   # Ensure sessions directory is writable
   ls -la sessions/
   ```

### Message Sending Fails

**Symptoms:**
- Messages not being sent
- "Failed to send message" errors

**Solutions:**

1. **Check WhatsApp Web status:**
   ```bash
   # Check application logs
   tail -f logs/combined.log
   ```

2. **Verify contact format:**
   ```bash
   # Phone numbers should include country code
   # Example: +1234567890@c.us
   ```

3. **Rate limiting:**
   ```bash
   # Check if hitting WhatsApp rate limits
   # Reduce message frequency
   ```

## Database Issues

### PostgreSQL Connection Failed

**Symptoms:**
- "Connection refused" errors
- Database timeout errors

**Solutions:**

1. **Check PostgreSQL service:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify connection parameters:**
   ```bash
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
   ```

3. **Check pg_hba.conf:**
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   # Add: host all all 127.0.0.1/32 md5
   sudo systemctl reload postgresql
   ```

### SQLite Database Locked

**Symptoms:**
- "Database is locked" errors
- SQLITE_BUSY errors

**Solutions:**

1. **Check for zombie processes:**
   ```bash
   ps aux | grep whatsapp
   kill -9 <pid>
   ```

2. **Remove lock files:**
   ```bash
   rm -f data/whatsapp.db-wal data/whatsapp.db-shm
   ```

3. **Check file permissions:**
   ```bash
   chmod 644 data/whatsapp.db
   ```

### Migration Errors

**Symptoms:**
- Database schema errors
- Missing tables/columns

**Solutions:**

1. **Run initialization script:**
   ```bash
   # For PostgreSQL
   psql -h localhost -U assistant_user -d whatsapp_assistant -f init.sql
   
   # For SQLite, delete and recreate
   rm data/whatsapp.db
   # Restart application
   ```

## Performance Issues

### High Memory Usage

**Symptoms:**
- Application consuming excessive RAM
- Out of memory errors

**Solutions:**

1. **Check Node.js memory limits:**
   ```bash
   # Increase memory limit
   node --max-old-space-size=2048 dist/index.js
   ```

2. **Monitor memory usage:**
   ```bash
   # PM2 monitoring
   pm2 monit
   
   # System monitoring
   htop
   ```

3. **Check for memory leaks:**
   ```bash
   # Enable heap profiling
   node --inspect dist/index.js
   ```

### Slow Response Times

**Symptoms:**
- API endpoints responding slowly
- Message processing delays

**Solutions:**

1. **Check database performance:**
   ```sql
   -- PostgreSQL query analysis
   EXPLAIN ANALYZE SELECT * FROM messages WHERE contact_id = 'xxx';
   ```

2. **Monitor database connections:**
   ```bash
   # Check active connections
   ps aux | grep postgres
   ```

3. **Optimize queries:**
   ```sql
   -- Add missing indexes
   CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
   ```

## Docker Issues

### Container Won't Start

**Symptoms:**
- Container exits immediately
- Build failures

**Solutions:**

1. **Check Docker logs:**
   ```bash
   docker-compose logs whatsapp-assistant
   docker logs <container_id>
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

3. **Check resource limits:**
   ```bash
   docker stats
   ```

### Permission Issues in Container

**Symptoms:**
- Cannot write to mounted volumes
- Permission denied errors

**Solutions:**

1. **Fix volume permissions:**
   ```bash
   sudo chown -R 1001:1001 data logs sessions
   ```

2. **Check Docker user mapping:**
   ```bash
   # In Dockerfile, ensure user ID matches
   USER whatsapp
   ```

## API Issues

### Authentication Failures

**Symptoms:**
- 401 Unauthorized errors
- Invalid API key messages

**Solutions:**

1. **Check API key configuration:**
   ```bash
   # Verify API_KEY in .env
   grep API_KEY .env
   ```

2. **Test API endpoint:**
   ```bash
   curl -H "X-API-Key: your_api_key" http://localhost:3000/api/status
   ```

### Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- API calls being blocked

**Solutions:**

1. **Adjust rate limits:**
   ```bash
   # In .env file
   RATE_LIMIT_MAX_REQUESTS=200
   RATE_LIMIT_WINDOW_MS=900000
   ```

2. **Check rate limit headers:**
   ```bash
   curl -I http://localhost:3000/api/messages
   ```

## Logging and Debugging

### Enable Debug Logging

```bash
# Set log level to debug
LOG_LEVEL=debug

# Enable console logging
LOG_CONSOLE_ENABLED=true
```

### Check Application Logs

```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# PM2 logs
pm2 logs whatsapp-assistant

# Docker logs
docker-compose logs -f

# Systemd logs
sudo journalctl -u whatsapp-assistant -f
```

### Debug Mode

```bash
# Start with debugging
npm run dev:debug

# Connect debugger to port 9229
```

### Health Check

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2023-...",
  "uptime": 123.45,
  "database": "connected",
  "whatsapp": "connected"
}
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs** for specific error messages
2. **Search existing issues** in the project repository
3. **Create a new issue** with:
   - Error messages
   - Environment details
   - Steps to reproduce
   - Log excerpts

## Emergency Recovery

### Complete Reset

```bash
# Stop all services
pm2 stop all
docker-compose down

# Backup important data
cp -r data data_backup
cp -r sessions sessions_backup

# Clean slate
rm -rf data/* sessions/* logs/*

# Restart
npm run build
npm start
```

### Database Recovery

```bash
# PostgreSQL
pg_dump -h localhost -U assistant_user whatsapp_assistant > recovery.sql
dropdb -h localhost -U assistant_user whatsapp_assistant
createdb -h localhost -U assistant_user whatsapp_assistant
psql -h localhost -U assistant_user -d whatsapp_assistant -f recovery.sql

# SQLite
cp data_backup/whatsapp.db data/whatsapp.db
```