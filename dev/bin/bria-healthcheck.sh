#!/bin/sh

PORT=2742
HOST=localhost

if nc -z -w 5 $HOST $PORT 2>/dev/null; then
    echo "Port $PORT is open and listening"
    exit 0
else
    echo "Port $PORT is not open"
    exit 1
fi
