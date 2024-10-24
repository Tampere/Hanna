# Load specific babashka version for now because latest version didn't work
FROM babashka/babashka:1.3.191-alpine

RUN apk add openjdk11

COPY . /app/mock-server.clj

WORKDIR /app

ENTRYPOINT [ "/app/mock-server.clj" ]

EXPOSE 3000
