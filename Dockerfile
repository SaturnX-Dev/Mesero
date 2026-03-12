# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Better-sqlite3 needs the build tools or pre-built binaries
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/types.ts ./src/
COPY --from=builder /app/src/data.ts ./src/

# We'll use tsx to run server.ts in production for simplicity with SQLite
# or we could transpile server.ts to JS. Let's keep tsx as per package.json.
RUN npm install -g tsx

EXPOSE 3000

# Use a volume for the database
VOLUME ["/app/data"]

# Redirect database path to the volume via environment variable or local config
# For now, let's assume it looks for restaurant.db in /app/data/
CMD ["tsx", "server.ts"]
