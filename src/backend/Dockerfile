# src/backend/Dockerfile

# Use Node.js LTS version
FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache --virtual .build-deps python3 make g++

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Remove build dependencies
RUN apk del .build-deps

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create necessary directories and set permissions
RUN mkdir -p logs && \
    chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start application
CMD ["node", "server.js"]