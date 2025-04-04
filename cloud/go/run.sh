#!/bin/bash

cd ./cmd/
go build -o ../bin/
cd -
export FUNCTION_TARGET=SolveHTTP
./bin/cmd
