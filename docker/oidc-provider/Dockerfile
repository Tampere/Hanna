FROM node:24.12.0-alpine3.23

COPY . /app/

RUN cd /app && npm install --omit=dev

EXPOSE 9090

WORKDIR /app

CMD node --loader ts-node/esm index.ts
