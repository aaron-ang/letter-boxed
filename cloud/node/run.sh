#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pnpm install

if ! command -v tsc &>/dev/null; then
    pnpm add -g typescript
fi

# Transpile TypeScript to JavaScript
echo -e "${BLUE}Transpiling TypeScript files...${NC}"
pnpm tsc || {
    echo -e "${RED}TypeScript compilation failed!${NC}"
    exit 1
}

# Run tests
echo -e "${BLUE}Running tests...${NC}"
pnpm test || {
    echo -e "${RED}Tests failed!${NC}"
    exit 1
}

# Start server
echo -e "${BLUE}Starting server...${NC}"
pnpm start
