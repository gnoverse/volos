FROM golang:1.23.6 AS builder

RUN apt-get update && apt-get install -y git make && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/stefann-01/gno.git
ARG BRANCH=feat/gnolend

WORKDIR /app

RUN git clone --branch $BRANCH --single-branch $REPO_URL src

WORKDIR /app/src

RUN make install.gnokey
RUN make install.gnodev

FROM debian:12-slim AS runtime

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /go/bin/gnodev /app/gnodev
COPY --from=builder /go/bin/gnokey /app/gnokey

COPY --from=builder /app/src /app/src

COPY ./r/ /app/src/examples/gno.land/r/
COPY ./p/ /app/src/examples/gno.land/p/

COPY ./keys.db /root/.config/gno/data/keys.db

ENV PATH="/app:${PATH}"
