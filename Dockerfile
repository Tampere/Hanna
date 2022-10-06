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
RUN npm run build

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
# Remove src directory so the "@src" path always falls back to dist/ directory
RUN rm -rf src

###
# Main image build
###
FROM base AS main

WORKDIR ${APPDIR}/backend

COPY --from=backend-build ${APPDIR}/backend ./
COPY --from=frontend-build ${APPDIR}/frontend/dist ./static/

ENV TZ=Europe/Helsinki

CMD npm run db-migrate:prod && npm start
