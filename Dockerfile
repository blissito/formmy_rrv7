FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY . /app/
# COPY ./package.json package-lock.json /app/
WORKDIR /app
# Instalar todas las dependencias necesarias para Chromium en Alpine
RUN apk update && apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*
# Configurar variables de entorno para Playwright y Puppeteer
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
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
# Instalar Chromium y todas las dependencias necesarias en la imagen final
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    # Dependencias adicionales para Puppeteer en Alpine
    libx11 \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxi \
    libxtst \
    libxrandr \
    libxscrnsaver \
    alsa-lib \
    pango \
    at-spi2-core \
    gtk+3.0 \
    && rm -rf /var/cache/apk/*
# Configurar variables de entorno para Playwright y Puppeteer
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# Configuración adicional para evitar sandbox en contenedor
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/
# Variables críticas para contenedores
ENV CHROMIUM_FLAGS="--no-sandbox --disable-dev-shm-usage --disable-gpu"
ENV DISPLAY=:99
# Configuración de memoria compartida
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

COPY ./package.json package-lock.json /app/
COPY server.js /app/server.js
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# Ya sé, pero ps no se copia
COPY public/sdk/sdk-script.js /app/public/sdk/sdk-script.js
WORKDIR /app
CMD ["npm", "run", "start"]