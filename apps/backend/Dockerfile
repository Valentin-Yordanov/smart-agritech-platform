# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility and CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package dependency definitions and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for nest build)
RUN npm ci

# Copy application source code and configuration files
COPY . .

# Generate Prisma Client binary engine for Debian/Linux
RUN npx prisma generate

# Build the production NestJS application
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install OpenSSL runtime libraries for Prisma QueryEngine
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests, node_modules, schema, and compiled artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Run as non-root node user for container security
USER node

EXPOSE 8080

CMD ["node", "dist/main"]
