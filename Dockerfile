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

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

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
USER nextjs

# Start the application
CMD ["/app/start.sh"] 