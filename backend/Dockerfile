# -------- Giai đoạn 1: Builder (Cài đặt và chuẩn bị) --------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy file quản lý thư viện
COPY package*.json ./

# Cài đặt tất cả thư viện (kể cả devDependencies để chạy test nếu cần)
RUN npm install

# Copy toàn bộ code nguồn
COPY . .

# -------- Giai đoạn 2: Production (Chỉ giữ lại những gì cần để chạy) --------
FROM node:18-alpine

WORKDIR /app

# Chỉ copy file package.json để chạy lệnh start
COPY package*.json ./

# Chỉ cài đặt thư viện cần thiết cho môi trường chạy (Production) để giảm dung lượng
RUN npm install --only=production

# Copy file server.js từ giai đoạn builder sang
COPY --from=builder /app/server.js ./

# Mở cổng 8080 cho Backend
EXPOSE 8080

# Lệnh khởi động server
CMD ["node", "server.js"]