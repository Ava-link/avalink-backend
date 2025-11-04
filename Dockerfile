# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=25.1.0
ARG NPM_VERSION=9.2.0
ARG PNPM_VERSION=10.19.0

FROM node:${NODE_VERSION}-bookworm AS base
ENV NODE_ENV=production
WORKDIR /app

# Install corepack first, then enable it and prepare package managers
RUN npm install -g corepack --force \
  && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate \
  && npm i -g npm@${NPM_VERSION}

# ----------------------
# Builder: install dev deps, build TS
# ----------------------
FROM base AS builder
ENV NODE_ENV=development
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma

# Install with lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# Generate Prisma Client with dev deps available
RUN pnpm prisma generate

# Copy source and build
COPY src ./src
RUN pnpm build

# ----------------------
# Prod deps only + prisma client
# ----------------------
FROM base AS prod-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile --prod \
  && pnpm prisma generate

# ----------------------
# Runtime image
# ----------------------
FROM base AS runner
WORKDIR /app

# Copy production node_modules and built app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/prisma ./prisma

# Default port per src/config/env.ts (PORT default 3001)
ENV PORT=3002
EXPOSE 3002

# Healthier default: crash on unhandled rejections
ENV NODE_OPTIONS=--unhandled-rejections=strict

CMD ["node", "dist/index.js"]