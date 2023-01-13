FROM babashka/babashka:alpine

RUN apk add openjdk11

COPY . /app/mock-server.clj

WORKDIR /app

RUN bb

ENTRYPOINT [ "/app/mock-server.clj" ]

EXPOSE 3000
