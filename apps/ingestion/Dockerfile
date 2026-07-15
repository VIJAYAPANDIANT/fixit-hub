# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY go.mod ./
# Download dependencies (skip verification for local speeds, caching will handle it)
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /fixit-ingestion ./main.go

# Production stage
FROM alpine:3.18

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /

COPY --from=builder /fixit-ingestion /fixit-ingestion

EXPOSE 5001

CMD ["/fixit-ingestion"]
