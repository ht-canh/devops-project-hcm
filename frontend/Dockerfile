# ===========================================
# Stage 1: Build React app
# ===========================================
FROM node:18-alpine AS builder

WORKDIR /app

# copy package files
COPY package*.json ./

# set npm registry (fix network issue)
RUN npm config set registry https://registry.npmjs.org/

# install dependencies
RUN npm install

# copy source code
COPY . .

# build react app
RUN npm run build


# ===========================================
# Stage 2: Production
# ===========================================
FROM node:18-alpine

WORKDIR /app

# install serve
RUN npm install -g serve

# copy build files
COPY --from=builder /app/build ./build

# expose port
EXPOSE 3000

# start server
CMD ["serve", "-s", "build", "-l", "3000"]
