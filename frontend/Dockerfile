# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --legacy-peer-deps
COPY . .
WORKDIR /app/frontend
RUN npm run build

# Run stage
FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
