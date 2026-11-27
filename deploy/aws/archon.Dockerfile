# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS api
WORKDIR /app
COPY server/package.json deploy/aws/server.package-lock.json ./
RUN mv server.package-lock.json package-lock.json && npm ci --omit=dev
COPY server/ ./
ENV NODE_ENV=production
USER node
CMD ["node", "server.js"]

FROM python:3.12-slim AS agent
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 OUTPUT_DIR=/tmp/archon-output
WORKDIR /app
COPY agent/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0
COPY agent/ ./agent/
USER 10001:10001
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "660", "--access-logfile", "-", "agent.server:app"]

FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
ARG PUBLIC_ORIGIN
ENV ARCHON_API_URL=http://api:5555 \
    NEXT_PUBLIC_API_URL=${PUBLIC_ORIGIN}/backend \
    NEXT_PUBLIC_SERVER_URL=${PUBLIC_ORIGIN}/backend \
    NEXT_PUBLIC_AGENT_URL=${PUBLIC_ORIGIN}/agent \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev && chown -R node:node .next
ENV NODE_ENV=production
USER node
CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]
