#!/bin/bash
# Run tests and report test coverage

if [ ! -d out ]; then
    mkdir out
fi

go test -coverprofile=cover.out -v
go tool cover -func=cover.out -o out/cover.txt
go tool cover -html=cover.out
rm cover.out
