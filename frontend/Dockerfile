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
# --- Stage 1: The "builder" stage ---  
# Use a full Node.js image to build our app  
FROM node:18-alpine AS builder  
# Set the working directory inside the container  
WORKDIR /app  

# Copy package.json and package-lock.json (or yarn.lock)  
COPY package*.json ./  
# Copy .env file to make environment variables available during build
COPY .env ./

# Install all dependencies (including devDependencies)  
RUN npm ci  

# Copy the rest of the application source code  
COPY . .  

# Build the React app
RUN npm run build

# --- Stage 2: The "production" stage ---
# Start from a fresh, lightweight base image
FROM node:18-alpine AS production
WORKDIR /app

# Install serve globally to serve the static build
RUN npm install -g serve

# Copy only the build folder from the builder stage
COPY --from=builder /app/build ./build

# Expose the port the app listens on
EXPOSE 3000

# The command to run the application
CMD ["serve", "-s", "build", "-l", "3000"] 