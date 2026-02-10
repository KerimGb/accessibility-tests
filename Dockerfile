# Use Node.js LTS
FROM node:20-bookworm-slim

# Install Playwright Chromium dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies and Chromium
RUN npm ci --omit=dev && npx playwright install chromium

# Copy application
COPY . .

# Create reports directory
RUN mkdir -p reports

EXPOSE 3456

ENV PORT=3456
CMD ["node", "server.js"]
