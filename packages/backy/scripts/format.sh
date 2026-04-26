#!/bin/bash
set -e

# Add Go bin to PATH
export PATH="$PATH:$(go env GOPATH)/bin"

echo "Running gofumpt..."
gofumpt -w .

echo "Running goimports..."
goimports -w .
