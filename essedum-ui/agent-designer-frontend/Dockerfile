# Stage 1 — Build
FROM node:23-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2 — Serve with Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/index.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
