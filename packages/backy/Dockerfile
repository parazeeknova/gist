FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /build
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GO111MODULE=on
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN go build -a -installsuffix cgo \
    -ldflags="-w -s -extldflags '-static'" \
    -o bin/backy \
    .

FROM alpine:3.21 AS runtime
RUN apk add --no-cache ca-certificates && \
    addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /build/bin/backy .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 7000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:7000/health || exit 1
ENTRYPOINT ["./backy"]
