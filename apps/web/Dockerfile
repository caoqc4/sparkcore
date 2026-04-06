FROM mirror.gcr.io/library/node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

WORKDIR /app/apps/web

COPY apps/web/package.json ./package.json
COPY apps/web/package-lock.json ./package-lock.json
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --no-fund

WORKDIR /app
COPY . .

WORKDIR /app/apps/web
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
