FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY . /app/
# COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN apk update && apk add openssl
RUN npx prisma generate
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine
COPY ./package.json package-lock.json /app/
COPY server.js /app/server.js
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
# Ya sé, pero ps no se copia
COPY public/sdk/sdk-script.js /app/public/sdk/sdk-script.js
WORKDIR /app
CMD ["npm", "run", "start"]