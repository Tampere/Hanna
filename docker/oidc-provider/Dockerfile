FROM node:18.18.0-alpine

COPY . /app/

RUN cd /app && npm install --omit=dev

EXPOSE 9090

WORKDIR /app

CMD node --loader ts-node/esm index.ts
