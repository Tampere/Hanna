##
# Production Dockerfile
##

###
# Base image declaration
###
FROM node:24.12.0-alpine AS base

ENV APPDIR /app

WORKDIR ${APPDIR}/shared

COPY shared/package*.json ./
RUN npm ci

COPY shared ./
RUN npm run build

# Install backend dependencies for tRPC client
WORKDIR ${APPDIR}/backend

COPY backend/package*.json ./
RUN npm ci

###
# Frontend build stage
###
FROM base AS frontend-build

WORKDIR ${APPDIR}/frontend

COPY frontend/package*.json ./
COPY frontend/patches ./patches

RUN npm ci

COPY frontend ./
COPY backend ../backend

# Build argument for the app version (to be injected into the application)
ARG APP_VERSION
ENV APP_VERSION ${APP_VERSION}

ARG VITE_FEATURE_SAP_REPORTS
ENV VITE_FEATURE_SAP_REPORTS ${VITE_FEATURE_SAP_REPORTS}

RUN npm run build

###
# Backend build stage
###
FROM base AS backend-build

WORKDIR ${APPDIR}/backend

COPY backend ./

RUN npm run build
# Remove src directory so the "@src" path always falls back to dist/ directory
RUN rm -rf src

###
# Main image build
###
FROM base AS main

WORKDIR ${APPDIR}/backend

# Remove the shared src folder to fix the runtime "@shared" path
RUN rm -rf ../shared/src

COPY --from=backend-build ${APPDIR}/backend ./
COPY --from=frontend-build ${APPDIR}/frontend/dist ./static/

ENV TZ=Europe/Helsinki

# Get extra hosts from build arguments and inject to environment for runtime access
ARG EXTRA_HOSTS
ENV EXTRA_HOSTS ${EXTRA_HOSTS}

CMD \
  # Append extra host definitions if given
  echo "${EXTRA_HOSTS}" >> /etc/hosts && \
  # Execute DB migrations
  npm run db-migrate:prod && \
  # Start the application
  npm start
