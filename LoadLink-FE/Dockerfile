FROM node:20-alpine AS builder
WORKDIR /app
COPY LoadLink-FE/package*.json ./
RUN npm ci
COPY LoadLink-FE/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "server.js"]