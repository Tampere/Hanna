##
# Production Dockerfile
##

###
# Base image declaration
###
FROM node:18.10-alpine AS base

ENV APPDIR /app

WORKDIR ${APPDIR}/shared

COPY shared/package*.json ./
RUN npm ci

COPY shared ./

###
# Frontend build stage
###
FROM base AS frontend-build

WORKDIR ${APPDIR}/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./

RUN npm run build

###
# Backend build stage
###
FROM base AS backend-build

WORKDIR ${APPDIR}/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend ./

RUN npm run build

###
# Main image build
###
FROM base AS main

# Shared package needs to be built for the runtime production image.
# Cannot be built in the base image, because Vite build doesn't work well with CommonJS.
WORKDIR ${APPDIR}/shared
RUN npm run build

WORKDIR ${APPDIR}/backend

COPY --from=backend-build ${APPDIR}/backend ./
COPY --from=frontend-build ${APPDIR}/frontend/dist ./static/

ENV TZ=Europe/Helsinki

CMD npm run db-migrate && npm start
