FROM node:20-alpine

# Install OpenSSL and other essentials for Prisma + build tools for LiveKit
RUN apk add --no-cache openssl ca-certificates python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --frozen-lockfile --legacy-peer-deps

# Explicitly install LiveKit native bindings for Alpine (musl)
RUN npm install --no-save --ignore-scripts @livekit/rtc-node-linux-x64-musl || echo "Warning: Could not install musl bindings"

# Copy source code
COPY . .

# Generate Prisma client for MongoDB and build
RUN npx prisma generate
RUN npm run build

# Verify Prisma client was generated correctly
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found"

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]