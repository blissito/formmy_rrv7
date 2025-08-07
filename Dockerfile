FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY . /app/
# COPY ./package.json package-lock.json /app/
WORKDIR /app
# Instalar dependencias del sistema necesarias para Playwright y Prisma
RUN apk update && apk add openssl chromium
# Configurar variables de entorno para Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
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
# Instalar Chromium en la imagen final también
RUN apk update && apk add chromium
# Configurar variables de entorno para Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY ./package.json package-lock.json /app/
COPY server.js /app/server.js
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# Ya sé, pero ps no se copia
COPY public/sdk/sdk-script.js /app/public/sdk/sdk-script.js
WORKDIR /app
CMD ["npm", "run", "start"]