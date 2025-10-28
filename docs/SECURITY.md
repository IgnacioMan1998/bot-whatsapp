# Security Guidelines

## Critical Security Features

### Group Message Protection

**MOST IMPORTANT**: The WhatsApp Personal Assistant has built-in protection against responding to group messages. This is a **non-negotiable security feature** that cannot be disabled.

#### Why This Matters

Responding automatically to group messages can:
- Create spam in group chats
- Lead to embarrassing automated responses
- Violate group chat etiquette
- Result in WhatsApp account restrictions or bans
- Cause social and professional problems

#### How It Works

The system has **multiple layers** of protection:

1. **WhatsApp ID Detection**: Groups have IDs ending in `@g.us`, individuals end in `@c.us`
2. **Message Entity Validation**: `requiresAutoResponse()` returns false for groups
3. **Auto-Response Service**: Explicit check blocks group responses
4. **Event Handler Filtering**: Events for group messages are ignored
5. **Security Logging**: All blocked group responses are logged

#### Code Implementation

```typescript
// In AutoResponseService
if (message.isGroup) {
  console.log(`[SECURITY] Auto-response blocked for group message from ${message.from.value}`);
  return false;
}

// In Message Entity
requiresAutoResponse(): boolean {
  return this._type.isIncoming() && !this._isGroup;
}

// In WhatsApp Adapter
isGroup: message.from.includes('@g.us')
```

#### Verification

You can verify this protection is working by:

1. **Checking logs** for `[SECURITY]` messages
2. **Running tests**: `npm test -- GroupMessageSecurity`
3. **Monitoring API**: Group messages appear in history but never trigger responses

## Authentication & Authorization

### API Key Security

- **Change default API keys** immediately after installation
- **Use strong, random keys**: Minimum 32 characters
- **Rotate keys regularly**: Every 90 days recommended
- **Store securely**: Never commit keys to version control

```bash
# Generate secure API key
openssl rand -hex 32

# Generate JWT secret
openssl rand -hex 64
```

### Environment Variables

Critical variables to secure:

```env
# CHANGE THESE IMMEDIATELY
API_KEY=your_secure_api_key_here
JWT_SECRET=your_secure_jwt_secret_here
DB_PASSWORD=your_secure_db_password_here

# Security settings
BLOCK_GROUP_AUTO_RESPONSES=true
ALLOW_GROUP_PROCESSING=false
```

## Database Security

### PostgreSQL Security

```sql
-- Create dedicated user with limited privileges
CREATE USER assistant_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE whatsapp_assistant TO assistant_user;
GRANT USAGE ON SCHEMA public TO assistant_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO assistant_user;
```

### SQLite Security

```bash
# Set proper file permissions
chmod 600 data/whatsapp.db
chown app_user:app_group data/whatsapp.db
```

## Network Security

### HTTPS Configuration

Always use HTTPS in production:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # Block direct access to app
ufw enable
```

## Application Security

### Rate Limiting

Configure appropriate rate limits:

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window
```

### Input Validation

The application validates:
- Phone number formats
- Message content length
- API request structure
- Configuration parameters

### Logging Security

```env
# Production logging
LOG_LEVEL=warn
LOG_CONSOLE_ENABLED=false
LOG_FILE_ENABLED=true
```

**Never log sensitive data**:
- Full message content (only first 50 chars)
- API keys or passwords
- Personal information

## WhatsApp Security

### Session Management

```bash
# Secure session directory
chmod 700 sessions/
chown app_user:app_group sessions/

# Regular session cleanup
find sessions/ -name "*.json" -mtime +30 -delete
```

### Connection Security

- Use headless mode in production: `WHATSAPP_HEADLESS=true`
- Monitor connection status regularly
- Implement automatic reconnection
- Log all connection events

## Monitoring & Auditing

### Security Monitoring

Monitor these events:
- Failed authentication attempts
- Blocked group message responses
- Unusual message patterns
- Connection failures
- Configuration changes

### Log Analysis

```bash
# Check for security events
grep "\[SECURITY\]" logs/combined.log

# Monitor failed authentications
grep "401\|403" logs/combined.log

# Check for unusual patterns
grep "rate.limit\|blocked\|failed" logs/combined.log
```

### Health Checks

```bash
# Verify security settings
curl -H "X-API-Key: $API_KEY" https://yourdomain.com/api/status

# Check group message blocking
curl -H "X-API-Key: $API_KEY" https://yourdomain.com/health
```

## Incident Response

### If Group Response Occurs

If the system somehow responds to a group (should be impossible):

1. **Immediately stop the application**
2. **Check logs** for the cause
3. **Verify code integrity**
4. **Review recent changes**
5. **Test security measures**
6. **Report the incident**

### Security Breach Response

1. **Isolate the system**
2. **Change all credentials**
3. **Review access logs**
4. **Check for data compromise**
5. **Update security measures**
6. **Document the incident**

## Compliance

### Data Protection

- **Minimize data collection**: Only store necessary message metadata
- **Encrypt sensitive data**: Use database encryption
- **Regular cleanup**: Implement data retention policies
- **Access controls**: Limit who can access the system

### WhatsApp Terms of Service

- **Review regularly**: WhatsApp ToS changes frequently
- **Avoid automation abuse**: Don't send excessive messages
- **Respect user privacy**: Don't store unnecessary data
- **Use responsibly**: Follow platform guidelines

## Security Checklist

### Installation Security

- [ ] Changed default API keys
- [ ] Set strong database passwords
- [ ] Configured HTTPS
- [ ] Set up firewall rules
- [ ] Secured file permissions
- [ ] Enabled security logging

### Runtime Security

- [ ] Group message blocking verified
- [ ] Rate limiting configured
- [ ] Authentication working
- [ ] Logs being monitored
- [ ] Backups secured
- [ ] Updates applied

### Regular Maintenance

- [ ] Rotate API keys (quarterly)
- [ ] Update dependencies (monthly)
- [ ] Review logs (weekly)
- [ ] Test security measures (monthly)
- [ ] Backup verification (weekly)
- [ ] Security audit (annually)

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public issue
2. **Email** security concerns privately
3. **Include** detailed reproduction steps
4. **Provide** suggested fixes if possible
5. **Allow** time for responsible disclosure

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)