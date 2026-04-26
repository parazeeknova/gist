#!/bin/bash
set -e

# Add Go bin to PATH
export PATH="$PATH:$(go env GOPATH)/bin"

echo "Running gofumpt check..."
gofumpt -l -d .

echo "Running goimports check..."
goimports -l -d .

echo "Running golangci-lint..."
golangci-lint run
