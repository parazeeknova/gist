FROM oven/bun:slim AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY packages/weby/package.json ./packages/weby/
COPY packages/backy/package.json ./packages/backy/
RUN bun install --frozen-lockfile --filter @verso/weby

FROM oven/bun:slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY packages/weby ./packages/weby
COPY lerna.json nx.json ./
RUN bun run --cwd packages/weby build

FROM nginx:alpine-slim AS production
COPY packages/weby/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/packages/weby/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
