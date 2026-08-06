FROM node:24-bookworm-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json backend/
COPY frontend/package.json frontend/package-lock.json frontend/

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN npm ci --prefix backend
RUN npm ci --prefix frontend

COPY frontend/ frontend/
RUN npm --prefix frontend run build

COPY backend/ backend/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "cd backend && npm run db:migrate && npm run db:seed:all && node src/server.js"]