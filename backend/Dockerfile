# ===========================================
# STUDENT TODO: Create Frontend Dockerfile
# ===========================================
#
# Requirements:
# 1. Must use multi-stage build
# 2. Stage 1 (builder):
#    - Use node:18-alpine
#    - Install dependencies with npm ci
#    - Build the React app with npm run build
#
# 3. Stage 2 (production):
#    - Use node:18-alpine
#    - Install 'serve' package globally to serve static files
#    - Copy only the build folder from builder stage
#    - Expose port 3000
#    - Use serve to run the app
#
# Hints:
# - npm run build creates a 'build' folder
# - serve -s build -l 3000 serves the static files
# - Research: "Docker multi-stage React production"
# ===========================================

# YOUR CODE HERE:
# ===========================================
# STAGE 1: Build Stage
# ===========================================
# Use a specific Node.js version on a lightweight Alpine Linux base.
# stage "builder" 
FROM node:18-alpine AS builder

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's layer caching.
# If these files don't change, Docker won't re-run `npm ci`.
COPY package*.json ./

# Install all dependencies, including devDependencies needed for building or testing.
RUN npm ci

# Copy the rest of the application source code.
COPY . .

# ===========================================
# STAGE 2: Production Stage
# ===========================================
# Start a new, clean stage from the same lightweight base image.
FROM node:18-alpine

# Install curl for the healthcheck command in docker-compose.yml
RUN apk add --no-cache curl

# Set the working directory.
WORKDIR /app

# Copy only the production dependencies from the "builder" stage.
COPY --from=builder /app/node_modules ./node_modules

# Copy the application code from the "builder" stage.
COPY --from=builder /app .

# Expose the port the app runs on.
EXPOSE 8080

# The command to run the application.
CMD ["node", "server.js"]