FROM golang:1.23.1 AS builder

RUN apt-get update && apt-get install -y git make && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone https://github.com/gnolang/tx-indexer.git src

WORKDIR /app/src

RUN make

FROM gcr.io/distroless/base-debian12

WORKDIR /app

COPY --from=builder /app/src/build/tx-indexer /app/tx-indexer

ENV PATH="/app:${PATH}"

CMD ["tx-indexer", "start", "--remote", "http://localhost:26657",  "--db-path", "indexer-db", "--listen-address", "localhost:3100"]
