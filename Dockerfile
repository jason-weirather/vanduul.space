FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/docs /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
