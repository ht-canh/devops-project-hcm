# ===========================================
# STUDENT TODO: Create a Multi-Stage Dockerfile
# ===========================================
#
# Requirements:
# 1. Stage 1 (builder):
#    - Use node:18-alpine as base
FROM node:18-alpine AS builder
#    - Set working directory
WORKDIR /app
#    - Copy package files and install ALL dependencies
COPY package*.json ./

RUN npm ci 

COPY . .

# 2. Stage 2 (production):
#    - Use node:18-alpine as base
FROM node:18-alpine AS production
#    - Set working directory
WORKDIR /app
#    - Copy only package files from builder
COPY --from=builder /app/package*.json ./
#    - Install ONLY production dependencies (hint: --only=production)
RUN npm ci --only=production
#    - Copy application code from builder
COPY --from=builder /app ./
#    - Expose the correct port
EXPOSE 8080
#    - Set the start command
#
CMD ["npm", "start"]
# Hints:
# - Research: "Docker multi-stage build Node.js"
# - Use COPY --from=builder to copy between stages
# - Final image should be as small as possible
# ===========================================
