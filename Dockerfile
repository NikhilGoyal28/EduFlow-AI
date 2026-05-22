# ==========================================
# Phase 1: Build Phase
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (leverages Docker cache layers)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the production bundle
RUN npm run build

# ==========================================
# Phase 2: Nginx Web Server Phase
# ==========================================
FROM nginx:alpine

# Copy built frontend assets from the build stage to Nginx directory
COPY --from:build /app/dist /usr/share/nginx/html

# Copy customized Nginx config for Single Page App routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
