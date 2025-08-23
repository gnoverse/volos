FROM golang:1.23.6 AS builder

RUN apt-get update && apt-get install -y git make && rm -rf /var/lib/apt/lists/*

ARG REPO_URL=https://github.com/stefann-01/gno.git
ARG BRANCH=feat/gnolend

WORKDIR /app

RUN git clone --branch $BRANCH --single-branch $REPO_URL src

WORKDIR /app/src

RUN make build -C ./contribs/gnodev

FROM debian:12-slim AS runtime

WORKDIR /app

COPY --from=builder /app/src/contribs/gnodev/build/gnodev /app/gnodev
COPY --from=builder /app/src /app/src

COPY ./r/volos/* /app/src/examples/gno.land/r/volos/
COPY ./p/volos/* /app/src/examples/gno.land/p/volos/

ENV PATH="/app:${PATH}"

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

CMD ["gnodev", "-paths", "gno.land/r/volos/**,gno.land/r/gnoswap/**", "-node-rpc-listener", "0.0.0.0:26657", "-web-listener", "0.0.0.0:8888"]
