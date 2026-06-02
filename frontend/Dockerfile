FROM node:18-alpine AS builder

WORKDIR /app

ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN npm install -g serve@14.2.0 && npm cache clean --force

COPY --from=builder /app/build ./build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["serve", "-s", "build", "-l", "3000"]
