FROM node:24.12.0-alpine

COPY . /app/

RUN cd /app && npm install --omit=dev

EXPOSE 9090

WORKDIR /app

CMD npx tsx index.ts
