# Frequently Asked Questions (FAQ)

## General Questions

### What is WhatsApp Personal Assistant?

WhatsApp Personal Assistant is an automated system that responds to WhatsApp messages with customizable delays and messages per contact. It uses WhatsApp Web to connect and provides a REST API for management.

### Is this legal to use?

This tool uses WhatsApp Web, which is an official WhatsApp interface. However, automated messaging may violate WhatsApp's Terms of Service. Use at your own risk and ensure compliance with local laws and WhatsApp's policies.

### Does this work with WhatsApp Business?

Yes, it works with both regular WhatsApp and WhatsApp Business accounts through WhatsApp Web.

### Can I use this on multiple devices?

No, WhatsApp Web can only be active on one device at a time per phone number. You'll need to disconnect other WhatsApp Web sessions.

## Technical Questions

### What databases are supported?

- **SQLite**: For development and small deployments
- **PostgreSQL**: For production and larger deployments

### Can I run this on a VPS/cloud server?

Yes, the application is designed for server deployment. It includes Docker support and systemd service files for easy deployment.

### Does it require a GUI/desktop environment?

No, it can run headless on servers. Set `WHATSAPP_HEADLESS=true` in your environment configuration.

### How much resources does it need?

**Minimum requirements:**
- 512MB RAM
- 1 CPU core
- 500MB storage

**Recommended:**
- 1GB+ RAM
- 2+ CPU cores
- 2GB+ storage

## Setup and Configuration

### How do I get the QR code on a headless server?

The QR code will be displayed in the console/logs even in headless mode. You can also:

1. Temporarily set `WHATSAPP_HEADLESS=false`
2. Use SSH with X11 forwarding
3. Check the application logs for the QR code

### Can I change the auto-response delay?

Yes, you can set different delays per contact:

```bash
# Via CLI
npm run cli contact update --phone "+1234567890" --delay 600

# Via API
curl -X PUT http://localhost:3000/api/contacts/contact-id \
  -H "X-API-Key: your-key" \
  -d '{"autoResponseDelay": 600}'
```

### How do I backup my data?

**Database backup:**
```bash
# PostgreSQL
pg_dump -h localhost -U assistant_user whatsapp_assistant > backup.sql

# SQLite
cp data/whatsapp.db backup/
```

**Session backup:**
```bash
tar -czf sessions_backup.tar.gz sessions/
```

### Can I customize auto-response messages per contact?

Yes, each contact can have a custom auto-response message:

```bash
# Via CLI
npm run cli contact update --phone "+1234567890" --message "Custom message"

# Via API
curl -X PUT http://localhost:3000/api/contacts/contact-id \
  -H "X-API-Key: your-key" \
  -d '{"autoResponseMessage": "Custom message"}'
```

## WhatsApp Integration

### Why does WhatsApp keep disconnecting?

Common causes:
- Unstable internet connection
- WhatsApp Web session expired
- Multiple WhatsApp Web sessions active
- WhatsApp account restrictions

**Solutions:**
- Ensure stable internet
- Clear sessions and reconnect
- Close other WhatsApp Web sessions
- Check WhatsApp account status

### Can I send media files (images, documents)?

Currently, the system supports text messages only. Media support may be added in future versions.

### How do I handle group messages?

**IMPORTANT: The system NEVER sends auto-responses to group messages.** This is a built-in security feature that cannot be disabled.

Group messages are:
- Received and logged (if enabled)
- Available via API for reading
- Never trigger auto-responses
- Filtered out at multiple system levels

This prevents spam and maintains group chat etiquette.

### What happens if I receive a message while offline?

Messages received while the system is offline will be processed when it comes back online. However, auto-response timers won't start until the system is running.

## API and Development

### How do I authenticate API requests?

All API requests require an API key in the header:
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/status
```

### Can I integrate this with other systems?

Yes, the REST API allows integration with:
- CRM systems
- Chatbots
- Notification systems
- Custom applications

### Is there a webhook system?

Yes, you can configure webhooks for real-time notifications:
```bash
# Set in .env
NOTIFICATION_WEBHOOK_URL=https://your-domain.com/webhook
```

### How do I add custom business logic?

The application uses Clean Architecture, making it easy to extend:
1. Add new use cases in `src/application/use-cases/`
2. Implement domain services in `src/domain/services/`
3. Create new API endpoints in `src/presentation/controllers/`

## Deployment and Operations

### Can I use this with Docker?

Yes, Docker support is included:
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### How do I monitor the application?

Several monitoring options:
- Health check endpoint: `/health`
- Application logs in `logs/` directory
- PM2 monitoring: `pm2 monit`
- System metrics via API: `/api/status`

### How do I update to a new version?

**Docker deployment:**
```bash
docker-compose pull
docker-compose up -d
```

**Manual deployment:**
```bash
git pull
npm install
npm run build
npm restart  # or pm2 restart
```

### Can I run multiple instances?

Yes, but each instance needs:
- Different port numbers
- Separate WhatsApp accounts
- Separate database schemas/files
- Different session directories

## Troubleshooting

### The application won't start

Check:
1. Node.js version (18+)
2. Environment variables in `.env`
3. Database connectivity
4. Port availability (3000)
5. File permissions

### Messages aren't being sent

Check:
1. WhatsApp connection status
2. Contact phone number format
3. Rate limiting settings
4. Application logs for errors

### High memory usage

Solutions:
1. Increase Node.js memory limit
2. Check for memory leaks
3. Optimize database queries
4. Monitor with `pm2 monit`

### Database errors

Common fixes:
1. Check database credentials
2. Verify database service is running
3. Run initialization script
4. Check file permissions (SQLite)

## Security

### Is my data secure?

The application:
- Stores data locally (not in cloud)
- Uses encrypted database connections
- Requires API key authentication
- Supports HTTPS deployment

### Should I change default passwords?

Yes, always change:
- API keys
- JWT secrets
- Database passwords
- Any default credentials

### Can I use HTTPS?

Yes, use a reverse proxy like Nginx:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## Performance

### How many messages can it handle?

Performance depends on:
- Server resources
- Database type and configuration
- Message complexity
- Network latency

Typical performance:
- SQLite: 100-1000 messages/hour
- PostgreSQL: 1000+ messages/hour

### How do I optimize performance?

1. Use PostgreSQL for production
2. Add database indexes
3. Increase server resources
4. Use connection pooling
5. Monitor and tune queries

## Legal and Compliance

### Is automated messaging legal?

Laws vary by jurisdiction. Consider:
- Local messaging regulations
- WhatsApp Terms of Service
- Privacy laws (GDPR, etc.)
- Business communication rules

### How do I handle privacy?

Best practices:
- Inform contacts about automation
- Provide opt-out mechanisms
- Secure data storage
- Regular data cleanup
- Compliance with privacy laws

### Does this respond to group messages?

**NO - This is a critical security feature.** The system is designed to NEVER respond automatically to group messages to prevent:
- Spam in group chats
- Embarrassing automated responses
- Violation of group etiquette
- Potential account restrictions

The system has multiple layers of protection:
- Message entity validation
- Auto-response service filtering  
- Event handler blocking
- Configuration enforcement

### Can I use this for marketing?

Be careful with marketing messages:
- Check local anti-spam laws
- Obtain proper consent
- Provide unsubscribe options
- Follow WhatsApp policies
- Consider using WhatsApp Business API instead

## Getting Help

### Where can I find more help?

- [Documentation](../README.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [API Documentation](API.md)
- [GitHub Issues](https://github.com/your-repo/issues)

### How do I report bugs?

Create a GitHub issue with:
- Error messages
- Steps to reproduce
- Environment details
- Log excerpts
- Expected vs actual behavior

### Can I contribute to the project?

Yes! See the contributing guidelines in the main README. We welcome:
- Bug fixes
- Feature improvements
- Documentation updates
- Testing help

### Is commercial support available?

This is an open-source project. For commercial support:
- Check if maintainers offer consulting
- Consider hiring developers familiar with the codebase
- Look for community support options