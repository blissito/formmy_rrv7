# Usamos imagen más liviana
FROM node:20-alpine AS base
RUN apk update && apk add --no-cache \
    openssl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Stage 1: Instalar dependencias (cacheable)
FROM base AS deps
WORKDIR /app
# Copiamos solo archivos de dependencias para mejor cache
COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Cache mount para npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile

# Stage 2: Build aplicación
FROM base AS builder
WORKDIR /app
# Copiamos dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generar Prisma client
RUN npx prisma generate
# Build optimizado
RUN npm run build && npm prune --omit=dev

# Stage 3: Imagen final de producción
FROM base AS runner
WORKDIR /app
# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/content ./content

# Cambiar a usuario no-root
USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]