# Stage 1: Production dependencies
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Test environment with devDependencies
FROM node:22-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]

# Stage 3: Minimal production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

USER node

COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node migrations/ ./migrations/
COPY --chown=node:node docs/ ./docs/

EXPOSE 3000

CMD ["sh", "-c", "npx node-pg-migrate up -m migrations && node src/server.js"]

