# Multi-stage build for the Essedum MFE topology: 1 host (shell-app-ui) + 4 child MFEs.
# Build context is expected to be the essedum-platform/ parent directory.

FROM node:24.1.0-alpine AS build

WORKDIR /workspace

# ---- Host (shell-app-ui) ---------------------------------------------------
# Built first so its node_modules and dist exist before the MFEs compile.
# MFE tsconfigs reference ../../shell-app-ui/projects/shared-lib via the
# "@essedum/shared-lib" path alias, so the shell sources must be on disk.
COPY essedum-ui/shell-app-ui/ ./shell-app-ui/
WORKDIR /workspace/shell-app-ui
RUN npm install --legacy-peer-deps --verbose
RUN npm run build-prod

# ---- MFEs ------------------------------------------------------------------
COPY essedum-ui/apps/ /workspace/apps/

WORKDIR /workspace/apps/agent
RUN npm install --legacy-peer-deps --verbose
RUN npm run build-prod

WORKDIR /workspace/apps/data-ops
RUN npm install --legacy-peer-deps --verbose
RUN npm run build-prod

WORKDIR /workspace/apps/integration
RUN npm install --legacy-peer-deps --verbose
RUN npm run build-prod

WORKDIR /workspace/apps/vibe-studio
RUN npm install --legacy-peer-deps --verbose
RUN npm run build-prod


# ---- Runtime ---------------------------------------------------------------
FROM nginx:alpine

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 \
      -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/server.key \
      -out /etc/nginx/ssl/server.crt \
      -subj "/CN=localhost"

COPY essedum-ui/nginx_ui_multi.conf /etc/nginx/nginx.conf

WORKDIR /app
RUN mkdir -p /app/ui/shell \
             /app/ui/agent \
             /app/ui/data-ops \
             /app/ui/integration \
             /app/ui/vibe-studio

COPY --from=build /workspace/shell-app-ui/dist/common-app       /app/ui/shell/
COPY --from=build /workspace/apps/agent/dist/agent              /app/ui/agent/
COPY --from=build /workspace/apps/data-ops/dist/data-ops        /app/ui/data-ops/
COPY --from=build /workspace/apps/integration/dist/integration  /app/ui/integration/
COPY --from=build /workspace/apps/vibe-studio/dist/vibe-studio  /app/ui/vibe-studio/

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN chmod -R 755 /app/ui

WORKDIR /

# Single ingress port served by nginx_ui_multi.conf (HTTPS).
EXPOSE 8084

ENTRYPOINT ["/entrypoint.sh"]
