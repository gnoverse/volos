FROM golang:1.23.1
RUN useradd -ms /bin/sh -u 1001 app
USER app

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY --chown=app:app . .
