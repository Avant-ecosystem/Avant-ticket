FROM node:20-alpine AS base

WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* ./
RUN yarn install --frozen-lockfile || npm ci

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build || npm run build

# Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]

