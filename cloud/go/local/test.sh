#!/bin/bash
# Run tests and report test coverage

go test ../ -coverprofile=cover.out -v
go tool cover -func=cover.out -o cover.txt
go tool cover -html=cover.out
rm cover.out
