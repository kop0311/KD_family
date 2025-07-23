# Multi-stage Dockerfile for Next.js 15 with Turbopack
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner (Production)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create upload directories
RUN mkdir -p uploads/avatars uploads/medals
RUN chown -R nextjs:nodejs uploads

# Copy server files
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

USER nextjs

EXPOSE 3000 3001

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start both backend and frontend
CMD ["sh", "-c", "node server/server.js & node server.js"]