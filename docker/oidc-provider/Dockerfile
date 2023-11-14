FROM node:18-alpine

COPY . /app/

RUN cd /app && npm install --omit=dev

EXPOSE 9090

WORKDIR /app

CMD npx ts-node index.ts
