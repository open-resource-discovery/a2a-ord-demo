FROM node:22-slim AS builder
WORKDIR /app
COPY spaceship-app/package.json spaceship-app/package-lock.json spaceship-app/tsconfig.json ./
RUN npm ci
COPY spaceship-app/src/ src/
COPY spaceship-app/ord-data/ ord-data/
RUN rm -f src/*.test.ts && npm run build

FROM node:22-slim

LABEL org.opencontainers.image.source=https://github.com/open-resource-discovery/a2a-ord-demo
LABEL org.opencontainers.image.description="A2A ORD Demo - Spaceship App"
LABEL org.opencontainers.image.licenses=Apache-2.0

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ord-data ./ord-data
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3001
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
