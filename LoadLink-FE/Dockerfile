# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY LoadLink-FE/package*.json ./
RUN npm ci

COPY LoadLink-FE/ .
RUN npm run build   # This creates .next folder

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]