# Use Node.js as base image for building
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Use Nginx for serving the built app
FROM nginx:1.21-alpine

# Copy custom nginx configuration if needed
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy script to replace environment variables at runtime
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variables for client-side config
ENV REACT_APP_API_URL=https://api.legaldms.example.com
ENV REACT_APP_AUTH_TIMEOUT=3600

# Create non-root user for nginx
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Update permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Security: remove unnecessary files and permissions
RUN rm -rf /usr/share/nginx/html/config.js.template

# Switch to non-root user
USER appuser

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Use custom entrypoint to substitute environment variables
ENTRYPOINT ["docker-entrypoint.sh"]

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]