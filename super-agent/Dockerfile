FROM node:22-slim AS builder
WORKDIR /app
COPY super-agent/package.json super-agent/package-lock.json super-agent/tsconfig.json ./
RUN npm ci
COPY super-agent/src/ src/
COPY super-agent/ord-data/ ord-data/
RUN rm -f src/*.test.ts && npm run build

FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/open-resource-discovery/a2a-ord-demo
LABEL org.opencontainers.image.description="A2A ORD Demo - Super Agent"
LABEL org.opencontainers.image.licenses=Apache-2.0

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ord-data ./ord-data
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3002
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
