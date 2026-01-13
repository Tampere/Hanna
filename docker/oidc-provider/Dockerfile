FROM node:20.19.6-alpine

COPY . /app/

RUN cd /app && npm install --omit=dev

EXPOSE 9090

WORKDIR /app

CMD node --loader ts-node/esm index.ts
