# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ . 
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
# Note: check if npm run build creates a folder named 'build' or 'dist'
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]