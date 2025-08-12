FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY . /app/
# COPY ./package.json package-lock.json /app/
WORKDIR /app
# Solo dependencias básicas necesarias
RUN apk update && apk add --no-cache \
    openssl \
    ca-certificates \
    && rm -rf /var/cache/apk/*
# Generar Prisma client
RUN npx prisma generate
# Instalar dependencias de producción
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine
# Solo dependencias básicas para HTTP requests
RUN apk update && apk add --no-cache \
    openssl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

COPY ./package.json package-lock.json /app/
COPY server.js /app/server.js
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# Ya sé, pero ps no se copia
COPY public/sdk/sdk-script.js /app/public/sdk/sdk-script.js
# Copy blog content directory for runtime access
COPY content/ /app/content/
WORKDIR /app
CMD ["npm", "run", "start"]