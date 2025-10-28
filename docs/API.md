# API Documentation

The WhatsApp Personal Assistant provides a RESTful API for managing contacts, messages, and system configuration.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [System](#system)
  - [Messages](#messages)
  - [Contacts](#contacts)
  - [Configuration](#configuration)

## Authentication

All API requests require authentication using an API key in the header:

```http
X-API-Key: your_api_key_here
```

## Base URL

```
http://localhost:3000/api
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## Error Handling

Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Endpoints

### System

#### Get System Status

```http
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "version": "1.0.0",
    "database": "connected",
    "whatsapp": "connected",
    "memory": {
      "used": "45.2 MB",
      "total": "512 MB"
    }
  }
}
```

#### Get Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected",
  "whatsapp": "connected"
}
```

### Messages

#### Get Messages

```http
GET /api/messages
```

**Query Parameters:**
- `contactId` (optional) - Filter by contact ID
- `direction` (optional) - Filter by direction (`incoming`, `outgoing`)
- `limit` (optional) - Number of messages to return (default: 50)
- `offset` (optional) - Number of messages to skip (default: 0)
- `startDate` (optional) - Start date filter (ISO 8601)
- `endDate` (optional) - End date filter (ISO 8601)

**Example:**
```http
GET /api/messages?contactId=1234567890@c.us&limit=20&direction=incoming
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid-here",
        "contactId": "1234567890@c.us",
        "content": "Hello, how are you?",
        "direction": "incoming",
        "timestamp": "2023-12-01T10:00:00.000Z",
        "isUrgent": false,
        "metadata": {}
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Get Message by ID

```http
GET /api/messages/:messageId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "contactId": "1234567890@c.us",
    "content": "Hello, how are you?",
    "direction": "incoming",
    "timestamp": "2023-12-01T10:00:00.000Z",
    "isUrgent": false,
    "metadata": {}
  }
}
```

#### Send Message

```http
POST /api/messages
```

**Request Body:**
```json
{
  "contactId": "1234567890@c.us",
  "content": "Hello! This is an automated response."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "contactId": "1234567890@c.us",
    "content": "Hello! This is an automated response.",
    "direction": "outgoing",
    "timestamp": "2023-12-01T10:00:00.000Z",
    "status": "sent"
  }
}
```

#### Search Messages

```http
GET /api/messages/search
```

**Query Parameters:**
- `q` (required) - Search query
- `contactId` (optional) - Filter by contact
- `limit` (optional) - Number of results (default: 20)

**Example:**
```http
GET /api/messages/search?q=hello&contactId=1234567890@c.us
```

### Contacts

#### Get All Contacts

```http
GET /api/contacts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "uuid-here",
        "phoneNumber": "+1234567890",
        "name": "John Doe",
        "autoResponseEnabled": true,
        "autoResponseDelay": 300,
        "autoResponseMessage": "Thanks for your message!",
        "isUrgentContact": false,
        "configuration": {}
      }
    ]
  }
}
```

#### Get Contact by ID

```http
GET /api/contacts/:contactId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "autoResponseEnabled": true,
    "autoResponseDelay": 300,
    "autoResponseMessage": "Thanks for your message!",
    "isUrgentContact": false,
    "configuration": {}
  }
}
```

#### Create Contact

```http
POST /api/contacts
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "name": "John Doe",
  "autoResponseEnabled": true,
  "autoResponseDelay": 300,
  "autoResponseMessage": "Thanks for your message!",
  "isUrgentContact": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "phoneNumber": "+1234567890",
    "name": "John Doe",
    "autoResponseEnabled": true,
    "autoResponseDelay": 300,
    "autoResponseMessage": "Thanks for your message!",
    "isUrgentContact": false,
    "configuration": {}
  }
}
```

#### Update Contact

```http
PUT /api/contacts/:contactId
```

**Request Body:**
```json
{
  "name": "John Smith",
  "autoResponseEnabled": false,
  "autoResponseDelay": 600,
  "autoResponseMessage": "Updated auto-response message"
}
```

#### Delete Contact

```http
DELETE /api/contacts/:contactId
```

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### Configuration

#### Get System Configuration

```http
GET /api/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "autoResponseEnabled": true,
    "defaultResponseDelay": 300,
    "maxResponseDelay": 3600,
    "urgentNotificationsEnabled": true,
    "defaultAutoResponseMessage": "Thanks for your message. I'll respond soon."
  }
}
```

#### Update System Configuration

```http
PUT /api/config
```

**Request Body:**
```json
{
  "autoResponseEnabled": true,
  "defaultResponseDelay": 600,
  "maxResponseDelay": 7200,
  "urgentNotificationsEnabled": false,
  "defaultAutoResponseMessage": "Updated default message"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "autoResponseEnabled": true,
    "defaultResponseDelay": 600,
    "maxResponseDelay": 7200,
    "urgentNotificationsEnabled": false,
    "defaultAutoResponseMessage": "Updated default message"
  }
}
```

## Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
});

// Get all messages
async function getMessages() {
  try {
    const response = await api.get('/messages');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Send a message
async function sendMessage(contactId, content) {
  try {
    const response = await api.post('/messages', {
      contactId,
      content
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Create a contact
async function createContact(contactData) {
  try {
    const response = await api.post('/contacts', contactData);
    console.log('Contact created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python

```python
import requests

class WhatsAppAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def get_messages(self, contact_id=None, limit=50):
        params = {'limit': limit}
        if contact_id:
            params['contactId'] = contact_id
        
        response = requests.get(
            f'{self.base_url}/messages',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def send_message(self, contact_id, content):
        data = {
            'contactId': contact_id,
            'content': content
        }
        response = requests.post(
            f'{self.base_url}/messages',
            headers=self.headers,
            json=data
        )
        return response.json()

# Usage
api = WhatsAppAPI('http://localhost:3000/api', 'your_api_key_here')
messages = api.get_messages()
print(messages)
```

### cURL

```bash
# Get system status
curl -H "X-API-Key: your_api_key_here" \
     http://localhost:3000/api/status

# Get messages
curl -H "X-API-Key: your_api_key_here" \
     "http://localhost:3000/api/messages?limit=10"

# Send message
curl -X POST \
     -H "X-API-Key: your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"contactId":"1234567890@c.us","content":"Hello!"}' \
     http://localhost:3000/api/messages

# Create contact
curl -X POST \
     -H "X-API-Key: your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"+1234567890","name":"John Doe","autoResponseEnabled":true}' \
     http://localhost:3000/api/contacts
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Headers included in response**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Webhooks

Configure webhooks for real-time notifications:

```bash
# Set webhook URL in environment
NOTIFICATION_WEBHOOK_URL=https://your-domain.com/webhook
```

**Webhook payload example:**
```json
{
  "event": "message_received",
  "data": {
    "messageId": "uuid-here",
    "contactId": "1234567890@c.us",
    "content": "Hello!",
    "timestamp": "2023-12-01T10:00:00.000Z",
    "isUrgent": false
  }
}
```