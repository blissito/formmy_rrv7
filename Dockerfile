FROM node:20-alpine

# Install OpenSSL and other essentials for Prisma
RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --frozen-lockfile

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