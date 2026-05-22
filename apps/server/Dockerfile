FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Install dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --filter @vedaai/server...

# Build shared
COPY packages/shared ./packages/shared
RUN pnpm --filter @vedaai/shared build

# Build server
COPY apps/server ./apps/server
RUN pnpm --filter @vedaai/server build

# Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/server/dist ./dist
COPY --from=base /app/apps/server/package.json ./

RUN mkdir -p ./storage/pdfs

EXPOSE 4000

CMD ["node", "dist/index.js"]
