FROM golang:1.23.1 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o backend main.go

FROM gcr.io/distroless/base-debian12

WORKDIR /app
COPY --from=builder /app/backend .
COPY firebase.json ./firebase.json

CMD ["./backend"]
