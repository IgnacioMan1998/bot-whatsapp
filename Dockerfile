# Multi-stage build for WhatsApp Personal Assistant
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies for WhatsApp Web
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S whatsapp -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=whatsapp:nodejs /app/dist ./dist
COPY --from=builder --chown=whatsapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=whatsapp:nodejs /app/package*.json ./
COPY --chown=whatsapp:nodejs config/ ./config/

# Create necessary directories
RUN mkdir -p logs data sessions && \
    chown -R whatsapp:nodejs logs data sessions

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Switch to non-root user
USER whatsapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]