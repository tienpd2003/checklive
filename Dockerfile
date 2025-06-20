# Use Node.js 18 alpine image
FROM node:18-alpine

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    xvfb \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_OPTIONS="--max-old-space-size=512" \
    DISPLAY=:99

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application with debug info
RUN echo "Starting Next.js build..." && \
    npm run build && \
    echo "Build completed successfully" && \
    ls -la .next/ && \
    echo "BUILD_ID content:" && \
    cat .next/BUILD_ID 2>/dev/null || echo "BUILD_ID not found"

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\n\
export NODE_OPTIONS="--max-old-space-size=512"\n\
export DISPLAY=:99\n\
# Start virtual display for headless browser\n\
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &\n\
# Start the application\n\
exec npm start' > /app/start.sh && chmod +x /app/start.sh

# Set user to non-root for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

# Start the application
CMD ["/app/start.sh"] 