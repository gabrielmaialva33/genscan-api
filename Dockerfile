FROM library/postgres
COPY ./init.sql /docker-entrypoint-initdb.d/

# Build AdonisJS
FROM node:lts-alpine AS builder
# Set directory for all files
WORKDIR /home/node
# Copy over package.json files
COPY package*.json pnpm-lock.yaml ./
# Install pnpm globally
RUN npm install -g pnpm
# Install build dependencies
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
# Install all packages
RUN pnpm install
# Copy over source code
COPY . .
# Clean any existing build artifacts
RUN rm -rf build node_modules/.cache .tmp
# Build AdonisJS for production
RUN pnpm build

# Build final runtime container
FROM node:lts-alpine
# Set environment variables
ENV NODE_ENV=production
ENV APP_ENV=production
ENV LOG_LEVEL=info
# Set home dir
WORKDIR /home/node
# Install runtime dependencies including netcat for health checks
RUN apk add --update python3 make g++ netcat-openbsd && rm -rf /var/cache/apk/*
# Copy over built files
COPY --from=builder /home/node/build .
# Copy docker entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# Install pnpm globally
RUN npm install -g pnpm
# Install only production packages
RUN pnpm install --prod --frozen-lockfile
# Expose port to outside world
EXPOSE 3333
# Use custom entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
