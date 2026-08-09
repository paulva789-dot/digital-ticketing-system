FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Build-time API/socket URLs are baked into the static bundle; override via --build-arg.
# Empty/relative values mean "same origin as the page" — nginx.conf proxies /api and
# /socket.io through to the backend container so this works without hardcoding a host.
ARG VITE_API_URL=""
ARG VITE_SOCKET_URL="/"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
